---
title: Using Slang Parameter Blocks
layout: page
description: A guide to using Slang's Parameter Block feature
permalink: "/docs/parameter-blocks/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

The `ParameterBlock<>` type in the Slang core library can be used to implement efficient shader parameter passing while supporting simple, maintainable, cross-platform code.

This article will introduce parameter blocks and the problem they solve, provide guidelines for how to use them in a shader codebase, and show how the Slang reflection API can be used to conveniently interface with such shader code from a host application.

## Background

### Ordinary and Opaque Types

The uniform parameters of a GPU shader may include data of both *ordinary* and *opaque* types.

Ordinary types are those that can be stored into and loaded from memory, with a well-defined representation for each target, such as `float4` and `int`.
Shader parameters of ordinary type are typically passed as the contents of buffers residing in GPU-acessible memory.

Opaque types are those that might be passed via mechanisms that are specific to particular hardware revisions or driver software versions, such as `Texture2D` and `RWStructuredBuffer<float4>`.
On some hardware, shader parameters of opaque type might be passed via GPU hardware state registers or other architecture-specific means.
Even when data of an opaque type is stored in memory, the exact representation (and sometimes even the *size*) of that data is not known to application code, so that access to that data must be mediated by driver software.

### Descriptor Sets, Tables, etc.

Many performance-oriented GPU APIs include a construct that can be used to group together shader parameter data of opaque type:

* Vulkan has **descriptor sets**  
* D3D12 has **descriptor tables**  
* Metal has **argument buffers**  
* WebGPU has **bind groups**

Each of these constructs can be used to define a logical *group* of shader parameter data.
Grouping of parameter data can allow application and driver work to be amortized, around allocation, writing, and transmission of parameter data.

A single shader program may have multiple groups as inputs.
The use of multiple groups allows subsets of parameter data to be re-used across GPU dispatches.
GPU shader programmers are encouraged to group parameters based on their expected rate of change, to maximize efficiency.

Most of these APIs support defining some form of *pipeline layout*: an API object that defines the groups and their contents, independent on any particular shader program.
Groups that are bound using a given pipeline layout can be re-used across multiple shader programs/pipelines, so long as they all agree on the layout.

### Challenges

While grouping of parameter data can help improve efficiency for applications that issue many draw calls, adoption of these mechanisms in production shader codebases has been limited.
There are several challenges that arise when developers try to leverage parameter groups and how they were exposed in languages like GLSL and HLSL

#### Not all targets support groups

On some targets, such as CPUs and CUDA/OptiX, everything is "just memory" and all types are ordinary.
There is no need for an API-/driver-mediated grouping construct, because GPU-accessible buffers are sufficient.

More significantly, older GPU graphics APIs like D3D11, OpenGL, and WebGL do not include a grouping construct.
Instead, shader parameter data of opaque type is passed via one or more binding "slots" in GPU context state.

Shader code that intends to be portable across a wide range of target platforms must be able to adapt to these differences: both cases where groups are not needed because buffers suffice, and cases where groups are simply not supported.

Note that the way support for descriptor sets was added to GLSL (HLSL makes similar decisions) attempts to allow code to be written in a way that works for both newer APIs with groups (Vulkan) and older APIs without (OpenGL, WebGL).
The basic idea is that grouping is only indicated via `layout` modifiers (`register` modifiers in HLSL), and applications can use preprocessor techniques to select between different modifiers based on the target (e.g., hiding the `layout(set=...)` modifiers when compiling for OpenGL).
While this design choice was expedient, requiring minimal changes to the shading language and enabling simple porting of existing code, it creates its own challenges.

#### Pervasive manual annotation is required

When compiling GLSL code for Vulkan, every shader parameter that goes into a descriptor set other than `set=0` *requires* a `layout` modifier.
In practice, most shader codebases that intend to make use of groups for Vulkan, D3D12, etc. rely on manual annotation of *every* shader parameter.
For example, instead of the following:

```glsl
// material
texture2d material_albedoMap;
texture2d material_specularMap;
sampler material_sampler;

// lighting environment
texture2d environment_csmLayers[4];
sampler environment_csmSampler;
uniform environment_params
{
    float3 sunDir;
    float3 sunIntensity;
    float4x4 csmLayerTransforms[4];
};
```

Code like the following is required:

```glsl
// material
layout(set=0, binding=0) texture2d material_albedoMap;
layout(set=0, binding=1) texture2d material_specularMap;
layout(set=0, binding=2) sampler material_sampler;

// lighting environment
layout(set=1, binding=0) uniform
{
    float3 sunDir;
    float3 sunIntensity;
    float4x4 csmLayerTransforms[4];
};
layout(set=1, binding=1) texture2d environment_csmLayers[4];
layout(set=1, binding=2) sampler environment_csmSampler;
layout(set=1, binding=3) textureCube environment_envMap;
```

Manual annotations for grouping parameters into `set`s (and for assigning each parameter a `binding`) make shader code less readable and, importantly, less *maintainable*.
Adding or removing parameters, or changing how parameters are grouped, requires updating the manual annotations to match.
For large shader codebases that include many subsystems defined across many files, maintaining valid manual annotations (with no overlaps between subsystems that might be used together) amounts to a global register allocation problem--not the sort of thing programmers should all be expected to do by hand.

Our experience, from seeing a large number of GPU shader codebases, is that the vast majority of shader codebases include manual annotations that are entirely straightforward.
Developers typically group parameters that belong in the same `set` together textually, and within a `set` parameter declarations use sequential `binding`s starting at zero.

Maintaining manual annotations is straightforward but tedious--exactly the kind of work that we should offload onto our tools.

#### Grouping constructs have different rules per-platform

Some platform-specific differences are relatively minor:

