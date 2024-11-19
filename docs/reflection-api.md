# Using the Slang Reflection API

This document is intended to explain the principle of how Slang Reflection APIs are designed.
For the information of how to use the Slang Reflection API functions, please refer to [Slang User's Guide](https://shader-slang.com/slang/user-guide/reflection.html).

## Goal and dificulties of Slang Reflection API
Slang provides "Slang reflection API" that works for multiple targets. This allows the Slang users to write more cross platform applications that can unify the similar API funcitonalities for different APIs. However, since Slang supports multiple targets, there are difficulties to design the reflection API that works for all of them.

When a certain target comes with specific requirements, Slang Reflection APIs may need to comform to the requirements even when the other targets have no such requirements. As an example, when targeting CPP, the texture and sampler parameters in a single struct type can be serialized together. But when targeting HLSL, texture parameters are bound to `t` registers, and the sampler parameters are bound to `s` registers separately.

When Slang provides advanced language features that a target doesn't support directly, Slang has to "de-sugar" it and this process must be deterministically well defined by the Slang Reflection APIs.

The goals of the Slang Reflection API are:
 - Reflect the program as how the user worte; not as how the target compiler generated.
 - Support applications that is cross-platform and cross-APIs.
 - Report the complete layout information for each platform.


## Reflection based on the input program
Most of shader compilers out there provides the reflection API that is based on the compiled shader binary. When a shader parameters is, as an example, unused, the reflection API provides no information about it, because they don't exist in the compiled shader binary.

Slang Reflection API is based on the input program, and this is only way to provide a consistent binding across multiple platforms.

### Problems of the current binding methods
When a shader is compiled, the application has two options for how to assign the binding indices for the shader parameters.
1. Explicit binding : the shader developer assign unique numbers to each and every shader parameters manually.
2. Binding data from reflection : when the binding indices are not explicitly specified, the compiler assigns binding indices just for the shader parameters that are actually used.

When binding indices are explicitly assigned to each and every shader parameter, it has an advantage of what binding indices are assigned to which shader parameter prior to the shader compilation. The application doesn't need to use the reflection API to query the binding information from the compiled shader binary. Even when certain sets of shader parameters were unused and the compiler removed them from the final shader binary, the binding indicies stay same, which allows the application to reused a same data layout for multiple shader permutations. But it becomes a burden of the application developers to maintain the uniqueness of the indices. And it is often considered not scalable approach.

Alternatively, when the shader parameters don't have any binding indices specified, the compiler will assign binding indices. The application can, then, query the binding information from the compiled shader binary with the reflection APIs. But in this approach, the binding information is based on the compiled shader binary and any unused shader parameters are not counted. This creates different sets of shader parameters for different sets of shader permutations even when they are all from a same shader source file. In other words, the binding indices will be assigned in an unpredictable manner when there are a lot of shader permutations. This prevents the application from reusing a same data layout that could be reused if the binding indices were explicitly assigned.

### Slang addresses the problem with "implicit binding"
Slang takes a little different approach to address the problem. The explicit binding is still supported but when the binding indices are unspecified, Slang will automatically assign the binding indices deterministically. The binding indices are assigned before the dead-code-elimination and the binding information remains until the final binary as if the binding information was explicitly specified to all shader parameters.

This allows "modules" of Slang to be used consistently on multiple shaders. Regardless of which shader parameters are used or unused, the assigned binding indices are same for a same Slang module. And it allows the applications using Slang to reuse the parameter data more efficiently. When the parameter layouts are consistent across multiple shaders, the same data can be reused more often, and it can improve the overall efficiency of the application.

Because the binding information is independent from the target compiler, the binding information is identical for all targets. The information doesn't need to be queried for different targets.

### Examples of implicit binding
TODO: We need examples to show how binding indices are assigned with DXC and compare it to Slang.

TODO: We can have an example with modules like scene.hlsl/cpp, material.hlsl/cpp and/or lighting.hlsl/cpp.


### `ConstantBuffer` vs `ParameterBlock`

`ParameterBlock` is a unique feature in Slang. `ParameterBlock` provides consistent binding locations in separate spaces.

TODO: The content below describes a rough idea of what needs to be written.

The main difference is whether or not the enclosing resources bleed into the outer environment. `ConstantBuffer`: No indirection, everything bleeds out. `ParameterBlock`: Uses a separate space to hold all child elements; only the “space” binding will bleed out.

Best practices are to use parameter blocks to reuse parameter binding logic by creating descriptor sets/descriptor tables once and reusing them in different frames. `ParameterBlocks` allow developers to group parameters in a stable set, where the relative binding locations within the block are not affected by where the parameter block is defined. This enables developers to create descriptor sets and populate them once, and reuse them over and over. For example, the scene often doesn't change between frames, so we should be able to create a descriptor table for all the scene resources without having to rebind every single parameter in every frame.


## How Shader binding works for target platforms

There are differences on how the target platforms bind the shader parameters. Some of restrictions can be mitergated by "legalizing", but Slang has to comform to some of restricts that cannot be avoided. One of the restrictions is the existance of "Resource Type". In HLSL, there are roughly four resource types: "constant buffer", "Texture", "Sampler", and "UAV". OpenGL/Vulkan simply has binding indices and set indices without "resource types". Slang abstracts the differences and calls it "ParameterCategory" or "Category" for short. In other context, it is also called `LayoutResourceKind`, which is more descriptive.

This section quickly summarizes how each target handles the binding and the next section will describe how they are abstracted in a Slang way.

### Direct3D 11

The shader parameters in D3D11 are bound in one of four ways.
1. When the resource type is texture, it is bound to a register starting with the letter `t`.
2. When the resource type is sampler, it is bound to a register starting with the letter `s`.
3. When the resource type is Unordered Access View, it is bound to a register starting with the letter `u`.
4. When the resource type is constant buffer, multiple values are stored in a buffer, and it is bound to a register starting with the letter `b`.

Consider the following example,
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
- `outputTexture` is bound to register `u0`, because it is an `RWTexture2D` or also known as UAV type.

### Direct3D 12

The shader parameters in D3D12 support all the binding methods in D3D11. Additionally, it introduces two new concepts for binding.
1. A register `space` can be specified.
2. An "array of descriptors" can be specified.

Consider the following example,
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

Consider the following example,
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

The shader parameters in Vulkan support all the binding syntax of OpenGL, but support additional concepts like D3D12 does:
1. GLSL with Vulkan backend can specify a descriptor set index with a `set` keyword, which is similar to `space` in D3D12.
2. GLSL with Vulkan backend can declare arrays of descriptors by using `[]` syntax, which is similar to "array of descriptors" in D3D12.

Consider the following example,
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
- `ConstantBuffer` is bound to `buffer(0)`, because it is a buffer resoutce.

## Cross platform reflection API

Slang abstracts "Resource type". As an example, there are different types of registers in HLSL, each of which increaments its binding index for its own resource type. Texture resources are bound to `t0`, `t1`, and so on and sampler resources are bound to `s0`, `s1` and so on. The register `t0` represents a different slot from a register `s0` in HLSL. However, in Vulkan, there is just a binding index number that doesn't differentiate the resource types. A texture can be bound to a binding index `0` and it will conflict if a sampler is also bound to a binding index `0`.

Slang introduces new concepts to abstract the differences. The details of how Slang handles it is described in the later part of this section.


Because Slang Reflection API works for all the targets, all of the examples above for different targets should work in a same set of reflection APIs.

### `VariableLayout` and `TypeLayout`
For Variables, Slang has following concepts and relationships:
 - Variable : `Variable` represents each variable declaration.
 - Type : every `Variable` has a `Type`.
 - VariableLayout : `VariableLayout` holds the offset information of a `variable` for a given scope. And a `variable` has one or more than one `VariableLayout`.
 - TypeLayout : `TypeLayout` holds the size information of a `type`. A `VariableLayout` has a `TypeLayout`.

For Slang Reflection API, you will be mostly dealing with `VariableLayout` and `TypeLayout`. Both of them reflect the layout information, but `VariableLayout` is more for the "offset" information from a beginning of the given scope and `TypeLayout` is more for the "size" information of the type.

### Iterating global-scope shader uniform parameters
To start from a simple example, here is a simple example for getting the binding information of globa-scope shader uniform parameters,
```cpp
unsigned parameterCount = shaderReflection->getParameterCount();
for(unsigned pp = 0; pp < parameterCount; pp++)
{
    slang::VariableLayoutReflection* parameter =
        shaderReflection->getParameterByIndex(pp);

    slang::ParameterCategory category = parameter->getCategory();
    unsigned index = parameter->getOffset(category);
    unsigned space = parameter->getBindingSpace(category)
                   + parameter->getOffset(SLANG_PARAMETER_CATEGORY_SUB_ELEMENT_REGISTER_SPACE);
```
The example above shows that the application using HLSL will get the resource type information as "category", the binding index as "index", and the space index as "space". For the application using Vulkan, "category" will be always `slang::ParameterCategory::DescriptorTableSlot`.

### Iterating Mixed category
As for a more complex example, Slang can put multiple resource types in a single `struct` like the following,
```hlsl
struct SimpleMaterial
{
    int materialIndex;
    Texture2D diffuse;
};
```

In this case, the type `SimpleMaterial` uses two "ParameterCategory": `uniform` for `int` and `ShaderResource` for `Texture2D`. Because it has more than one ParameterCategories, its ParameterCategory is `Mixed`. You will need to iterate for each category as following,
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
            + parameter->getOffset(SLANG_PARAMETER_CATEGORY_SUB_ELEMENT_REGISTER_SPACE);
        // ...
    }
}
else
{
    // ...
}
```
Note that the code above returns the offset information for `SimpleMaterial` not the offset information of its member variables. The "category" in this example plays an important role when quering with `getOffset`. As `uniform` resource type, `SimpleMaterial` has an offset of the value returned from `getOffset` function call. And as `ShaderResource` resource type, `SimpleMaterial` has an offset of the value returned from `getOffset` function call.

### Size information of a parameter
Once you have the offset information, you will need to know the size information, because for some types, it could be more than a single type such as `struct` or array. For that reason, you need to first query what "kind" of parameter it is. It could be `Scalar`, `Matrix`, `Array` and so on.

Similarly to how we get the "offset" information, you need to query "size" information for a specific "category" as shown on the example below,
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
        slang::TypeLayoutReflection* elementTypeLayout = typeLayout->getElementTypeLayout();
        size_t arrayElementStride = typeLayout->getElementStride(category);
        // ...
        break;
    }
    case slang::TypeReflection::Kind::Struct:
    {
        unsigned fieldCount = typeLayout->getFieldCount();
        for(unsigned ff = 0; ff < fieldCount; ff++)
        {
            VariableLayoutReflection* field = typeLayout->getFieldByIndex(ff);
            // ...
        }
    }
    // ...
```

