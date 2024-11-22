# A Practical and Scalable Approach to Cross-Platform Shader Parameter Passing Using Slang's Reflection API

## Target Audience

Our primary audience for this document is developers who are building and maintaining a large GPU shader codebase, and who have the freedom or opportunity to consider their high-level architecture for shader parameter passing.

These developers may find that the approach outlined here is a good fit for their requirements, and we hope that they will consider adopting it. Developers who are already locked into an architectural approach may find this material enlightening or aspirational, but not immediately actionable.

A second audience for this document is any developer who wants to better understand the design of the Slang reflection API - especially developers who are considering contributing to the Slang project such that they might need to make changes to the interface or implementation of reflection. Because the engine approach described here motivates many of the design choices in the API, an understanding of the material in this document should help inform their understanding of the reflection API design.

## Introduction

This document describes a comprehensive strategy for handling **parameter-passing** for GPU shader code. The presented approach is able to scale to large shader codebases that implement many different features across multiple modules. The Slang reflection API was intentionally designed to support this approach and to make it practical to adopt.

### This is not the only valid approach!

It is important to emphasize that this document only describes one approach to parameter-passing. Other approaches are possible and can yield good results; indeed, these other approaches are quite common in production shader codebases.

The approach we describe here was developed in collaboration with early adopters of Slang, based on their requirements and the challenges they face. We believe that this is a good general-purpose approach, and that developers can benefit from understanding it even if they do not adopt it.

Developers who are not interested in the approach described here are invited to utilize other documentation on the Slang reflection API instead.

## Background

### Challenges for Cross-Platform Reflection API

Two main challenges are:

- **Shader Parameter Binding**: The Slang Reflection API must provide binding indices/offsets consistent across multiple platforms.
- **Resource Types**: Slang abstracts the concept of "Resource Type" with new concepts, and the Slang Reflection API provides consistent binding information.

To execute a shader program, an application must provide arguments for all its shader parameters. The **shader parameter binding** is orchestrated by the CPU application code invoking the GPU program. However, the mechanisms for parameter passing are mediated by platform-specific GPU APIs, each with their own set of rules and constraints.

Also, different platforms handle **resource types** differently:

- **Direct3D**: Uses register slots (`b`, `t`, `s`, `u`) for binding constant buffers, textures, samplers, and UAVs, respectively.
- **Vulkan**, **OpenGL**, **WGSL**: Employ binding indices and descriptor sets without differentiating resource types.
- **Metal**: Binds resources via API slots, similar to Direct3D, but with its own syntax and conventions.
- **CUDA/OptiX**: Might pass parameters as ordinary data within buffers.

These differences make it challenging to write cross-platform applications that manage shader parameters efficiently while keeping code maintainable.

### Typical Approaches in Current Engines/Applications

#### Manually-Specified Explicit Binding

Developers can manually assign binding indices to each shader parameter using explicit annotations.

The shader code and the host code can share headers with `#define` directives to synchronize binding annotations. The host code doesn't need the reflection APIs to query binding information, but the binding information has to be manually maintained across platforms. This places the burden of global resource allocation on the application developer.

When different platforms require different binding rules and annotations, developers may choose to write separate binding annotations for each platform. However, this can exacerbate the scalability issue with N platforms and M modules, increasing maintenance overhead. It may also lead to duplicated code and a higher chance of errors.

Developers might derive bindings for one platform from another. For example, the binding information for D3D can be derived for Vulkan. But this approach requires finding a lowest common denominator that works for all targets, which may not fully leverage the capabilities and best practices of each platform.

#### Post-Compilation Reflection

A more popular approach is to allow platform compilers to process code, eliminate unused parameters, and automatically assign bindings.

Since unused shader parameters will be eliminated, each shader can be optimized without paying the cost of the unused ones. However, the binding information will vary arbitrarily across the variants of the same shader source, and this prevents the buffers and descriptor sets from being reused, because even if their source code was the same, the binding information will not match due to the variants. This lowers the efficiency and portability of the application.

Developers don't need to maintain the binding information or any platform-specific annotation rules, because the platform compilers will assign bindings automatically. However, it requires using per-target reflection APIs to query where parameters ended up, and the per-target reflection APIs may require developers to understand legalization rules for parameters.

## How Slang Addresses the Shader Parameter Binding Problem