* Metal's argument buffers support mixing ordinary and opaque types in a group, while other targets do not (unless `VK_EXT_inline_uniform_block` is used).
* D3D12 HLSL's `space` modifiers do not necessarily map one-to-one onto descriptor tables; instead, a "root signature" can be used to almost arbitrarily rearrange shader parameters.

A more significant, and frustrating, difference is that D3D12 disagrees with Vulkan (and WebGPU) on how to count shader parameters.
Revisiting our example code from above, and authoring it in idiomatic HLSL instead:

```hlsl
// material
Texture2D material_albedoMap   : register(space0, t0);
Texture2D material_specularMap : register(space0, t1);
SamplerState material_sampler  : register(space0, s0);

// lighting environment
cbuffer Environment                           : register(space1, b0)
{
    float3 sunDir;
    float3 sunIntensity;
    float4x4 csmLayerTransforms[4];
};
Texture2D environment_csmLayers[4]            : register(space1, t0);
SamplerComparisonState environment_csmSampler : register(space1, s0);
TextureCube environment_envMap                : register(space1, t4);
```

The most obvious change here is the switch from GLSL `layout` modifiers to HLSL `register` modifiers, but there are two other changes that are motivated by the differences between how D3D12 and Vulkan count.

First, D3D12 associates opaque-type shader parameters with a few different register classes based on their type.
In this example, the textures use `t` registers, constant buffers use `b` registers, and samplers use `s` registers.
This is in contrast to Vulkan, where all of these cases simply use `binding`s.
In the idiomatic HLSL code above, the `material_sampler` parameter uses register `s0`, because it is the first sampler declared in its space; the `s0` register does not conflict with the `t0` register used for `material_albedoMap` since they have different register classes.

Second, D3D12 treats an array like `environment_csmLayers` above as consuming multiple registers, while Vulkan treats arrays of opaque type as consuming a single `binding`.
In the idiomatic HLSL code above, the `environment_envMap` parameter needs to be placed in register `t4` to avoid colliding with `environment_csmLayers`, which consumes four registers: `t0` through `t3`.

Because of the differences in how Vulkan and D3D12 count, cross-platform HLSL codebases will often include two different kinds of manual annotations:

```hlsl
// material
[[vk::binding(0,0)]] Texture2D material_albedoMap   : register(space0, t0);
[[vk::binding(1,0)]] Texture2D material_specularMap : register(space0, t1);
[[vk::binding(2,0)]] SamplerState material_sampler  : register(space0, s0);

// lighting environment
[[vk::binding(0,1)]] cbuffer Environment                           : register(space1, b0)
{
    float3 sunDir;
    float3 sunIntensity;
    float4x4 csmLayerTransforms[4];
};
[[vk::binding(1,1)]] Texture2D environment_csmLayers[4]            : register(space1, t0);
[[vk::binding(2,1)]] SamplerComparisonState environment_csmSampler : register(space1, s0);
[[vk::binding(3,1)]] TextureCube environment_envMap                : register(space1, t4);
```

Note that both the `dxc` and `slangc` compilers support a variety of command line options (e.g., `-fvk-b-shift`, `-fvk-t-shift`, etc.) that can be used to derive set and binding indices for Vulkan (and WebGPU) from D3D-style `register` modifiers, but these options are not easy to work with and we do *not* recommend them as a general-purpose solution for portable codebases.

## Parameter Blocks

Slang provides *parameter blocks* as an alternative to all the headaches of manual annotation.
Taking the recurring example we have used and translating it to idiomatic Slang yields:

```hlsl
struct Material
{
    Texture2D albedoMap;
    Texture2D specularMap;
    SamplerState sampler;
}

struct Environment
{
    float3 sunDir;
    float3 sunIntensity;

    Texture2D csmLayers[4];
    SamplerComparisonState csmSampler;
    float4x4 csmLayerTransforms[4];

    TextureCube envMap;
}

ParameterBlock<Material> material;
ParameterBlock<Environment> environment;
```

Rather than manually annotating many global shader parameters to put them in the same logical group, a Slang programmer can explicitly group those parameters into an ordinary `struct` type, and then declare a single `ParameterBlock<>` using that type.

Note that despite the absence of any manual annotations in this Slang code, it produces *exactly* the same pipeline layout as the heavily-annotated HLSL at the end of the previous section, for both D3D12 and Vulkan.
In addition, this code can work across *all* of the targets that the Slang compiler supports, including targets that do not have a built-in grouping construct.

### Automatic Layout and Binding

The Slang compiler is responsible for *binding* the parameters of a shader program to their locations for a particular target (where locations can include registers, bindings, slots, etc.).
The number (and kind) of locations used by a parameter depends on the *layout* of its type for the target.

A key feature of the Slang compiler is that binding is both *automatic* and *deterministic*.
Automatic binding means that there is no need for manual annotations of shader parameters.
Deterministic binding means that the locations given to parameters will be the same from one compile to the next, even when things like function bodies change.

Binding of parameters in a Slang program proceeds in a few steps:

* First, all parameters with manual annotations (that are appropriate to the target) claim a range of locations, starting with the location in the annotation, and with a size based on the layout of the parameter's type.
    
* Second, all global-scope parameters without manual annotations claim ranges using a first-fit allocation.
The relative order in which modules and source files are visited is deterministic, but dependent on what was passed to the linker.
Within a single file parameters are visited top-down in source order.
    
* Third, all entry-point uniform parameters without manual annotations claim ranges using first-fit.
The relative order in which entry points are visited is deterministic, based on the order the entry points were passed to the linker.

Typically, a `ParameterBlock<>` declaration will claim the next available group index (e.g., a Vulkan `set` index or a D3D12 `space` index).
There are, however, a few details that are worth going into.

#### A Simple Case

Consider the `Material` type from our running example:

```hlsl
struct Material
{
    Texture2D albedoMap;
    Texture2D specularMap;
    SamplerState sampler;
}
```

