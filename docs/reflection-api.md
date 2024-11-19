# Using the Slang Reflection API

This document is intended to explain the principles of how the Slang Reflection APIs are designed.
For information on how to use the Slang Reflection API functions, please refer to [Slang User's Guide](https://shader-slang.com/slang/user-guide/reflection.html).

## Goals and Difficulties of Slang Reflection API

Slang provides the "Slang Reflection API" that works for multiple targets. This allows Slang users to write more cross-platform applications that can unify similar API functionalities for different APIs. However, since Slang supports multiple targets, there are difficulties in designing a reflection API that works for all of them.

When a certain target comes with specific requirements, Slang Reflection APIs may need to conform to the requirements even when the other targets have no such requirements. As an example, when targeting C++, the texture and sampler parameters in a single struct type can be serialized together. But when targeting HLSL, texture parameters are bound to `t` registers, and the sampler parameters are bound to `s` registers separately.

When Slang provides advanced language features that a target doesn't support directly, Slang has to "de-sugar" it, and this process must be deterministically well-defined by the Slang Reflection APIs.

The goals of the Slang Reflection API are:
 - Reflect the program as the user wrote it; not as how the target compiler generated it.
 - Support applications that are cross-platform and cross-APIs.
 - Report the complete layout information for each platform.

## Reflection Based on the Input Program

Most of the shader compilers out there provide a reflection API that is based on the compiled shader binary. When a shader parameter is, for example, unused, the reflection API provides no information about it, because they don't exist in the compiled shader binary.

The Slang Reflection API is based on the input program, and this is the only way to provide a consistent binding across multiple platforms.

### Problems of the Current Binding Methods

When a shader is compiled, the application has two options for how to assign the binding indices for the shader parameters.

1. **Explicit binding**: the shader developer assigns unique numbers to each and every shader parameter manually.
2. **Binding data from reflection**: when the binding indices are not explicitly specified, the compiler assigns binding indices just for the shader parameters that are actually used.

When binding indices are explicitly assigned to each shader parameter, it has the advantage that the binding indices assigned to each shader parameter are known prior to shader compilation. The application doesn't need to use the reflection API to query the binding information from the compiled shader binary. Even when certain sets of shader parameters are unused and the compiler removes them from the final shader binary, the binding indices stay the same, which allows the application to reuse the same data layout for multiple shader permutations. But it becomes a burden for application developers to maintain the uniqueness of the indices, and it is often considered not a scalable approach.

Alternatively, when the shader parameters don't have any binding indices specified, the compiler will assign binding indices. The application can then query the binding information from the compiled shader binary with the reflection APIs. But in this approach, the binding information is based on the compiled shader binary and any unused shader parameters are not counted. This creates different sets of shader parameters for different sets of shader permutations even when they are all from the same shader source file. In other words, the binding indices will be assigned in an unpredictable manner when there are a lot of shader permutations. This prevents the application from reusing the same data layout that could be reused if the binding indices were explicitly assigned.

### Slang Addresses the Problem with "Implicit Binding"

Slang takes a slightly different approach to address the problem. The explicit binding is still supported, but when the binding indices are unspecified, Slang will automatically assign the binding indices deterministically. The binding indices are assigned before dead-code elimination, and the binding information remains in the final binary as if the binding information were explicitly specified to all shader parameters.

This allows "modules" of Slang to be used consistently on multiple shaders. Regardless of which shader parameters are used or unused, the assigned binding indices are the same for a given Slang module. It allows applications using Slang to reuse the parameter data more efficiently. When the parameter layouts are consistent across multiple shaders, the same data can be reused more often, and it can improve the overall efficiency of the application.

Because the binding information is independent from the target compiler, the binding information is identical for all targets. The information doesn't need to be queried for different targets.

### Parameter Binding for Modules by Example

The following examples shows a typical shader source code that gets compiled with the macro permutation.
```hlsl
struct Scene
{
    float4 eyePosition;
    float4 eyeDirection;
};

struct Light
{
    uint type; // directional, spot, point
    float4 position;
    float4 color;
    float intensity;
    uint castShadow;
    uint flags;

#if LIGHT_TYPE_DIRECTIONAL || LIGHT_TYPE_SPOT
    // only for directional and spot types
    float4 direction;
#endif

#if LIGHT_TYPE_POINT || LIGHT_TYPE_SPOT
    // only for spot and point types
    float radius;
#endif
};

struct Material
{
    uint type;
    Texture2D diffuse;

#if MATERIAL_TYPE_EMISSIVE
    Texture2D emissive;
#else
    Texture2D normal;
#endif
};
```
Note that even when those member variables are not wrapped with the macro variables, the native compilers will remove them when they are unused.

When there are variants of a struct based on the marco permutation, the CPP side implementation must match to what the shader expects. In other words, it requires the same permutation on CPP side as many as the shaders variants are generated.

With Slang, those unused member variables will be still removed from the final shader binary, but the binding information stays same for a given type. It allows CPP side to have a same implementation regardless of the shader variants.

## How Shader Binding Works for Target Platforms

There are differences in how the target platforms bind the shader parameters. Some of the restrictions can be mitigated by "legalizing," but Slang has to conform to some restrictions that cannot be avoided. One of the restrictions is the existence of "Resource Type." In HLSL, there are roughly four resource types: "Constant Buffer", "Texture", "Sampler", and "UAV". OpenGL/Vulkan simply have binding indices and set indices without "resource types". Slang abstracts the differences and calls it "ParameterCategory" or "Category" for short. In other contexts, it is also called `LayoutResourceKind`, which is more descriptive.

This section quickly summarizes how each target handles the binding, and the next section will describe how they are abstracted in a Slang way.

### Direct3D 11

The shader parameters in D3D11 are bound in one of four ways.
1. When the resource type is texture, it is bound to a register starting with the letter `t`.
2. When the resource type is sampler, it is bound to a register starting with the letter `s`.
3. When the resource type is Unordered Access View (UAV), it is bound to a register starting with the letter `u`.
4. When the resource type is constant buffer, multiple values are stored in a buffer, and it is bound to a register starting with the letter `b`.

Consider the following example:

```hlsl
// D3D11 HLSL Compute Shader Example

Texture2D myTexture : register(t0); // Texture bound to t0
SamplerState mySampler : register(s0); // Sampler bound to s0
RWTexture2D<float4> outputTexture : register(u0); // UAV bound to u0

cbuffer ConstantBuffer : register(b0) // Constant buffer bound to b0
{
    float4x4 transformationMatrix;
    uint textureWidth;
    uint textureHeight;
};
```

The example above shows four shader parameters:
- `myTexture` is bound to register `t0`, because it is a `Texture2D` type.
- `mySampler` is bound to register `s0`, because it is a `SamplerState` type.
- `ConstantBuffer` is bound to register `b0`, because it is a `cbuffer` type.
- `outputTexture` is bound to register `u0`, because it is an `RWTexture2D`, also known as UAV type.

### Direct3D 12

The shader parameters in D3D12 support all the binding methods in D3D11. Additionally, it introduces two new concepts for binding.
1. A register `space` can be specified.
2. An "array of descriptors" can be specified.

Consider the following example:

```hlsl
// D3D12 HLSL Compute Shader Example with Register Spaces

Texture2D myTexture1 : register(t0); // Texture bound to t0 in the default space, which is space0
Texture2D myTexture2 : register(t0, space1); // Texture bound to t0 in space1 and doesn't conflict with t0 in space0
Texture2D myTexture3[10] : register(t0, space2); // Bound from t0 to t9 registers in space2
```

The example above shows three shader parameters:
- `myTexture1` and `myTexture2` use the same register index `t0`, but they don't conflict because `myTexture2` uses a slot from a different space.
- `myTexture3` is bound to multiple slots from `t0` to `t9` in `space2`.

### OpenGL

The shader parameters in OpenGL follow a similar rule as Direct3D, but the binding index is more monolithic, in that the binding index is just a single number regardless of their resource types.

Consider the following example:

```glsl
// OpenGL GLSL Compute Shader Example

#version 430
layout(binding = 0) uniform texture2D myTexture;
layout(binding = 1) uniform sampler mySampler;
layout(binding = 2) writeonly uniform image2D outputTexture;

layout(binding = 3) uniform ConstantBuffer
{
    mat4 transformationMatrix;
    uint textureWidth;
    uint textureHeight;
};
```

The example above shows four shader parameters:
- `myTexture` is bound to a binding index `0`.
- `mySampler` is bound to a binding index `1`.
- `outputTexture` is bound to a binding index `2`.
- `ConstantBuffer` is bound to a binding index `3`.

### Vulkan

The shader parameters in Vulkan support all the binding syntax of OpenGL but support additional concepts like D3D12 does:
1. GLSL with Vulkan backend can specify a descriptor set index with a `set` keyword, which is similar to `space` in D3D12.
2. GLSL with Vulkan backend can declare arrays of descriptors by using `[]` syntax, which is similar to "array of descriptors" in D3D12.

Consider the following example:

```glsl
// Vulkan GLSL Compute Shader Example with descriptor set

layout(binding = 0) uniform texture2D myTexture1; // Bound to binding index 0 and descriptor set 0.
layout(binding = 0, set = 1) uniform texture2D myTexture2; // Bound to binding index 0 and descriptor set 1
layout(binding = 0, set = 2) uniform texture2D myTexture3[10]; // Bound from binding index 0 to 9 descriptors in descriptor set 2.
```

The example above shows three shader parameters:
- `myTexture1` and `myTexture2` use the same binding index `0`, but they don't conflict because `myTexture2` uses a slot from a different descriptor set.
- `myTexture3` is bound to multiple binding slots from `0` to `9` in descriptor set 2.

### Metal

The shader parameters in Metal follow a similar rule as D3D11. A resource can be bound in one of three ways:
1. When the resource type is texture, the parameter is annotated with `[[texture(X)]]`, where `X` is a slot index.
2. When the resource type is sampler, the parameter is annotated with `[[sampler(X)]]`, where `X` is a slot index.
3. When the resource type is constant buffer, multiple values can be stored in a buffer, and it is annotated with `[[buffer(X)]]`, where `X` is a slot index.

> TODO: Yong said, "Metal has argument buffer that behaves like a descriptor set in Vulkan, that is capable of holding different types of parameter bindings and can be populated beforehand", but I cannot figure out how to use it.

> TODO: It is unclear if Metal supports "Array of descriptor" like HLSL does. When tried, I am getting compile errors. Maybe Shader-playground is using an older version of Metal compiler?

```metal
struct MyArgumentBuffer {
    array<float4, int(4)> transformationMatrix;
    uint textureWidth;
    uint textureHeight;
};

[[kernel]] void computeMain(
    uint3 DTid [[thread_position_in_grid]],
    texture2d<float, access::sample> myTexture [[texture(0)]],
    sampler mySampler [[sampler(0)]],
    texture2d<float, access::read_write> outputTexture [[texture(1)]],
    constant MyArgumentBuffer* args [[buffer(0)]]
)
{
    ...
}
```

The example above shows four shader parameters:
- `myTexture` is bound to `texture(0)`, because it is a texture resource.
- `mySampler` is bound to `sampler(0)`, because it is a texture sampler.
- `outputTexture` is bound to `texture(1)`, because unlike HLSL, Metal doesn't differentiate UAV from SRV.
- `ConstantBuffer` is bound to `buffer(0)`, because it is a buffer resource.

## Cross-Platform Reflection API

Slang abstracts "Resource type". As exampled above, HLSL has different types of registers, each of which starts with a letter like `t` for textures and `s` for samplers. The register `t0` represents a different slot from a register `s0` in HLSL. However, in Vulkan, there is just a binding index number that doesn't differentiate the resource types. A texture can be bound to a binding index `0`, and it will conflict if a sampler is also bound to a binding index `0`.

As described earlier, Slang assigns the binding indices based on the input program, and the binding information is same for any targets, which allows Slang Reflection API to be cross-platform. But it comes with a cost that the Slang users need to learn a few new concepts that abstracts the differences.

### `VariableLayout` and `TypeLayout`
For every variables, Slang has the following concepts and relationships:
 - **Variable**: `Variable` represents each variable declaration.
 - **Type**: every `Variable` has a `Type`.

To store the "layout" information, Slang has the following concepts and relationships:
 - **VariableLayout**: `VariableLayout` holds the layout information for `Variable` for a given scope.
 - **TypeLayout**: `TypeLayout` holds the layout information for `Type`.

For the Slang Reflection API, you will be mostly dealing with `VariableLayout` and the variants of `TypeLayout`. Both of them reflect the layout information, but `VariableLayout` is more for the "offset" information from the beginning of the given scope, and `TypeLayout` is more for the "size" information of the type. Since `VariableLayout` has the `TypeLayout`, you can access `TypeLayoutReflection` from `VariableLayoutReflection` in the reflection APIs.

When the variable is `struct` type, Slang has the following concepts and relationships:
 - **StructType**: every `Variable` whose type is `struct` has a `StructType`, and it has "fields" for its member `Variable`-s.
 - **StructTypeLayout**: `StructTypeLayout` holds the layout information for `StructType`, and it has "fields" for the layout information of member variables.
 
 `VariableLayout` has a `StructTypeLayout` if `Variable` is a struct type. Similarly to `StructType`, `StructTypeLayout` also has "fields" for its member variables, but each member is represented with `VariableLayout` to hold the layout information.

 For `array` types, Slang has the following concepts and relationships:
  - **ArrayType**: every `Variable` whose type is an array also has an `ArrayType`.
  - **ArrayTypeLayout**: `ArrayTypeLayout` holds the layout information for `ArrayType`.

### Iterating Global-Scope Shader Parameters
To start from a simple example, consider the following simple shader parameters:
```hlsl
Texture2D myTexture;
SamplerState mySampler;
```

The following code shows how to get the reflection data for the shader parameters above:
```cpp
unsigned parameterCount = shaderReflection->getParameterCount();
for(unsigned pp = 0; pp < parameterCount; pp++)
{
    slang::VariableLayoutReflection* parameter =
        shaderReflection->getParameterByIndex(pp);

    slang::ParameterCategory category = parameter->getCategory();
    unsigned index = parameter->getOffset(category);
    unsigned space = parameter->getBindingSpace(category)
                   + parameter->getOffset(slang::ParameterCategory::SubElementRegisterSpace);
    // ...
}
```

The example above shows that the application using HLSL will get the resource type information as `category`, the binding index as `index`, and the space index as `space`. For the application using Vulkan, `category` will always be `slang::ParameterCategory::DescriptorTableSlot`.

Note that `getOffset()` is called with `category`. It is important to understand that the "offset" and "size" information is not a single value but an array of values, each of which is for each category. When `getOffset()` or `getSize` is called with a category the parameter doesn't belong to, it will return a zero value.

### Offset of `Mixed` category
As an example, there is a resource type in GLSL called "texture-combined sampler" such as `sampler2D`, `sampler3D` and so on. It combines a texture resource type and a sampler resource type. Slang treats it as a `Mixed` category. Consider the following GLSL code,

```glsl
sampler2D myOldTexture;
```

The variable `myOldTexture` uses two `ParameterCategory`: `ShaderResource` and `SamplerState`. When a type has more than one `ParameterCategory`, its `ParameterCategory` is `Mixed`. You will need to iterate for each category as follows:

```cpp
slang::ParameterCategory category = parameter->getCategory();
if (category == slang::ParameterCategory::Mixed)
{
    unsigned categoryCount = parameter->getCategoryCount();
    for(unsigned cc = 0; cc < categoryCount; cc++)
    {
        slang::ParameterCategory category = parameter->getCategoryByIndex(cc);
        size_t offsetForCategory = parameter->getOffset(category);
        size_t spaceForCategory = parameter->getBindingSpace(category)
            + parameter->getOffset(slang::ParameterCategory::SubElementRegisterSpace);
        // ...
    }
}
```

Note that the `category` in this example plays an important role when querying with `getOffset()`. `myOldTexture` has two offset values: one is as `ShaderResource` and another is as `SamplerState`.

### Offset of `struct`
When a variable is a `struct` type, you need to iterate "fields" as follows:
```cpp
slang::TypeLayoutReflection* typeLayout = parameter->getTypeLayout();
slang::TypeReflection::Kind kind = typeLayout->getKind();
if (kind == slang::TypeReflection::Kind::Struct)
{
    unsigned fieldCount = typeLayout->getFieldCount();
    for(unsigned ff = 0; ff < fieldCount; ff++)
    {
    	VariableLayoutReflection* field = typeLayout->getFieldByIndex(ff);
    	// ...
    }
}
```

When a `struct` type has another `struct` type as its member variable, the application needs to recursively iterate fields of each struct.

One important note for recursively iterating a struct kind is that the "offset" values for each field are offset values counted from the beginning of the struct it belongs to. The application must sum up the offset values of the nesting structs to get the correct "binding index".

### Size of `array`
Once you have the offset information, you will need to know the size information, because for some types, it may occupy more than one binding slots. For that reason, you need to first query what "kind" of parameter it is. It could be `Scalar`, `Matrix`, `Array`, and so on.

```cpp
slang::TypeLayoutReflection* typeLayout = parameter->getTypeLayout();
slang::TypeReflection::Kind kind = typeLayout->getKind();
switch (kind)
{
    case slang::TypeReflection::Kind::Scalar:
    {
        size_t sizeInBytes = typeLayout->getSize(category);
        // ...
        break;
    }
    case slang::TypeReflection::Kind::Array:
    {
        size_t arrayElementCount = typeLayout->getElementCount();
        size_t arrayElementStride = typeLayout->getElementStride(category);
        size_t sizeOfArray = arrayElementCount * arrayElementStride;

        // ...
        break;
    }
    // ...
}
```

Note that similarly to how we get the "offset" information, you need to query "size" information for a specific `category` as shown above. In other words, `getSize()` or `getElementStride()` must be called with a specific `category`.

`arrayElementStride` in the example illustrates that the size of an array element is not always same to the distance between each element in an array. `getElementStride` provides the information of how much stride is used in the array.

### `ParameterBlock`

`ParameterBlock` is a unique feature in Slang. Parameter blocks (exposed as ParameterBlock<T>) provide a first-class language feature for grouping related shader parameters and specifying that they should be passed to the GPU as a coherent block. Parameter blocks make it easy for applications to use the most efficient parameter-binding model of each API, such as descriptor tables/sets in D3D12/Vulkan.

> TODO: We need an example code for ParameterBlock. And the example should be able to show what ParameterBlock can do that is not possible with the native shading languages.

Best practices are to use parameter blocks to reuse parameter binding logic by creating descriptor sets/descriptor tables once and reusing them in different frames. `ParameterBlocks` allow developers to group parameters in a stable set, where the relative binding locations within the block are not affected by where the parameter block is defined. This enables developers to create descriptor sets and populate them once, and reuse them over and over. For example, the scene often doesn't change between frames, so we should be able to create a descriptor table for all the scene resources without having to rebind every single parameter in every frame.

### How to Figure Out Which Binding Slots Are Unused

Slang allows the application to query if a parameter location is used after dead code elimination. This is done through the `IMetadata` interface:

1. `IComponentType::getEntryPointMetadata()` or `IComponentType::getTargetMetadata()` returns `IMetadata*`.
2. `IMetadata::isParameterLocationUsed(int set, int binding)` tells you whether or not the parameter binding at the specific location is being used.

Here is an example of how to check if a slot is being used in the shader binary.

```cpp
ComPtr<slang::IComponentType> compositeProgram;
slang::IComponentType* components[] = {module, entryPoint.get()};
session->createCompositeComponentType(
    components,
    2,
    compositeProgram.writeRef(),
    diagnosticBlob.writeRef());

ComPtr<slang::IComponentType> linkedProgram;
compositeProgram->link(linkedProgram.writeRef(), nullptr);

ComPtr<slang::IMetadata> metadata;
linkedProgram->getTargetMetadata(0, metadata.writeRef(), nullptr);

bool isUsed = false;
int spaceIndex = 0;
int registerIndex = ;
metadata->isParameterLocationUsed(SLANG_PARAMETER_CATEGORY_SHADER_RESOURCE, spaceIndex, registerIndex, isUsed);
metadata->isParameterLocationUsed(SLANG_PARAMETER_CATEGORY_VARYING_INPUT, spaceIndex, registerIndex, isUsed);
```

## Report the Complete Layout Information

### Iterating Entry Points
Slang Reflection API also provides information about entry points. This information can be accessed from `slang::EntryPointReflection`.

Here is an example of how you can iterate the entry points:

```cpp
SlangUInt entryPointCount = shaderReflection->getEntryPointCount();
for(SlangUInt ee = 0; ee < entryPointCount; ee++)
{
    slang::EntryPointReflection* entryPoint =
        shaderReflection->getEntryPointByIndex(ee);

    char const* entryPointName = entryPoint->getName();
    SlangStage stage = entryPoint->getStage();

    unsigned parameterCount = entryPoint->getParameterCount();
    for(unsigned pp = 0; pp < parameterCount; pp++)
    {
        slang::VariableLayoutReflection* parameter =
            entryPoint->getParameterByIndex(pp);
        // ...
    }
    // ...
}
```

### Iterating Functions
Slang also provides information about other functions. This information can be accessed from `slang::FunctionReflection`.

Here is an example of how you can access the information of a function:

```cpp
auto funcReflection = program->getLayout()->findFunctionByName("ordinaryFunc");

// Get return type.
slang::TypeReflection* returnType = funcReflection->getReturnType();

// Get parameter count.
unsigned int paramCount = funcReflection->getParameterCount();

// Get Parameter.
slang::VariableReflection* param0 = funcReflection->getParameter(0);
const char* param0Name = param0->getName();
slang::TypeReflection* param0Type = param0->getType();

// Get user defined attributes on the function.
unsigned int attribCount = funcReflection->getUserAttributeCount();
slang::UserAttribute* attrib = funcReflection->getUserAttributeByIndex(0);
const char* attribName = attrib->getName();
```

### Shader Cursor

> TODO: Do we want to talk about shader cursor in this document?
