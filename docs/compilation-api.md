---
title: Using the Slang Compilation API
layout: page
description: Using the Slang Compilation API
permalink: "/docs/compilation-api/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

## Using the Slang Compilation API

This tutorial explains the flow of calls needed to use the Slang Compilation API. The overall sequence is described in [Basic Compilation](#basic-compilation) followed by a discussion on more advanced topics.

Using the compilation API offers much more control over compilation compared to `slangc`, and with better performance as well. For applications with complex needs, or ones that are sensitive to compilation performance, it is recommneded to use the Compilation API.

The Slang compilation API is provided as a dynamic library. Linking to it, you have access to the compilation API which is organized in a Component Object Model (COM) fashion.  The Slang [User Guide](https://shader-slang.com/slang/user-guide/compiling.html#using-the-compilation-api) describes Slang's "COM-lite" interface a bit more.

## Table of Contents

* [Basic Compilation](#basic-compilation)
* [Precompiled Modules](#precompiled-modules)
* [Specialization](#specialization)
* [Dynamic Dispatch](#dynamic-dispatch)
* [Diagnostics](#diagnostics)
* [Features Accessible Through Additional Interfaces](#features-accessible-through-additional-interfaces)
* [Post-Compilation Reflection](#post-compilation-reflection)
* [Complete Example](#complete-example)

### Basic Compilation

This is the overall flow needed to compile even the simplest applications.

1. [Create Global Session](#create-global-session)
2. [Create Session](#create-session)
3. [Load Modules](#load-modules)
4. [Query Entry Point(s)](#query-entry-points)
5. [Compose Modules + Entry Points](#compose-modules-and-entry-points)
6. [Link Program](#link)
7. [Get Target Kernel Code](#get-target-kernel-code)

### Step-by-step
#### Includes
The main header file is `slang.h`, though you also need `slang-com-ptr.h` to have the definition of Slang::ComPtr used throughout the API. `slang-com-helper.h` is nice to have, since it provides helpers for checking API return values and otherwise using COM.
```cpp
#include "slang.h"
#include "slang-com-ptr.h"
#include "slang-com-helper.h"
```

#### Create Global Session
The global API call to `createGlobalSession` is always going to be the first runtime step, since it establishes a connection to the Slang API implementation.

```cpp
    Slang::ComPtr<slang::IGlobalSession> globalSession;
    createGlobalSession(globalSession.writeRef());
```

#### Create Session
To read more about what sessions are all about, see [About Sessions](#about-sessions).
Creating a session sets the configuration for what you are going to do with the API.

The `SessionDesc` object holds all the configuration for the Session.

* A list of enabled compilation targets (with their options)
* A list of search paths (for `#include` and `import`)
* A list of pre-defined macros

```cpp
    slang::SessionDesc sessionDesc = {};
```

##### List of enabled compilation targets

Here, only one target is enabled, `spirv_1_5`. You can enable more targets, for example, if you need to be able to compile the same source to DXIL as well as SPIRV.
```cpp
    slang::TargetDesc targetDesc = {};
    targetDesc.format = SLANG_SPIRV;
    targetDesc.profile = globalSession->findProfile("spirv_1_5");

    sessionDesc.targets = &targetDesc;
    sessionDesc.targetCount = 1;
```

##### Preprocessor defines

Slang supports using the preprocessor.
```cpp
    std::array<slang::PreprocessorMacroDesc, 2> preprocessorMacroDesc =
        {
            { "BIAS_VALUE", "1138" },
            { "OTHER_MACRO", "float" }
        };
    sessionDesc.preprocessorMacros = preprocessorMacroDesc.data();
    sessionDesc.preprocessorMacroCount = preprocessorMacroDesc.size();
```

##### Compiler options

Here is where you can specify Session-wide options. Check the [User Guide](https://shader-slang.com/slang/user-guide/compiling.html#compiler-options) for info on available options.

```cpp
    std::array<slang::CompilerOptionEntry, 1> options = 
        {
            {
                slang::CompilerOptionName::EmitSpirvDirectly,
                {slang::CompilerOptionValueKind::Int, 1, 0, nullptr, nullptr}
            }
        };
    sessionDesc.compilerOptionEntries = options.data();
    sessionDesc.compilerOptionEntryCount = options.size();
```

##### Create the session

With a fully populated `SessionDesc`, the session can be created.

```cpp
    Slang::ComPtr<slang::ISession> session;
    globalSession->createSession(sessionDesc, session.writeRef());
```

#### Load Modules

Modules are the granularity of shader source code that can be compiled in Slang. When using the compilation API, there are two main functions to consider.

`ISession::loadModule()` takes a module name and functions like an "import" statement in shader code. If already loaded, the cached result in the session is returned. Otherwise, it scours the search paths defined in the session for a file named `<module_name>.slang`.

`ISession::loadModuleFromSourceString()` essentially loads shader source code directly from memory in the `source` parameter, though it also takes parameters for `moduleName` and `path` which require explanation. `moduleName` gives the blob of source its identifier. It serves the same purpose as the `moduleName` provided to the loadModule() overload, except that Slang won't need go and look for a file on disk with that name. Other modules will still be able to refer to the newly loaded module by this name. `path` is used as a backup key for caching the module in the session, which is only likely to be used if a shader uses path-based import statements, e.g. `import "../mymodule.slang";`. Specifying `nullptr` as `path` effectively causes Slang to cache based only on `moduleName`.

```cpp
    Slang::ComPtr<slang::IModule> slangModule;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        const char* moduleName = "shortest";
        const char* modulePath = "shortest.slang";
        slangModule = session->loadModuleFromSourceString(moduleName, modulePath, shortestShader, diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        if (!slangModule)
        {
            return -1;
        }
    }
```

##### Life Time of Modules

Modules are owned by the slang Session. Once loaded, they are valid as long as the Session is valid.

#### Query Entry Points

Slang shaders may contain many entry points, and it's necessary to be able to identify them programatically in the Compilation API in order to select which entry points to compile.

A common way to query an entry-point is by using the `IModule::findEntryPointByName` method, which will search the Module's reflection data and return the one which, for example, has the name "computeMain" as seen below. In order for `findEntryPointByName` to suceed, the entry-point function must be decorated with the shader attribute in source, e.g. `[shader("compute")]`. If the entry-point is not explicitly marked, it's necessary to use the `IModule::findAndCheckEntryPoint` function instead.

`IModule::findAndCheckEntryPoint` is an alternative way to query entry-points from a module, and it works even if the function was not marked with the `[shader]` attribute. Because functions that lack the `[shader]` attribute, are not validated as entry-points during `loadModule`, that skipped validation is performed during `IModule::findAndCheckEntryPoint` instead.

```cpp
    Slang::ComPtr<slang::IEntryPoint> entryPoint;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        slangModule->findEntryPointByName("computeMain", entryPoint.writeRef());
        if (!entryPoint)
        {
            std::cout << "Error getting entry point" << std::endl;
            return -1;
        }
    }
```

It is also possible to query entry-points by index, and work backwards to check the name of the entry-points that are returned at different indices.
Check the [User Guide](https://shader-slang.com/slang/user-guide/reflection.html#program-reflection) for info.

#### Compose Modules and Entry Points

Up to this point, modules have been loaded, and entry points have been identified, but to move forward with defining a GPU program, the relevant subset need to be selected for _composition_ into a unified program.

```cpp
    std::array<slang::IComponentType*, 2> componentTypes =
        {
            slangModule,
            entryPoint
        };

    Slang::ComPtr<slang::IComponentType> composedProgram;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = session->createCompositeComponentType(
            componentTypes.data(),
            componentTypes.size(),
            composedProgram.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

#### Link

Ensure that there are no missing dependencies in the composed program by using `link()`.

```cpp
    Slang::ComPtr<slang::IComponentType> linkedProgram;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = composedProgram->link(
            linkedProgram.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

#### Get Target Kernel Code

Finally, it's time to compile the linked Slang program to the target format.

Calling `IComponentType::getEntryPointCode()` will perform the final compilation to the target language and return an `IBlob` pointer to it. As the name implies, it compiles target code for a single entry-point, identified by the first integer argument, into the target format identified by the second integer argument. The component type must not contain any specialization parameters (it must be fully specialized), and it must not have any unmet requirements (it must be fully linked).

```cpp
    // ... loadModule()

    // ... findEntryPointByName() or findAndCheckEntryPoint()

    // ... createCompositeComponentType()

    // ... link()

    Slang::ComPtr<slang::IBlob> spirvCode;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = linkedProgram->getEntryPointCode(
            0, // entryPointIndex
            0, // targetIndex
            spirvCode.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

Alternatively, there is also a function `IComponentType::getTargetCode()` which will compile all entry-points, which is useful for SPIR-V and Metal targets which support multiple entry-points per shader.

You can skip the `createCompositeComponentType()` where entry-points are identified altogether, and instead directly call `link()` on the Module to pull in its dependencies without having chosen any entry-points. `getTargetCode()` will then return a unified GPU kernel with multiple entry-points.

```cpp
    // ... loadModule()

    // ... link()

    Slang::ComPtr<slang::IBlob> spirvCode;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = linkedProgram->getTargetCode(
            0, // targetIndex
            spirvCode.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

`spirvCode->getBufferPointer()` is then used to access the compiled data, and `spirvCode->getBufferSize()` is its size.

Both methods cache results within the session and will return a pre-compiled blob when given the same request.

About Sessions
--------------

#### What's a session?

A session is a scope for caching and reuse. As you use the Slang API, the session caches everything that is loaded in it.

For example, if you import a module `foo` in several other modules, `foo` is only compiled once during the session.

The same is true for target binaries. If you request the same target binary multiple times during a session, Slang will compile only the first time and return a cached result every other time.

It's strongly recommended to use as few session objects as possible in applications (more on that, shortly), as it is much more efficient than always using fresh sessions with empty caches.

Using long-lived sessions with Slang API is a big advantage over compiling with the standalone `slangc` compiler executable, since each invocation of `slangc` creates a new session object by necessity.

#### When do I need a new Session?

A session does have some global state in it which currently makes it unable to cache and reuse artifacts, namely, the `#define` configurations. Unique combinations of preprocessor `#defines` used in your shaders will require unique session objects.

The Slang language philosophy with respect to supporting multiple target variations is to specialize using generics and interfaces as opposed to `#define`s. Shader systems designed with preprocessor as the primary means to specialize may find the need to create many sessions. For this, and other reasons, the recommendation is to limit preprocessor usage and use as few session objects as possible to get the best reuse and performance.

Precompiled Modules
-------------------

Modules are loaded into the session as described in [Load Modules](#load-modules). There is processing involved in that, as the raw source code needs to be compiled to the Slang internal representation, IR for short. Once loaded, that module does not need to be recompiled for the duration of the [Session](#about-sessions).

Slang offers the capability to save modules to disk after this initial processing, allowing for faster initial module load times.

API methods for module precompilation are described in the [User Guide](https://shader-slang.com/slang/user-guide/link-time-specialization.html#using-precompiling-modules-with-the-api).

Specialization
--------------

#### Link-time Constants

This form of specialization involves placing relevant constant definitions in a separate Module that can be selectively included. For example, if you have two variants of a shader that differ in constants that they use, you can create two different Modules for the constants, one for each variant. When composing one variant or the other, just select the right constants module in createCompositeComponentType(). This is described also in the [User Guide](https://shader-slang.com/slang/user-guide/link-time-specialization.html#link-time-constants)

#### Link-time Types

Similar to Link-time Constants. This form of specialization simply puts different versions of user types in separate modules so that the needed implementation can be selected when creating the CompositeComponentType.
[User Guide](https://shader-slang.com/slang/user-guide/link-time-specialization.html#link-time-types)

#### Generics Specialization

Say you have a shader that has a feature in it that can be in one of two states, "High Quality" and "Low Quality". One way to support both modes of operation is to use generics. Put the logic for the two modes into two structs, both conforming to an interface (e.g. `IQuality`) that can be consistently used by callers.

Then adding to the entrypoint a generic parameter of `IQuality` type would let you choose between high and low quality modes during link-time.

Given the shader:

```hlsl
RWStructuredBuffer<float> result;

interface IQuality
{
    static float getValue();
};
struct HighQuality : IQuality
{
    static float getValue() { return 100.0; }
}
struct LowQuality : IQuality
{
    static float getValue() { return 1.0; }
}

[shader("compute")]
[numthreads(1,1,1)]
void computeMain<T : IQuality>(uint3 threadId : SV_DispatchThreadID)
{
    result[0] = T::getValue();
}
```

The API needed to select between HighQuality and LowQuality is `specialize()`.
Specialization parameters are specified with the `SpecializationArg` class.

The type that you intend to use for concretization of the entry-point can be found with reflection:

```cpp
    slangModule->getLayout()->findTypeByName("HighQuality")
```

Create the SpecializationArg array to use with specialize():
```cpp
    std::array<slang::SpecializationArg, 1> specializationArgs =
    {
        {
            slang::SpecializationArg::Kind::Type,
            slangModule->getLayout()->findTypeByName("HighQuality")
        }
    };
```

Provide that array to `specialize` on the `ComponentType` that requires specialization.
In this case, the component to specialize is the `entryPoint`.

```cpp
    Slang::ComPtr<slang::IEntryPoint> entryPoint;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        slangModule->findEntryPointByName("computeMain", entryPoint.writeRef());
        if (!entryPoint)
        {
            std::cout << "Error getting entry point" << std::endl;
            return -1;
        }
    }
    Slang::ComPtr<slang::IComponentType> specializedEntryPoint;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = entryPoint->specialize(
            specializationArgs.data(),
            specializationArgs.size(),
            specializedEntryPoint.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

Now instead of composing the unspecialized `entryPoint` into your `CompositeComponentType`, you would add the specialized `specializedEntryPoint` into the compositition.

If you dump output for the compiled shader, you'll see that only "HighQuality" exists in the shader, and `computeMain` now refers directly to `HighQuality_getValue_0` as its call to interact with the quality object. Here's a resulting HLSL target compile:

```hlsl
RWStructuredBuffer<float > result_0 : register(u0);

float HighQuality_getValue_0()
{
    return 100.0;
}

[numthreads(1, 1, 1)]
void computeMain(uint3 threadId_0 : SV_DispatchThreadID)
{
    result_0[int(0)] = HighQuality_getValue_0();
    return;
}
```

Dynamic Dispatch
----------------

In the preceding example [Generics Specialization](#generics-specialization), logic for handling a feature was placed behind an interface `IQuality` which could be implemented as either the structs `HighQuality` or `LowQuality`.

The previous use-case was to produce specialized shaders, but imagine that you prefer to have one "uber-shader" that can handle both qualities. Generics can handle that too, and we'll see later that both techniques (dynamic dispatch, specialization) can be supported with the same Slang shader source code.

Instead of parameterizing the entry-point such that the definition of `T` can be specialized at link time, let's instead provide the type of `T` as an integer uniform and dynamically create an object of the specified type through that enum.

Slang provides the utility function `createDynamicObject()` to do just that. Based on an integer and a blob of initialization data, an object of the desired `IQuality` type will be initialized at runtime.

Here's a shader that uses dynamic dispatch for `getValue()` query.

```hlsl
RWStructuredBuffer<float> result;

interface IQuality
{
    static float getValue();
};
struct HighQuality : IQuality
{
    static float getValue() { return 100.0; }
}
struct LowQuality : IQuality
{
    static float getValue() { return 1.0; }
}

uniform int quality;

[shader("compute")]
[numthreads(1,1,1)]
void computeMain(uint3 threadId : SV_DispatchThreadID)
{
    IQuality q = createDynamicObject<IQuality>(quality, 0);
    result[0] = q.getValue();
})
```

Notice that `computeMain` is not a generic function, but the type of `q` it creates dynamically depends on the value of `quality`.

To compile the shader with support for both `IQuality` implementations, Slang requires info from the developer to know which `IQuality` implementations need to be retained in the dynamic dispatch table for `getValue`.

The mechanism for this is "ITypeConformance". Type Conformances are linkable objects, similar to `IEntryPoint` in that they don't represent shader source, so much as targetting a subset of the shader source that should be included in the final composition. By specifying `ITypeConformance` objects in the createCompositeComponentType() call, you restrict the set of `IQuality` implementations that are supported dynamically in the shader. As part of creating Type Conformances, you also get an opportunity to specify preferred enumeration values for the type conformances, used in the dynamic dispatch. Otherwise, specifying `-1` will permit Slang to choose default values.

```cpp
    enum Quality {
        QUALITY_LOW,
        QUALITY_HIGH,
    };

    Slang::ComPtr<slang::ITypeConformance> highQuality;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = session->createTypeConformanceComponentType(
            slangModule->getLayout()->findTypeByName("HighQuality"),
            slangModule->getLayout()->findTypeByName("IQuality"),
            highQuality.writeRef(),
            QUALITY_HIGH,
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }

    Slang::ComPtr<slang::ITypeConformance> lowQuality;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = session->createTypeConformanceComponentType(
            slangModule->getLayout()->findTypeByName("LowQuality"),
            slangModule->getLayout()->findTypeByName("IQuality"),
            lowQuality.writeRef(),
            QUALITY_LOW,
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }

    std::array<slang::IComponentType*, 4> componentTypes =
        {
            slangModule,
            entryPoint,
            highQuality,
            lowQuality,
        };

    Slang::ComPtr<slang::IComponentType> composedProgram;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = session->createCompositeComponentType(
            componentTypes.data(),
            componentTypes.size(),
            composedProgram.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }
```

This sample opts to specify the enum values for `highQuality` and `lowQuality` because the host application will need to select the dynamic type at runtime via uniform and will need to know which integral value does what.

Now when composing the program, the source code module, the entry-point, and BOTH `IQuality` implementations will be included. 

Here's the HLSL output from compiling the shader with dynamic dispatch:

```hlsl
...

RWStructuredBuffer<float > result_0 : register(u0);

struct GlobalParams_0
{
    int quality_0;
};

cbuffer globalParams_0 : register(b0)
{
    GlobalParams_0 globalParams_0;
}

float HighQuality_getValue_0()
{
    return 100.0;
}

float U_S11specialized11HighQuality8getValuep0pf_wtwrapper_0()
{
    return HighQuality_getValue_0();
}

float LowQuality_getValue_0()
{
    return 1.0;
}

float U_S11specialized10LowQuality8getValuep0pf_wtwrapper_0()
{
    return LowQuality_getValue_0();
}

float U_S11specialized8IQuality8getValuep0pf_0(uint2 _S1)
{
    switch(_S1.x)
    {
    case 1U:
        {
            return U_S11specialized11HighQuality8getValuep0pf_wtwrapper_0();
        }
    default:
        {
            return U_S11specialized10LowQuality8getValuep0pf_wtwrapper_0();
        }
    }
}

[numthreads(1, 1, 1)]
void computeMain(uint3 threadId_0 : SV_DispatchThreadID)
{
    result_0[int(0)] = U_S11specialized8IQuality8getValuep0pf_0(uint2(uint(globalParams_0.quality_0), 0U));
    return;
}
```

Notice in particular the switch case added in the function `float U_S11specialized8IQuality8getValuep0pf_0(uint2 _S1)`.

#### Supporting both specialization and dynamic dispatch

In the prior example, `HighQuality` and `LowQuality` are both supported in a single uber-shader, compiled to support dynamic dispatch on the call to `getValue()`. To achieve this, two `ITypeConformance` objects were added to the composite component.

What if only one type conformance is included?

Slang is smart enough to identify this, and will reduce the dynamic dispatch function's switch statement to a single unconditional call to the selected function! In this way, the same shader source can support both dynamic dispatch OR specialization depending on the way it's compiled.

Let's remove `highQuality` from the composed program, leaving only `lowQuality`.
```cpp
    std::array<slang::IComponentType*, 3> componentTypes =
        {
            slangModule,
            entryPoint,
            lowQuality,
        };
```

With that single tweak, see the change in generated shader:

```hlsl
float U_S11specialized10LowQuality8getValuep0pf_wtwrapper_0()
{
    return LowQuality_getValue_0();
}

float U_S11specialized8IQuality8getValuep0pf_0(uint2 _S1)
{
    return U_S11specialized10LowQuality8getValuep0pf_wtwrapper_0();
}

[numthreads(1, 1, 1)]
void computeMain(uint3 threadId_0 : SV_DispatchThreadID)
{
    result_0[int(0)] = U_S11specialized8IQuality8getValuep0pf_0(uint2(uint(globalParams_0.quality_0), 0U));
    return;
}
```

The switch statement is gone, and now the shader is specialized to supporting only one `IQuality`!


Diagnostics
-----------

Many API methods take an optional `diagnostics` parameter. This is the vehicle for Slang to report specific details about the operation. Not just errors, but warnings or other information too.

After calling, the pointed-to argument will be `nullptr` if there are no diagnostics reported, so it's handy to always print out the API diagnostic info after each operation based on whether `nullptr` was returned or not, not only if the operation failed.

For example, in the following, if `diagnosticsBlob` is anything other than `nullptr` there may be useful information to see there.

```cpp
    Slang::ComPtr<slang::IModule> slangModule;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        slangModule = session->loadModuleFromSourceString("shortest", "shortest.slang", shortestShader, diagnosticsBlob.writeRef());
        if (diagnosticsBlob != nullptr)
        {
            std::cout << (const char*)diagnosticsBlob->getBufferPointer() << std::endl;
        }
        if (!slangModule)
        {
            return -1;
        }
    }
```

Features Accessible Through Additional Interfaces
-------------------------------------------------

Some Slang API features are inaccessible using only the basic `IModule` and `IComponentType` COM pointers that we've used so far.  Getting access to additional features can require querying objects for additional interfaces. Experienced COM users will be familiar with the process.

Let's say there is an `ISample` interface declared in `slang.h` with a method of interest, `InterestingModuleMethod()`. Though `InterestingModuleMethod()` operates on a Module internal to Slang, in order to call it, you need to ask Slang for an `ISample` pointer for the `IModule` that you have. Doing so requires passing in the COM UUID (Universally Unique Identifier) for the interface to the `queryInterface()` method, which is `SLANG_UUID_ISample` for the made up `ISample` interface. It's also fine to call the static `ISample::getTypeGuid()` function to get the value for the UUID parameter.

```cpp
   // Assume `mymodule` is a ComPtr<IModule> acquired from an earlier step.
   ComPtr<ISample> mysampleinterface;
   if (mymodule->queryInterface(SLANG_UUID_ISample, ISample.writeref()))
   {
       ISample->InterestingMethod();
   }
   else
   {
       // Helpful diagnostic messages, or turn on fallback behavior perhaps.
   }
```

Note that the application is expected to handle the scenario where the interface cannot be queried successfully. One likely reason could be that the application is running in an environment with an older Slang library. The application may ask Slang for an interface that isn't yet implemented in that version of the library. Whether that is a fatal error or if it just means that a feature is disabled, is up to the application.

Post-Compilation Reflection
---------------------------

Target compilation typically involves the elimination of unused parameters and automatic assignment of bindings. Slang offers a post-compilation reflection interface that answers the question of which parameters remain after optimization, `IMetaData`.

An `IMetaData` interface can be queried from a compiled program. After `getEntryPointCode()` has been called, `getEntryPointMetadata()` with the same `entryPointIndex` and `targetIndex` as was used during compilation will provide the reflection information for that entry-point. Similarly, after `getTargetCode()` has been called for a certain `targetIndex`, calling `getTargetMetadata()` on the same `targetIndex` will return its `IMetaData` reflection interface.

`IMetaData` offers the `isParameterLocationUsed()` method which returns whether a resource parameter at the specified binding location is actually being used in the compiled shader.

```cpp
    bool isUsed = false;
    SlangParameterCategory category = SLANG_PARAMETER_CATEGORY_DESCRIPTOR_TABLE_SLOT;
    unsigned spaceIndex = 0;
    unsigned registerIndex = 0;
    metadata->isParameterLocationUsed(
        category,
        spaceIndex,
        registerIndex,
        isUsed);
```

See [Reflection API Tutorial](https://shader-slang.com/slang/docs/reflection-api) for more details.

Complete Example
----------------

Save the following to disk at a file named "shortest.cpp":

```cpp
#include "slang.h"
#include "slang-com-helper.h"
#include "slang-com-ptr.h"
#include <array>
#include <iostream>

const char* shortestShader =
"RWStructuredBuffer<float> result;"
"[shader(\"compute\")]"
"[numthreads(1,1,1)]"
"void computeMain(uint3 threadId : SV_DispatchThreadID)"
"{"
"    result[threadId.x] = threadId.x;"
"}";

void diagnoseIfNeeded(slang::IBlob* diagnosticsBlob)
{
    if (diagnosticsBlob != nullptr)
    {
        std::cout << (const char*)diagnosticsBlob->getBufferPointer() << std::endl;
    }
}

int main()
{
    // 1. Create Global Session
    Slang::ComPtr<slang::IGlobalSession> globalSession;
    createGlobalSession(globalSession.writeRef());

    // 2. Create Session
    slang::SessionDesc sessionDesc = {};
    slang::TargetDesc targetDesc = {};
    targetDesc.format = SLANG_SPIRV;
    targetDesc.profile = globalSession->findProfile("spirv_1_5");

    sessionDesc.targets = &targetDesc;
    sessionDesc.targetCount = 1;

    std::array<slang::CompilerOptionEntry, 1> options = 
        {
            {
                slang::CompilerOptionName::EmitSpirvDirectly,
                {slang::CompilerOptionValueKind::Int, 1, 0, nullptr, nullptr}
            }
        };
    sessionDesc.compilerOptionEntries = options.data();
    sessionDesc.compilerOptionEntryCount = options.size();

    Slang::ComPtr<slang::ISession> session;
    globalSession->createSession(sessionDesc, session.writeRef());

    // 3. Load module
    Slang::ComPtr<slang::IModule> slangModule;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        slangModule = session->loadModuleFromSourceString(
            "shortest",                  // Module name
            "shortest.slang",            // Module path
            shortestShader,              // Shader source code
            diagnosticsBlob.writeRef()); // Optional diagnostic container
        diagnoseIfNeeded(diagnosticsBlob);
        if (!slangModule)
        {
            return -1;
        }
    }

    // 4. Query Entry Points
    Slang::ComPtr<slang::IEntryPoint> entryPoint;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        slangModule->findEntryPointByName("computeMain", entryPoint.writeRef());
        if (!entryPoint)
        {
            std::cout << "Error getting entry point" << std::endl;
            return -1;
        }
    }

    // 5. Compose Modules + Entry Points
    std::array<slang::IComponentType*, 2> componentTypes =
        {
            slangModule,
            entryPoint
        };

    Slang::ComPtr<slang::IComponentType> composedProgram;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = session->createCompositeComponentType(
            componentTypes.data(),
            componentTypes.size(),
            composedProgram.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }

    // 6. Link
    Slang::ComPtr<slang::IComponentType> linkedProgram;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = composedProgram->link(
            linkedProgram.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }

    // 7. Get Target Kernel Code
    Slang::ComPtr<slang::IBlob> spirvCode;
    {
        Slang::ComPtr<slang::IBlob> diagnosticsBlob;
        SlangResult result = linkedProgram->getEntryPointCode(
            0,
            0,
            spirvCode.writeRef(),
            diagnosticsBlob.writeRef());
        diagnoseIfNeeded(diagnosticsBlob);
        SLANG_RETURN_ON_FAIL(result);
    }

    std::cout << "Compiled " << spirvCode->getBufferSize() << " bytes of SPIR-V" << std::endl;
}
```

#### Compile it (g++ directions)
* Assumes Slang is installed in the current directory at `slang`.
* Assumes program is saved to "shortest.cpp".
* Assumes a release build of Slang.

If any of the above assumptions are wrong in your case, adjust the paths below to match:

```bat
g++ -I./slang/include --std=c++14 shortest.cpp -L./slang/build/Release/lib/ -l:libslang.so
```

#### Run it

```bat
LD_LIBRARY_PATH=slang/build/Release/lib ./a.out
```