When compiling for Vulkan, the layout for `Material` will consume three `binding`s.
The layout for each field within the `struct` gets its own relative offset; e.g., the `specularMap` field gets a relative offset of one `binding`.

When the `Material` type is used to declare a parameter block like:

```hlsl
ParameterBlock<Material> material;
```

the fields within the `struct` will all be bound to the same `set` index (here `set=0`), and each will have a `binding` based on its relative offset.
For example, `material.specularMap` will be bound to a location equivalent to `layout(set=0, binding=1)`.

#### Ordinary Data

The `Environment` type from our running example is more complicated than `Material`, in that it mixes both ordinary- and opaque-type fields:

```hlsl
struct Environment
{
    float3 sunDir;
    float3 sunIntensity;

    Texture2D csmLayers[4];
    SamplerComparisonState csmSampler;
    float4x4 csmLayerTransforms[4];

    TextureCube envMap;
}
```

When compiling for Vulkan, a typical layout for `Environment` (using `std140` layout rules) would consume 96 bytes and three `binding`s.
In that layout, the relative offset of the `sunIntensity` field is 16 bytes, while the relative offset of the `envMap` field is two `binding`s.

When the `Environment` type is used to declare a parameter block:

```hlsl
ParameterBlock<Environment> environment;
```

the fields of the `struct` will all get the same `set` index (in our example this is `set=1`).
Because the contents of the block include ordinary data (96 bytes worth), the Slang compiler will automatically introduce a constant buffer to hold this data.
The automatically-introduced constant buffer for `environment` will get `binding` zero in the set, and all the other opaque-type fields inside the block will have their relative `binding`s adjusted to account for this.
For example, the `environment.envMap` field will be bound as if `layout(set=1,binding=3)` was used, despite the relative offset of `envMap` in `Environment` being only two `binding`s.

#### Empty Blocks

As a corner case, a parameter block may be declared using an empty type for its content:

```hlsl
struct Empty {}
ParameterBlock<Empty> empty;
```

In this case, the type `Empty` contains nothing: no bytes, no `binding`s. There is no need to allocate a full `set` index for nothing, so the Slang compiler does not do so.

#### Nested Blocks

It is valid in Slang code to nest one parameter block inside another. For example:

```hlsl
struct Inner { float4 a; }
struct Outer
{
    float4 b;
    ParameterBlock<Inner> inner;
}
ParameterBlock<Outer> outer;
```

Most of the targets that Slang supports do not allow a group to contain references to other groups, so the Slang compiler legalizes such declarations by "flattening" them.
For example, given the above code as input, the Slang compiler would assign `set=0` to the parameter `outer`, and the nested block `outer.inner` would get `set=1`.

#### Targets Without Groups

For targets that do not have a built-in construct for grouping opaque-type parameters, the Slang compiler will treat a `ParameterBlock<Whatever>` exactly the same as a `ConstantBuffer<Whatever>`.

##### Older Targets

On an older target like D3D11/DXBC, we can think of the Slang compiler taking code like this:

```hlsl
struct Material
{
    Texture2D albedoMap;
    Texture2D specularMap;
    SamplerState sampler;
}
ParameterBlock<Material> material;
```

and compiling it *as if* the programmer instead wrote this:

```hlsl
cbuffer material
{
    Texture2D albedoMap;
    Texture2D specularMap;
    SamplerState sampler;
};
```

Because constant buffers can only contain ordinary data, Slang legalizes this code by flattening it into something like:

```hlsl
cbuffer material
{};
Texture2D material_albedoMap;
Texture2D material_specularMap;
SamplerState material_sampler;
```

Finally, the compiler recognizes the empty constant buffer and eliminates it:

```hlsl
Texture2D material_albedoMap;
Texture2D material_specularMap;
SamplerState material_sampler;
```

##### "It's all just memory" targets

For targets where all types are ordinary, such as CPU and CUDA/OptiX, a `ParameterBlock<Thing>` is equivalent to a `ConstantBuffer<Thing>` but, more importantly, both are represented as just a pointer to a `Thing` (more or less a `Thing const*` in C notation).

These targets do not require automatically-introduced constant buffers (ordinary buffers can mix types like `float4` and `Texture2D`, since both are ordinary), nor do they require any flattening (nested parameter blocks are directly supported, since `ParameterBlock<Whatever>` is itself an ordinary type).

## Guidelines for Shader Programmers

The Slang language and compiler support a wide variety of idioms for declaring and using shader parameters, because so many different approaches are found in production shader codebases.
However, there are guidelines that we recommend for developers who are writing new shader codebases in Slang, or who are refactoring an existing codebase to be cleaner and more maintainable.

### Avoid Manual Annotations

Whenever possible, developers should declare shader parameters in a simple, readable fashion and then allow the Slang compiler's automatic and deterministic binding rules to apply.
Manual annotations are impractical to maintain at the scale of real-time rendering codebases we are now seeing as path tracing and machine-learning-based approaches become more widespread.

Typically, developers who decide to drop manual annotations end up adopting run-time reflection as part of their application codebase, but this is not the only option.
Because the binding and layout algorithm used by Slang is deterministic, it is also possible for applications to use the Slang reflection API as part of an offline code generation step, to produce code or data that drives run-time application logic for setting shader parameters.

### Avoid Polluting the Global Scope

It is common in many shader codebases to put global shader parameters next to the code that operates on them.
For example, a `material.h` file might combine the shader parameters for a material with code to evaluate it:

```c++
// material.h
#pragma once

Texture2D material_albedoMap;
Texture2D material_specularMap;
...

float4 evalMaterial(...) { ... }
...
```

