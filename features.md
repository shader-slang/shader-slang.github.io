# Key Features of Slang

The Slang language and compiler have been carefully designed and implemented to provide key benefits that are important to real-time graphics programmers.

## Backwards-Compatible with Existing HLSL

Because Slang extends the HLSL language, it is compatible with almost all the HLSL shaders and compute kernels you've already written. You don't need to rewrite your code from scratch to give it a try.

Slang supports compute shaders, the traditional rasterization pipline, and ray tracing kernels.

## Cross-Platform Code Generation

The Slang compiler can generate code for a wide variety of target platforms and graphics APIs.
Currently, the compiler supports the following compilation targets:

* DirectX shader bytecode (DXBC) for D3D 11 and 12
* DirectX intermediate language (DXIL) for D3D 12
* SPIR-V for Vulkan
* PTX for CUDA
* Executable or shader library for host CPU
* HLSL source code (stripped of all Slang-specific features)
* GLSL source code
* CUDA-compatible C++ source code
* CPU-compatible C++ source code

The Slang toolset does not enforce a "lowest common denominator" appraoch, and instead strives to make it possible to take advantage of platform- or API-specific functionality when it is crucial to meeting performance goals.

Because the Slang compiler supports output of high-level source code, support for additional platforms can be added easily.

## Parameter Blocks: Simple and Efficient Shader Parameter Binding

The Vulkand / Direct3D 12 APIs introduced the ideas of descriptor sets / tables, which provide a way to reduce the overhead of binding values to shader parameters by grouping those parameters into coarse-grained blocks. An important challenge in adopting descriptor sets/tables in existing GLSL / HLSL is that they require using tedious and manual annotation of every single shader parameter.

For example, consider an HLSL shader that want to pass material and camera parameters as distinct sets/tables, and that needs to work on both D3D and Vulkan. A typical approach when using vanilla HLSL and the dxc compiler might be:

```hlsl
[[vk::binding(0, 0)]]
cbuffer Material : register(b0, space0)
{
    float4 albedoFactor;
    // ...
};

[[vk::binding(1, 0)]]
Texture2D materialTextures[3] : register(t0, space0);

[[vk::binding(2, 0)]]
SamplerState materialSampler : register(s0, space0);

[[vk::binding(0, 1)]]
cbuffer Camera : register(b0, space1)
{
    float4x4 viewMatrix;
    // ...
};
```

Note how each parameter is explicitly bound to a descriptor set and a location in that set, and also how the decorations need to be duplicated for both D3D and Vulkan because of the different ways they count registers/bindings.

For comparison, here is an equivalent piece of code using Slang:

```hlsl
struct Material
{
    float4 albedoFactor;
    Texture2D textures[3];
    SamplerState sampler;
    // ...
};
ParameterBlock<Material> gMaterial;

struct Camera
{
    float4x4 viewMatrix;
    // ...
};
ParameterBlock<Camera> gCamera;
```

Note how the code is shorter and easier to read and understand. This Slang code produce *exactly* the same bindings as the earlier example for Vulkan and D3D12. In addition, the Slang code here can be used without modification on other targets such as D3D11, CPU, and CUDA.

Parameter blocks can greatly reduce the amount of boilerplate that is required when declaring and binding descriptor sets / tables. The reduction in programmer effort makes it easier for applications to efficiently exploit these new features of modern graphics APIs.

## Interfaces and Generics: Modular and Extensible Shader Specialization

It is typical for graphics codebases to have a few features that multiple different implementations.
As an instructive (but not entirely realistic) example, consider an old-fashioned "pass per light" codebase that supports multiple types of lights: point, directional, spot, etc.

It is common practice for GPU shader code to use preprocessor conditionals to select between different implementations of a feature:

```hlsl
struct LightSample { float3 intensity; flaot3 direction; };

LightSample ls;
#if LIGHT_TYPE == LIGHT_TYPE_POINT
ls = samplePointLight(lightData, worldPosition);
#elif LIGHT_TYPE == LIGHT_TYPE_SPOT
ls = sampleSpotLight(lightData, worldPosition);
#elif ...
...
#endif
```

The benefit of such preprocessor-based approaches is that the same code can be compiled to produce multiple specialized variants, each of which may have higher GPU performance than a catch-all version based on dynamic branching. However, preprocessor-based specialization has numerous downsides when it comes to software engineering, including:

* Lack of a clearly-defined interface to a feature. The interface contract for lights is not spelled out or enforced by the code itself, and cannot be checked without compiling all possible variants.

* Difficulty adding new implementations in a modular fashion. Adding a new light type requires modifications to every single `#if` site, which can include but subroutine bodies and shader parameter declarations. 

* Long compile times and large binary sizes. Similar to C++ templates, preprocesor-based specialization requires all possible variants to be compiled separately. Even when doing prototyping, it is not possible to generate a version of the code based on dynamic branching.

Slang addresses these issues with a combination of two features: interface and generics.
We can begin by codifying the contract that lights are supposed to implement as an `interface` declaration:

```hlsl
interface ILight
{
    LightSample sampleLight(float3 worldPosition);
}
```

Different implementations of the lighting feature can then be declared as types that explicitly conform to this interface, which allows the compiler to statically check that they do what is required:

```hlsl
struct PointLight : ILight
{
    float3 position;
    float3 intensity;

    LightSample sampleLight(float3 worldPosition) { ... }
}
```

A piece of shader code that wants to work with multiple light types can then be declared as a generic:

```hlsl
float3 computeDiffuse<L : ILight>( float3 albedo, float3 P, float3 N, L light )
{
    LightSample ls = light.sampleLight(P);
    float nDotL = max(0, dot(N, ls.direction));
    return albedo * nDotL * ls.intensity;
}
```

Note how the body of `computeDiffuse()` does not mention any particular light type(s).
The Slang compiler statically checks that this function does not use any members of the type `L` that are not defined by the `ILight` interface.
New light types can be added to the codebase as separate files/modules, and will automaticaly be compatible with the `computeDiffuse()` function.

As a convenience, the Slang compiler also allows functions like `computeDiffuse()` to be written as taking a parameter of an interface type (like `ILight`), instead of using the `<>`-based generics syntax:

```hlsl
float3 computeDiffuse( float3 albedo, float3 P, float3 N, ILight light )
{ ... }
```

By using interfaces and generics in Slang, a developer can overcome all of the major limitations of preprocessor-based specialization:

* Interfaces are clearly defined and statically checked

* New implementations of an interface can be added in a modular fashion, without requiring changes to code that uses the interface

* The Slang compiler can also generate *unspecialized* code for functions like `computeDiffuse()`, by generating `switch` statements to select between the known implementations of an interface like `ILight`. Unspecialized code may not perform as well as fully-specialized code, but can be quicker to compile and produce fewer binary kernels. Note that support for unspecialized code generation is work in progress, and currently only works on CPU and CUDA targets.

## Other Features

This document only describes some of the most important features that make Slang a good choice for writing real-time graphics code. Slang supports a number of other extensions beyond HLSL that support the needs of real-world shader codebases, including:

* Separately compiled modules with `import` support
* Property declarations
* Namespaces
* Operator overloading
* `uniform` parameters on shader entry points
* Associated types
* (Optional) output code obfuscation