Slang approaches the parameter binding problem differently. The binding indices are relative to the beginning of their nesting `struct`, and they are stored as "offset" for the given `struct` types. When the actual binding happens at runtime, the application will add the offset of each parameter to the offset of its nesting `struct`.

### Type-Based Binding

In Slang, the layout of types matters more than the bindings for individual parameters. The offset information to each parameter is relative to the nesting `struct`, and the information is self-contained in the type, consistently across programs or shader variants.

Slang proposes the following workflow:

- Define Slang `struct` types without explicit binding annotations.
- Query reflection information about the types with the Reflection API.
- Define methods in your host code that update the corresponding parameters.

Defining Slang `struct`s in this context is more like defining a module, subsystem, or feature that encapsulates its resources for one purpose. You define `struct` types on both the host side and the shader side. The host-side types will mirror the types on the shader side, and they will be used to fill in those parameters at runtime.

When querying, the offset values for fields in a `struct` can be queried with the Slang Reflection API. The offset values for each member are relative to the starting point of its nesting `struct`. The values do not change even when there are unused parameters within the `struct`, which provides consistent offset information regardless of the shader variants and across the different parts of the whole application.

When defining the host-side method that updates the shader parameters, you can calculate the "binding indices" for the native platform API by adding the "starting offset" of the given `struct` and the offset value for each member variable. When a `struct` nests another `struct`, you need to recursively add up the offset of the nesting `struct`.

### Evaluating Type-Based Binding

Assuming that all shader parameters of your program are bundled into one big `struct`, there are several advantages to this approach.

Firstly, there is no need for explicit binding annotations whatsoever. This means there is no global resource allocation problem, and you just declare what you use. Additionally, there is no need to tweak annotations when compiling for different platforms.

Secondly, arbitrary module composition is possible. This approach is even more flexible than the post-compilation reflection option because it allows you to include multiple instances of a given feature or component.

Thirdly, the offsets of parameters within a `struct` do not change across programs and variants. This consistency enables you to allocate and reuse buffers, descriptor sets, and other resources within and potentially across frames.

However, the downside of this approach is that you pay for the unused parameters. This can be easily addressed by splitting the monolithic `struct` into sub-modules like `MaterialSystem` or `LightingSystem`. Each module should own the relevant parameters explicitly so that when a certain module is unused, you don't pay for a bunch of unused parameters. This also helps to keep things cleaner, as the parameters are organized more coherently.

## How Slang Reflects "Resource Type"

Different platforms have their own way to handle resource types. For example, HLSL uses `t` registers for textures, whereas Vulkan goes with binding index and set regardless of their resource types.

In order to provide portability across multiple platforms, Slang reflects the concept of "resource type" and calls it "ParameterCategory", or "Category" for short. In other contexts, it is also called `LayoutResourceKind`, which is more descriptive. This abstraction requires developers to understand some of Slang's unique concepts.

This section will start with simple examples of how the Slang Reflection API works, and some of the key concepts will be explained along the way.

### Simple Cases by Example

To start with a simple example, consider the following shader parameters:

```hlsl
Texture2D myTexture;
SamplerState mySampler;
```

The following code shows how to get the reflection data for the shader parameters above:

```cpp
unsigned parameterCount = shaderReflection->getParameterCount();
for (unsigned pp = 0; pp < parameterCount; pp++)
{
    VariableLayoutReflection* parameter =
        shaderReflection->getParameterByIndex(pp);

    ParameterCategory category = parameter->getCategory();
    unsigned index = parameter->getOffset(category);
    unsigned space = parameter->getBindingSpace(category)
                   + parameter->getOffset(ParameterCategory::SubElementRegisterSpace);
    // ...
}
```

The example above shows that an application using HLSL will get the resource type information as `category`, the binding index as `index`, and the space index as `space`. For applications using Vulkan, category will always be `ParameterCategory::DescriptorTableSlot`.

Note that `getOffset()` is called with an argument, `category`. It is important to understand that the "offset" and "size" information is not a single value but an array of values, each of which is for each category. When `getOffset()` or `getSize()` is called with a category the parameter doesn't belong to, it will return a zero value.

### Layout is Multi-Dimensional

The layout information is multi-dimensional in Slang. A full set of layout information exists for each "ParameterCategory".

This means that the size and offset information need to be queried for each relevant category for every shader parameter. As a more interesting case, aggregate types like `struct` may store parameters using multiple categories.

Consider the following shader that has a `struct` with multiple categories:

```hlsl
struct Material
{
    Texture2D diffuseMap;
    SamplerState diffuseSampler;
}
```

In HLSL, the shader above will use `Texture2D` to `t0` and `SamplerState` to `s0`. Although their binding indices are both "0", they don't conflict because they are assigned to different "resource types". From an abstraction point of view, you can think of each "resource type" as its own dimension orthogonal to the other "resource types".

The following code shows how to iterate the members in the `struct` for each category:

```cpp
TypeLayoutReflection* typeLayout = parameter->getTypeLayout();
TypeReflection::Kind kind = typeLayout->getKind();
if (kind == TypeReflection::Kind::Struct)
{
    unsigned fieldCount = typeLayout->getFieldCount();
    for (unsigned ff = 0; ff < fieldCount; ff++)
    {
        VariableLayoutReflection* field = typeLayout->getFieldByIndex(ff);
        TypeLayoutReflection* fieldTypeLayout = field->getTypeLayout();

        auto category = field->getCategory();
        auto offset = field->getOffset(category);
        auto space = field->getBindingSpace(category);
        auto size = fieldTypeLayout->getSize(category);

        // ...
    }
}
```

Note that the `offset`, `space`, and `size` values above are meaningful only for the relevant `category` they belong to. In other words, the offset, space, and size of a type need to be reflected for each category.

### `TypeLayout` and `VariableLayout`

To store the "layout" information, Slang introduces the following key concepts and relationships:

- **TypeLayout** (`TypeLayoutReflection`): Provides **size** and alignment information for a type. It also contains information about "sub-parts" such as fields of a struct, element type of an array, and other nested types.

- **VariableLayout** (`VariableLayoutReflection`): Provides **offset** information for a variable. It also contains information on each field of a TypeLayout.

For the Slang Reflection API, you will be mostly dealing with `VariableLayout` and the variants of `TypeLayout`. Both of them reflect the layout information, but `VariableLayout` is more for the **offset** information from the beginning of the given scope, and `TypeLayout` is more for the **size** information of the type. You can access `TypeLayoutReflection` from `VariableLayoutReflection` in the reflection APIs.

> ======================================================

> **TODO**: Need to rewrite the lines below

> ======================================================

## How to Actually Bind with Shader Cursor

### Why Shader Cursors?

Shader cursors provide a **convenient abstraction** for navigating and setting shader parameters based on the layouts provided by the reflection API.

- Simplify managing **offsets and resource bindings**.
- **Abstract away platform-specific details**, allowing for cross-platform code.
- Facilitate **recursive parameter setting**, particularly with nested structs and arrays.

### What Is a Shader Cursor?

- Conceptually, a **pointer or reference** into a descriptor set, buffer, or parameter block.
- **Knows the type layout** of the data it points to.
- Provides methods to:
  - **Compute cursors** to fields by index or name.
  - **Compute cursors** to array elements.
  - **Set values and resources** at the current cursor position.

### Simple Example with Shader Cursor

> **TODO**

## Appendices

### Appendix A: Why the Math for Arrays Works the Way It Does

- **Element Stride**: The distance (in bytes or bindings) between elements in an array.
- When computing offsets for array elements, **element stride is multiplied by the index** to reach the correct position.
- This accounts for any padding or alignment requirements imposed by the platform.

### Appendix B: Layout for Constant Buffers and Parameter Blocks

- **Constant Buffers**: Store constant data (e.g., scalar and vector types). Use byte offsets for parameter binding.
- **Parameter Blocks (`ParameterBlock<T>`)**: Encapsulate a set of parameters, potentially including resources, into a single binding point.
- The reflection API provides **size and alignment** details to correctly allocate and populate these buffers.

### Appendix C: Binding Ranges

- **Binding Ranges**: Represent a contiguous range of resource bindings, such as a texture array.
- The reflection API provides information about **binding ranges**, allowing the application to bind resources efficiently.
- **Cross-Platform Consistency**: By using binding ranges, the same application code can manage resources uniformly across different graphics APIs.

## Conclusion

By **thinking in terms of types** and leveraging Slang's reflection API, developers can implement a practical and scalable approach to shader parameter passing that is **cross-platform** and **efficient**. This method abstracts platform-specific details, reduces maintenance overhead, and allows for **arbitrary module composition** without the complexities of traditional approaches.

While it requires a shift in how shader code and application code are architected, the benefits of consistency, reusability, and scalability make it a compelling strategy for modern graphics applications.