When global shader parameters are freely declared in subsystem headers like this, it becomes difficult for a programmer to determine the full set of parameters available to a shader program without exhaustively traversing the `#include` hierarchy of their code.
It is also difficult for the programmer who writes an entry point (who is in the best position to dictate policy choices) to influence or override any grouping decisions that were made in subsystems (which should ideally only provide mechanism, not policy).

Instead, we encourage developers to encapsulate the parameters of a subsystem in a `struct` type, whether that subsystem is declared as a header file or a Slang module:

```hlsl
// material.slang

struct Material
{
    Texture2D albedoMap;
    Texture2D specularMap;
    ...
}

float4 evalMaterial(Material m, ...) { ... }
...
```

This kind of design allows the programmer who is writing shader entry points to decide how parameters should be grouped (or not).

### For Compute Shaders, Use Entry-Point Parameters

It is common practice to define multiple compute entry points in a single file.
For example, these might be entry points that work together to implement some algorithm that requires multiple dispatches.

Many existing codebases declare the uniform shader parameters of each entry point as globals.
For example:

```hlsl
Texture2D<float> inputDepthBuffer;
RWTexture2D<float2> outputDepthTiles;
[shader("compute")] void computeMinMaxDepthTiles(...) { ... }

Texture2D<float4> inputDepthTiles;
StructuredBuffer<float4> inputObjectAABBs;
AppendStructuredBuffer<int> outputObjectIndices;
[shader("compute")] void depthTestObjects(...) { ... }
```

In this code, the related compute entry points `computeMinMaxDepthTiles` and `depthTestObjects` are defined in the same file, and each declares its uniform shader parameters as globals.
Code like this can be error-prone; there is nothing to stop code inside `depthTestObjects` from accessing the `inputDepthBuffer`, or from getting confused between `inputDepthTiles` and `outputDepthTiles`.
When relying on automatic binding via Slang, this code also unnecessarily bloats the pipeline layout for each entry point with the parameters of the other.

A better solution is to properly scope uniform shader parameters to the entry point that they apply to:

```hlsl
[shader("compute")] void computeMinMaxDepthTiles(
    uniform Texture2D<float>    depthBuffer,
    uniform RWTexture2D<float2> depthTiles,
    ...)
{ ... }

[shader("compute")] void depthTestObjects(
    uniform Texture2D<float4>           depthTiles;
    uniform StructuredBuffer<float4>    objectAABBs;
    uniform AppendStructuredBuffer<int> objectIndices;
    ...)
{ ... }
```

In this revised code, it is not possible for the `depthTestObjects` function to accidentally reference the uniform shader parameters of `computeMinMaxDepthTiles`; those parameters are (correctly) out of scope.
Furthermore, when compiling this file with the Slang compiler, automatic binding will not include parameters from one entry point in the pipeline layout of the other.

#### Aside: Push Constants

Note that when compiling for Vulkan, any `uniform` entry-point parameters of ordinary type are automatically bound to push-constant data.
For example:

```hlsl
[shader("compute")] void add(
    uniform StructuredBuffer<float> left,
    uniform StructuredBuffer<float> right,
    uniform RWStructuredBuffer<float> output,
    uniform int count,
    ...)
{...}
```

In this code, the uniform shader parameter `count` will be bound to a push-constant range.
The Slang compiler includes this behavior by default because it makes the common case efficient.
Developers can opt out of this behavior using an explicit constant buffer.
For example:

```hlsl
struct AddParams
{
    StructuredBuffer<float> left;
    StructuredBuffer<float> right;
    RWStructuredBuffer<float> output;
    int count;
}
[shader("compute")] void add(
    uniform ConstantBuffer<AddParams> params,
    ...)
{...}
```

### For Multi-Stage Pipelines, Use Global Parameter Blocks

When writing programs for a multi-stage pipeline such as rasterization or ray-tracing, we recommend that developers put all of the entry points that will be used together in one file (when it is practical to do so), and declare uniform shader parameters at global scope in that file. For example:

```hlsl
// simple-forward-renderer.slang
import material;
...

ParameterBlock<Material> material;
ParameterBlock<Model> model;
...

[shader("vertex")]   void vertexMain(...) { ... }
[shader("fragment")] void fragmentMain(...) { ... }
```

When multiple parameter blocks are used, developers are advised to declare blocks that are expected to change less frequently before those that will change more frequently; this approach will yield bindings that are consistent with performance recommendations given for both Vulkan and WebGPU.

Note that even though this approach makes use of the global scope, it intentionally restricts the scope of global uniform shader parameters to just the files that declare entry points.

Note that if the code for a shader program declares *any* global-scope uniform parameters that aren't themselves `ParameterBlock<>`s, then the automatic binding algorithm will claim a group to hold those parameters; this will generally always be a group with index zero (e.g., `set=0` for Vulkan).
Developers are advised to know whether they intend to declare all of their parameters using parameter blocks (in which case their explicit blocks will start at index zero), or they play to mix other global scope parameters (group index zero) with parameter blocks (indices one and up).

#### Aside: Shader Records

When compiling ray tracing entry points for Vulkan, any `uniform` parameters of an entry point are automatically bound to the "shader record." For example:

```hlsl
[shader("closesthit")]
void closestHitMain(
    uniform int materialIndex,
    ...)
{ ... }
```

In this case, the `closestHitMain` entry point will fetch the `materialIndex` parameter from the shader record.

## Using Parameter Blocks With Reflection

In this section, we will demonstrate how an application that uses parameter blocks in its shader code can utilize the Slang reflection API to help in setting up the data structures used by a GPU API like Vulkan.

### Scope

The approach we will describe here is only appropriate for applications that abide by *one* key constraint: The shader codebase for the application must not use manual binding annotations (e.g., `layout(...)`, `register(...)`, or `[[vk::binding(...)]]`).
In the absence of manual annotation, the Slang compiler will bind parameters to locations in a deterministic fashion, and an application can simply mirror that deterministic logic in its own code in order to derive the locations that parameters have been bound to.