One important note for recursively iterating a struct kind is that the "offset" values for each field is an offset value counted from the beginning of its struct it belongs to. The application must sum up the offset values of the nesting structs to get the binding index.


### How to figure out which binding slots are unused

Slang allows the application to query if a parameter location is used after Dead-Code-Elimination. This is done through the `IMetadata` interface:

1. `IComponentType::getEntryPointMetadata()` or `IComponentType::getTargetMetadata()` returns `IMetadata*`
2. `IMetadata::isParameterLocationUsed(int set, int binding)` tells you whether or not the parameter binding at the specific location is being used.

Here is an example of how to check if a slot is being used in the shader binary.
```
ComPtr<slang::IComponentType> compositeProgram;
slang::IComponentType* components[] = {module, entryPoint.get()};
session->createCompositeComponentType(
    components,
    2,
    compositeProgram.writeRef(),
    diagnosticBlob.writeRef());
SLANG_CHECK(compositeProgram != nullptr);

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

## Report the complete layout information

### Iterating entry points
Slang Reflection API also provides information about entry points. This information can be accessed from `slang::EntryPointReflection`.

Here is an example of how you can iterate the entry points,
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

### Iterating functions
Slang also provides information about other functions. This information can be accessed from `slang::FunctionReflection`.

Here is an example of how you can access the information of a function,
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