Applications that need to support the fully general case (including shader code with manual binding annotations) can still make use of parameter blocks.
In such cases, developers are encouraged to read the other [documentation](https://docs.shader-slang.org/en/latest/external/slang/docs/user-guide/09-reflection.html) that exists for the Slang reflection API.

This section will also restrict itself to the Vulkan API, for simplicity.
We cover the creation of descriptor set layouts and pipeline layouts using reflection, but *not* the task of writing to them.
Developers interested in using the Slang reflection API for *writing* to descriptor sets are encouraged to read the [documentation](shader-cursors) that we have provided on the "shader cursor" idiom.

### What Goes Into a Pipeline Layout?

Given a Slang shader program that has been compiled and then reflected as a `slang::ProgramLayout`, our goal is ultimately to create a `VkPipelineLayout` that is compatible with that program.

In order to create a pipeline layout with `vkCreatePipelineLayout()`, we need to fill in a `VkPipelineLayoutCreateInfo`.
Most notably, that includes information on the layouts of the descriptor sets in the pipeline, and also any push-constant ranges used by the pipeline.
In application code, this might amount to filling in arrays like:

```c++
struct PipelineLayoutBuilder
{
    std::vector<VkDescriptorSetLayout>  descriptorSetLayouts;
    std::vector<VkPushConstantRange>    pushConstantRanges;
};
```

If we can fill in those two arrays, then we can create a pipeline layout with logic like the following:

```c++
VkPipelineLayout PipelineLayoutBuilder::finishBuilding()
{
    VkPipelineLayoutCreateInfo pipelineLayoutInfo = { VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO };

    pipelineLayoutInfo.setLayoutCount = setLayouts.size();
    pipelineLayoutInfo.pSetLayouts = setLayouts.data();

    pipelineLayoutInfo.pushConstantRangeCount = pushConstantRanges.size();
    pipelineLayoutInfo.pPushConstantRanges = pushConstantRanges.data();

    VkPipelineLayout pipelineLayout = VK_NULL_HANDLE;
    vkCreatePipelineLayout(
        device,
        &pipelineLayoutInfo,
        nullptr,
        &pipelineLayout);

    return pipelineLayout;
}
```

### What Goes Into a Descriptor Set Layout?

In order to fill in the `setLayouts` array, we will clear need to create some `VkDescriptorSetLayout`s.
Similarly to the case for pipeline layouts, this amounts to filling in a `VkDescriptorSetLayoutCreateInfo` so that we can call `vkCreateDescriptorSetLayout()`.
While there are several fields in the structure, the key part is a sequence of "binding ranges":

```c++
struct DescriptorSetLayoutBuilder
{
    std::vector<VkDescriptorSetLayoutBinding> descriptorRanges;
};
```

If we can fill out that array, then we can create a descriptor set layout with logic like:

```c++
void DescriptorSetLayoutBuilder::finishBuilding()
{
    // ...

    VkDescriptorSetLayoutCreateInfo descriptorSetLayoutInfo = { VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO };

    descriptorSetLayoutInfo.bindingCount = bindingRanges.size();
    descriptorSetLayoutInfo.pBindings = bindingRanges.data();

    VkDescriptorSetLayout descriptorSetLayout = VK_NULL_HANDLE;
    vkCreateDescriptorSetLayout(
        device,
        &descriptorSetLayoutInfo,
        nullptr,
        &descriptorSetLayout);

    // ...
}
```

### Parameter Blocks

In typical cases, a `ParameterBlock<>` in Slang shader code will translate into a descriptor set added to the pipeline layout, with one or more descriptor ranges added to that descriptor set based on the element type of the parameter block.
We can summarize this logic as something like:

```c++
void PipelineLayoutBuilder::addDescriptorSetParameterBlock(
    slang::TypeLayoutReflection* parameterBlockTypeLayout)
{
    DescriptorSetLayoutBuilder descriptorSetLayoutBuilder;
    descriptorSetLayoutBuilder.startBuilding();
    descriptorSetLayoutBuilder.addDescriptorRangesForParameterBlockElement(
        parameterBlockTypeLayout->getElementTypeLayout());
    descriptorSetLayoutBuilder.finishBuilding();
}
```

#### Automatically-Introduced Uniform Buffer

The most important detail that needs to be accounted for is that if the element type of the parameter block (the `Thing` in `ParameterBlock<Thing>`) has any amount of ordinary data in it (that is, `Thing` consumes one or more bytes), then the Slang compiler automatically introduces a uniform buffer to pass that data.
The automatically-introduced uniform buffer will only be present if it was needed (that is, when the element type has a non-zero size in bytes) and it will always precede any other bindings for the parameter block.

Adding ranges for the element type of a parameter block can use logic something like the following:

```c++
void DescriptorSetLayoutBuilder::addRangesForParameterBlockElement(
    slang::TypeLayoutReflection* elementTypeLayout)
{
    if(elementTypeLayout->getSize() > 0)
    {
        addAutomaticallyIntroducedUniformBuffer();
    }

    addRanges(elementTypeLayout);
}
```

We first account for the possibility of an automatically-introduced uniform buffer, and then we add binding ranges as we would for any other (non-parameter-block) case.

Adding a binding range for an automatically introduced uniform buffer is simple:

```c++
void DescriptorSetLayoutBuilder::addAutomaticallyIntroducedUniformBuffer()
{
    auto vulkanBindingIndex = bindingRanges.getCount();

    VkDescriptorSetLayoutBinding binding = {};
    binding.stageFlags = VK_SHADER_STAGE_ALL;
    binding.binding = vulkanBindingIndex;
    binding.descriptorCount = 1;
    binding.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;

    bindingRanges.add(binding);
}
```

The most important detail to note here is that the Vulkan `binding` index for the descriptor range is *not* being queried using calls into the Slang reflection API.
Instead, this code simply takes the next available `binding` index in the descriptor set layout.
This code is an example of how an application can streamline its interactions with the Slang reflection API when its shader code eschews the complexity of manual binding annotations.

#### Ordering of Nested Parameter Blocks

When parameter blocks end up nested within one another, the Slang compiler always assigns outer blocks Vulkan `set` indices before those of inner blocks.
If we naively traverse the hierarchy of parameter blocks in a depth-first order, adding them to the `descriptorSetLayouts` array when we are done with each, then they will end up in the wrong order.

To ensure the correct ordering (a depth-first pre-order traversal instead of depth-first post-order), we will reserve space in the `descriptorSetLayouts` array when we start building a descriptor set:

```c++
void DescriptorSetBuildering::startBuilding(
    PipelineLayoutBuilder* pipelineLayoutBuilder)
{
    this->setIndex = pipelineLayoutBuilder->descriptorSetLayouts.size();
    pipelineLayoutBuilder->descriptorSetLayouts.push_back(VK_NULL_HANDLE);
}
```

The index for the reserved array element gets stashed in the state of our descriptor set layout builder:

```c++
struct DescriptorSetLayoutBuilder
{
    int setIndex = -1;
};
```

Then when we are done building a descriptor set layout, and create the corresponding Vulkan API object, we can overwrite the reserved array element:

```c++
void DescriptorSetLayoutBuilder::finishBuilding()
{
    // ...

    VkDescriptorSetLayout descriptorSetLayout = VK_NULL_HANDLE;
    vkCreateDescriptorSetLayout(..., &descriptorSetLayout);

    pipelineLayoutBuilder->descriptorSetLayouts[setIndex] = descriptorSetLayout;
}
```

#### Empty Parameter Blocks

Most parameter blocks will map to a Vulkan descriptor set, but it is possible to have a block that contains nothing but other blocks, in which case a descriptor set for the outer block would contain no descriptor ranges and thus be irrelevant.
The application code we show here uses a simple strategy to account for such cases.

When we have finished building the descriptor set corresponding to a parameter block, we can check whether the resulting descriptor set would contain no descriptor ranges and, if so, skip creating a `VkDescriptorSetLayout`:

```c++
void DescriptorSetLayoutBuilder::finishBuilding()
{
    if(descriptorRanges.size() == 0)
        return;

    // ...
}
```

Because of the way that we reserved space for each potential descriptor set ahead of time, skipping creation of some `VkDescriptorSetLayout`s can result in there being null entries in the array used to build the pipeline layout.
A simple solution is to filter out these null entries as part of creating the pipeline layout:

```c++
VkPipelineLayout PipelineLayoutBuilder::finishBuilding()
{
    std::vector<VkDescriptorSetLayout> filteredDescriptorSetLayouts;
    for(auto descriptorSetLayout : descriptorSetLayouts)
    {
        if(!descriptorSetLayout)
            continue;
        filteredDescriptorSetLayouts.push_back(descriptorSetLayout);
    }
    std::swap(descriptorSetLayouts, filteredDescriptorSetLayouts);

    // ...
}
```

### Descriptor Ranges

Typically, a leaf field of opaque type (each `Texture2D`, `SamplerState`, etc.) in the element type of a parameter block will translate into a range of descriptors in the resulting descriptor set layout that share a single `binding` (represented as a `VkDescriptorSetLayoutBinding`).
We could write logic in the application to recursively traverse the element type and find all of these leaf fields, but getting that logic right can be tricky.
It is far simpler to use the information that the Slang reflection API provides for exactly this purpose.

Every type layout in Slang has the ability to enumerate a flat list of the API-relevant ranges that make it up.
This information is quite general, to account for multiple target APIs, as well as the possible use of explicit binding annotations.
In our case, we know that we are using Vulkan, and that we are not using explicit binding annotations, so we can streamline our code for this case.

```c++
void DescriptorSetLayoutBuilder::addDescriptorRanges(
    slang::TypeLayoutReflection* typeLayout
)
{
    int relativeSetIndex = 0;
    int rangeCount = typeLayout->getDescriptorSetDescriptorRangeCount(relativeSetIndex);

    for (int rangeIndex = 0; rangeIndex < rangeCount; ++rangeIndex)
    {
        addDescriptorRange(
            typeLayout,
            relativeSetIndex,
            rangeIndex);
    }
}
```

In the general case, a single Slang type layout might map to zero or more descriptor sets (or their analogue) on some APIs, and the reflection API accounts for this possibility.
However, in our case we only care about the simple case, so we set `relativeSetIndex` to zero, to indicate that we only want to query the first descriptor set.
The code then iterates over the ranges exposed by the Slang reflection API.

In the common case, each of the range that is reflected by Slang translates to one range in the Vulkan descriptor set:

```c++
void DescriptorSetLayoutBuilder::addDescriptorRange(
    slang::TypeLayoutReflection* typeLayout.
    int relativeSetIndex,
    int rangeIndex)
{
    slang::BindingType bindingType = typeLayout->getDescriptorSetDescriptorRangeType(relativeSetIndex, rangeIndex);
    auto descriptorCount = typeLayout->getDescriptorSetDescriptorRangeDescriptorCount(relativeSetIndex, rangeIndex);

    // ...

    auto bindingIndex = descriptorSetLayoutBuilder.descriptorRange.size();

    VkDescriptorSetLayoutBinding descriptorRange = {};
    descriptorRange.binding = bindingIndex;
    descriptorRange.descriptorCount = descriptorCount;
    descriptorRange.stageFlags = _currentStageFlags;
    descriptorRange.descriptorType = mapSlangBindingTypeToVulkanDescriptorType(bindingType);

    descriptorSetLayoutBuilder.descriptorRanges.push_back(descriptorRange);
}
```

Just as we did when adding a Vulkan descriptor range for an automatically-introduced uniform buffer, we calculate the Vulkan `binding` index of the range implicitly rather than query the Slang reflection API.

Note the variable `_currentStageFlags` here, which is being used to determine what stage(s) ranges should be added to.
We will see how this variable is being updated later.

Note that the Slang API reflects the type of each range as a `slang::BindingType`.
This enumeration is similar to the `VkDescriptorType` enumeration used by Vulkan, but also accounts for the needs of other target APIs.
Filling in a Vulkan descriptor range requires us to map from the Slang representation to the Vulkan one:

```c++
VkDescriptorType mapSlangBindingTypeToVulkanDescriptorType(slang::BindingType bindingType)
{
    switch (bindingType)
    {
    case slang::BindingType::Sampler: return VK_DESCRIPTOR_TYPE_SAMPLER;
    case slang::BindingType::Texture: return VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE;
    // ...

    default:
        assert(!"unexpected binding type");
        return VkDescriptorType(-1);
    }
}
```

#### Some Ranges Need to Be Skipped

The Slang reflection API exposes ranges for all of the non-ordinary data in a type, independent of what API-specific mechanism is used for those ranges.
For example, the reflected ranges for a type may include both ranges that should map to a `binding` in a Vulkan descriptor set and ranges that should map to push constants.
Our application code will skip any ranges that don't go into a descriptor set:

```c++
void DescriptorSetLayoutBuilder::addDescriptorRange(
    slang::TypeLayoutReflection* typeLayout.
    int relativeSetIndex,
    int rangeIndex)
{
    //...

    if(bindingType == slang::BindingType::PushConstant)
        return;

    // ...
}
```

We will account for push-constant ranges in the next section.

### Sub-Object Ranges

The Slang reflection API methods we've used so far are used to query what data a type (logically) contains directly in its storage.
But types can also *indirectly* reference other storage, such as when a field of type `ParameterBlock<>` is nested within another parameter block.
The Slang reflection API refers to these as *sub-objects*, and provides a way to query the sub-object ranges of a type:

```c++
void PipelineLayoutBuilder::addSubObjectRanges(
    slang::TypeLayoutReflection*    typeLayout)
{
    int subObjectRangeCount = typeLayout->getSubObjectRangeCount();
    for (int subObjectRangeIndex = 0; subObjectRangeIndex < subObjectRangeCount; ++subObjectRangeIndex)
    {
        addSubObjectRange(
            typeLayout, subObjectRangeIndex);
    }
}
```

Much like the descriptor ranges that we enumerated earlier, each sub-object range corresponds to some binding type.
The way we handle each range will depend on its type:

```c++
void PipelineLayoutBuilder::addSubObjectRange(
    slang::TypeLayoutReflection*    typeLayout,
    int subObjectRangeIndex)
{
    auto bindingRangeIndex = typeLayout->getSubObjectRangeBindingRangeIndex(subObjectRangeIndex);
    slang::BindingType bindingType = typeLayout->getBindingRangeType(bindingRangeIndex);
    switch (bindingType)
    {
    default:
        return;
    
    // ...
    }
}
```

In order to handle the full contents of a parameter block, application code needs to handle both the descriptor ranges (which become part of the descriptor set for that block) and the sub-object ranges (which become part of the pipeline layout, but are not part of the same descriptor set):

```c++
void DescriptorSetLayoutBuilder::addRanges(
    slang::TypeLayoutReflection* typeLayout)
{
    addDescriptorRanges(typeLayout);
    pipelineLayoutBuilder->addSubObjectRanges(typeLayout);
}
```

#### Nested Parameter Blocks

Any nested parameter blocks will be reflected as a sub-object range.
The content of such a nested block will not be added to the current descriptor set layout, and will instead result in an additional descriptor set being added to the pipeline layout:

```c++
case slang::BindingType::ParameterBlock:
{
    auto parameterBlockTypeLayout = typeLayout->getBindingRangeLeafTypeLayout(bindingRangeIndex);

    addDescriptorSetForParameterBlock(
        parameterBlockTypeLayout);
}
break;
```

#### Push Constant Ranges

In Slang shader code, a push-constant range can be defined in either of two ways:

* Explicitly, by declaring a `ConstantBuffer<>` with the `[[vk::push_constant]]` attribute  
    
* Implicitly, by declaring `uniform` entry-point parameters of ordinary type on a non-ray-tracing entry point

Each of these cases results in a sub-object range with the `PushConstant` binding type:

```c++
case slang::BindingType::PushConstant:
{
    auto constantBufferTypeLayout = typeLayout->getBindingRangeLeafTypeLayout(bindingRangeIndex);
    addPushConstantRangeForConstantBuffer(constantBufferTypeLayout);
}
break;
```

Push-constant ranges belong to the overall pipeline layout, rather than individual descriptor set layouts.
The logic for adding such a range based on reflection data is relatively simple:

```c++
void PipelineLayoutBuilder::addPushConstantRangeForConstantBuffer(
    slang::TypeLayoutReflection* constantBufferTypeLayout)
{
    auto elementTypeLayout = constantBufferTypeLayout->getElementTypeLayout();
    auto elementSize = elementTypeLayout->getSize();

    if(elementSize == 0)
        return;

    VkPushConstantRange vulkanPushConstantRange = {};
    vulkanPushConstantRange.stageFlags = _currentStageFlags;
    vulkanPushConstantRange.offset = 0;
    vulkanPushConstantRange.size = elementSize;

    pushConstantRanges.add(vulkanPushConstantRange);
}
```

Note that this code accounts for the corner case where shader code has declared a `ConstantBuffer<>` with no ordinary data in it, in which case no corresponding push-constant range is needed.

A key thing to observe here is that currently the Slang compiler only supports having a single `ConstantBuffer<>` with the `[[vk::push_constant]]` attribute being in scope for each entry point (meaning either a single global buffer for all stages, or distinct per-entry-point buffers).
Because there can only be a single push-constant range for each entry point, the code here can assume that each range starts at an offset of zero.

### Creating a Pipeline Layout for a Program

At this point we have covered how to use the Slang reflection API to account for the contributions of a `ParameterBlock<>` to a Vulkan pipeline layout.
What remains is to show the top-down process for creating a pipeline layout for an entire Slang shader program.
That layout needs to account for the *top-level* shader parameters of the program: both the global-scope shader parameters and any `uniform` entry-point parameters.

The key insight we take advantage of in this code is that a Slang shader program behaves *almost* as if the top-level shader parameters are grouped into a `struct` and then wrapped in a `ParameterBlock<>`.
The primary distinction is that while a true `ParameterBlock<>` can automatically introduce at most one uniform buffer, a program can result in zero or *more* uniform buffers being automatically introduced.
The global scope can automatically introduce zero or one uniform buffer, and each entry point can introduce zero or one uniform buffer.

The following code shows an outline of how we create a pipeline layout based on a compiled Slang program:

```c++
VkPipelineLayout createPipelineLayout(
    slang::ProgramLayout* programLayout)
{
    PipelineLayoutBuilder pipelineLayoutBuilder;
    DescriptorSetLayoutBuilder defaultDescriptorSetLayoutBuilder;
    defaultDescriptorSetLayoutBuilder.startBuilding();

    defaultDescriptorSetLayoutBuilder.addGlobalScopeParameters(
        programLayout);
    defaultDescriptorSetLayoutBuilder.addEntryPointParameters(
        programLayout);

    defaultDescriptorSetLayoutBuilder.finishBuilding();
    return pipelineLayoutBuilder.finishBuilding();
}
```

Note how this logic builds a *default* descriptor set.
Any top-level shader parameters that aren't themselves explicit `ParameterBlock<>`s will be added into that descriptor set.

#### Global Scope

The global-scope shader parameters of a program can be handled using the building blocks we have already presented:

```c++
void DescriptorSetLayoutBuilder::addGlobalScopeParameters(
    slang::ProgramLayout* programLayout)
{
    _currentStageFlags = VK_SHADER_STAGE_ALL;
    addRangesForParameterBlockElement(
        _slangProgramLayout->getGlobalParamsTypeLayout());
}
```

The global scope effectively behaves like the element type of an (implicit) parameter block.
For example, a uniform buffer may need to be automatically introduced if there are any global-scope `uniform` parameters of ordinary type.
These details are already handled by the `addRangesForParameterBlockElement()` method that we defined earlier.

The main new detail to note here is that we set up the `_currentStageFlags` variable to indicate that all ranges (whether descriptor ranges or push-constant ranges) that are added for the global scope are accessible to all shader stages.

Applications that want to set more precise stage flags, taking into account which data is accessed by which stages in the compiled program binary, are encouraged to look at the more comprehensive documentation on the reflection API.

#### Entry Points

Adding the entry-parameters of a program amounts to adding the parameters of each entry point in turn:

```c++
void DescriptorSetLayoutBuilder::addEntryPointParameters(
    slang::ProgramLayout* programLayout)
{
    int entryPointCount = programLayout->getEntryPointCount();
    for (int i = 0; i < entryPointCount; ++i)
    {
        auto entryPointLayout = programLayout->getEntryPointByIndex(i);
        addEntryPointParameters(entryPointLayout);
    }
}
```

The logic for each entry point is very similar to that for the global scope:

```c++
void DescriptorSetLayoutBuilder::addEntryPointParameters(
    slang::EntryPointLayout* entryPointLayout)
{
    _currentStageFlags = getShaderStageFlags(
        entryPointLayout->getStage());

    addRangesForParameterBlockElement(
        entryPointLayout->getTypeLayout());
}
```

The most important additional detail is that the Vulkan shader stage flags for entry-point parameters can easily be set to only include the stage of the entry point.
Setting the flags requires application code to map a `SlangStage` to the matching `VkShaderStageFlags`:

```c++
VkShaderStageFlags getShaderStageFlags(SlangStage stage)
{
    switch (stage)
    {
    case SLANG_STAGE_VERTEX: return VK_SHADER_STAGE_VERTEX_BIT;
    case SLANG_STAGE_FRAGMENT: return VK_SHADER_STAGE_FRAGMENT_BIT;
    // ...
    }
}
```

### Conclusion

In this article we have attempted to cover parameter blocks from multiple perspectives:

* We described some challenges shader programmers face when trying to build large, maintainable, portable, and high-performance shader codebases.
These challenges motivated the addition of parameter blocks to Slang.
    
* We introduced the `ParameterBlock<>` type in the Slang core library, and described how it interacts with type layout and parameter binding on various targets.
    
* We gave some recommendations for how developers can make the best use of parameter blocks in Slang shader codebases.
    
* We showed how applications that follow our recommendations can use the Slang reflection API to easily set up Vulkan API descriptor set and pipeline layouts based on their shader code.

While this article showed how to allocate the Vulkan API objects that represent descriptor set and pipeline *layouts* using the Slang reflection API, it does not show how the reflection API can be used to *write* shader parameter data to descriptor sets and buffers.
Developers looking for such information are encouraged to read the [article](docs/shader-cursors) on "shader cursors" for an example of a simple and high-performance idiom for setting shader parameters that is compatible with the information in this article.

Our recommendations are based on real-world experience with developers using Slang on large codebases, but we do not intend to *prescribe* any specific policy that application developers must follow.
Instead, we encourage developers to experiment and find what approaches work best for their particular use cases.
The Slang project team is interested in hearing from developers about their real-world experiences, and we will continue to evolve the language, compiler, and API for Slang based on what we learn.
