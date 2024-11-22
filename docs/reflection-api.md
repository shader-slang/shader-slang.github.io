# A Practical and Scalable Approach to Cross-Platform Shader Parameter Passing Using Slang's Reflection API

## Introduction

In this document, we present **one practical approach** to implementing shader parameter passing in an application or engine using Slang's reflection API. This method leverages Slang's powerful features to provide a scalable and cross-platform solution for managing shader parameters efficiently.

We believe this approach is effective, and the Slang reflection API has been designed to support it directly and well. While this is a recommended strategy, it's important to note that **other approaches are possible and supported**. We plan to publish additional "how-to" documents detailing alternative methods for using the reflection API for different needs.

## Target Audience

This guide is intended for developers who:

- Maintain **large, multi-platform shader codebases**.
- Care about **reuse of shader code modules** for efficiency and maintainability.
- Aim to **keep platform-specific code to a minimum** to ensure portability and ease of development.

## Challenges for Cross-platform Reflection API

Two main challenges are:

- **Shader Parameter Binding**: Slang Reflection API must provide binding indices/offsets consistant across multiple platforms.
- **Resource Types**: Slang abstracts the concept of "Resource Type" with a few new concepts.

To execute a shader program, an application must provide arguments for all its shader parameters. The **shader parameter binding** is orchestrated by the CPU application code invoking the GPU program. However, the mechanisms for parameter passing are mediated by platform-specific GPU APIs, each with its own set of rules and constraints.

Also different platforms handle **resource types** differently:

- **Direct3D**: Uses register slots (`b`, `t`, `s`, `u`) for binding constant buffers, textures, samplers, and UAVs, respectively.
- **Vulkan**, **OpenGL**, **WGSL**: Employ binding indices and descriptor sets without differentiating resource types.
- **Metal**: Binds resources via API slots, similar to Direct3D, but with its own syntax and conventions.
- **CUDA/OptiX**: Might pass parameters as ordinary data within buffers.

These differences make it challenging to write cross-platform applications that manage shader parameters efficiently while keeping code maintainable.

## How Slang addresses Shader Parameter Binding problem

### Typical Approaches in Current Engines/Applications

#### Manually-Specified Explicit Binding

Developers can manually assign binding indices to each shader parameter using explicit annotations.

The shader code and the host code can share headers with `#define` directives to synchronize binding annotations. The host code doesn't need the reflection APIs to query binding information, but the binding information has to be manually maintained across platforms. This places the burden of global resource allocation on the application developer.

When different platforms require different binding rules and annotations, developers may choose to write separate binding annotations for each platform. However, this can exacerbate the scalability issue with N platforms and M modules, increasing maintenance overhead. It may also lead to duplicated code and a higher chance of errors.

Developers might derive bindings for one platform from another. For example, the binding information for D3D can be derived for Vulkan. But this approach requires finding a lowest common denominator that works for all targets, which may not fully leverage the capabilities and best practices of each platform.

#### Post-Compilation Reflection

A more popular approach is to allow platform compilers to process code, eliminate unused parameters, and automatically assign bindings.

Since unused shader parameters will be eliminated, each shader can be optimized without paying the cost for the unused ones. However, the binding information will vary arbitrarily across the variants of the same shader source, and it prevents the buffers and descriptor sets from being reused, because even if their source code was the same, the binding information will not match due to the variants. This lowers the efficiency and portability of the application.

Developers don't need to maintain the binding information or any platform-specific annotation rules, because the platform compilers will assign bindings automatically. However, it requires using per-target reflection APIs to query where parameters ended up, and the per-target reflection APIs may require developers to understand legalization rules for parameters.

### Slang approach to the parameter binding

Slang approaches the parameter binding problem differently. The binding indices are relative to the beginning of its nesting `struct`, and they are stored as "offset" for the given `struct` types. When the actual binding happens at runtime, the application will add up the offset of each parameter with the offset of its nesting `struct`.

#### Type based binding

In Slang, the layout of types matter more than the bindings for individual parameter. The offset information to each parameter is relative to the nesting `struct` and the information is self-contained in the type consistently across programs or shader variants.

Slang propses the following workflow:

 - Define Slang `struct` types without explicit binding annotations.
 - Query reflection information about the types with Reflection API.
 - Define methods on your host code that update the corresponding parameters

Defining Slang `struct` in this context is more like defining a module, subsystem or feature that encapsulates its resources for one purpose. You define `struct` types on both the host side and the shader side. The host side types will mirror the types on the shader side and they will be used to fill in those parameters at runtime.

**(TODO: This paragraph seems too much detail for this section)** When you define `struct` on the shader side, Slang allows to have member variables whose types are the ordinary types such as scalars, vector and matrices, and the resource types such as textures and samplers together. Slang also gives developers the freedom to nest a `struct` within another `struct` when it makes sesne.

When querying, the offset values for fields in `struct` can be queried with Slang Reflection API. The offset values for each member is relative to the starting point of its nesting `struct`. The values are not changed even when there are unused parameters within the `struct`, which provides the consistent offset information regardless the shader variants and across the different parts of the whole application.

When defining the host side method that updates the shader parameters, you can calculate the "binding indices" for the native platform API by adding the "starting offset" of the given `struct` and the offset value for each member variable. When a `struct` nests another `struct`, you need to recursively add up the offset of the nesting `struct`.

#### Evaluating Type-Based Binding

Assuming that all shader parameters of your program are bundled into one big struct, there are several advantages to this approach.

Firstly, there is no need for explicit binding annotations whatsoever. This means there is no global resource allocation problem and you just declare what you use. Additionally, there is no need to tweak annotations when compiling for different platforms.

Secondly, arbitrary module composition is possible. This approach is even more flexible than the post-compilation reflection option, because it allows you to include multiple instances of a given feature or component.

Thirdly, the offsets of parameters within a `struct` do not change across programs and variants. This consistency enables you to allocate and re-use buffers, descriptor sets, and other resources within and potentially across frames.

However, the downside of this approach is that you pay for the unused parameters. This can be easily addressed by spliting the monolitic `struct` into sub-modules like `MaterialSystem` or `LightingSystem`. Each module should own the relevant parameters explicitly so that when a certain module is unused, you don't pay for a bunch of unused parameters. This also helps to keep things cleaner, as the parameters are organized more coherently.

## How Slang Abstracts "Resource type"

Different platforms have their own way to handle the resource types. For example, HLSL uses `t` registers for textures whereas Vulkan goes with binding index and set regardless of their resource types.

In order to provide portability across multiple platforms, Slang abstracts the concept of "resource type" and call it "ParameterCategory", or "Category" for short. In other context, it is also called `LayoutResourceKind`, which is more descriptive. This abstraction requires developers to understand some of Slang unique concepts.

This section will start from simple examples of how Slang Reflection API works, and some of key concepts will be explained along the way.

### Simple Cases by Examples

To start with a simple example, consider the following simple shader parameters:

```hlsl
Texture2D myTexture;
SamplerState mySampler;
```

The following code shows how to get the reflection data for the shader parameters above:

```
unsigned parameterCount = shaderReflection->getParameterCount();
for (unsigned pp = 0; pp < parameterCount; pp++)
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

The example above shows that the application using HLSL will get the resource type information as `category`, the binding index as `index`, and the space index as `space`. For the application using Vulkan, category will always be `slang::ParameterCategory::DescriptorTableSlot`.

Note that `getOffset()` is called with an argument, `category`. It is important to understand that the "offset" and "size" information is not a single value but an array of values, each of which is for each category. When `getOffset()` or `getSize()` is called with a category the parameter doesn't belong to, it will return a zero value.

### Layout is Multi-Dimensional

The layout information is multi-dimensional in Slang. A full set of layout information exists for each "ParameterCategory". This means that the size and offset information need to be query for each relavent category for every shader parameters.

// TODO: shader example goes here.

// TODO: explain that the offset for each field depends on the category.

// TODO: Aggregate types like `struct` may be stored using multiple categories.

The size of a type needs to be reflected for each category it consumes. And the offset of a field needs to be reflected for each category it consumes as well.

// TODO: Show reflection API example for the shader example above.

### `TypeLayout` and `VariableLayout`

To store the "layout" information, Slang introduces the following key concepts and relationships:

- **TypeLayout** (`TypeLayoutReflection`): provides **size** and alignment information for a type. It also contains information about "sub-parts" such as fields of a struct, element type of an array and other nested types.

- **VariableLayout** (`VariableLayoutReflection`): provide **offset** information for a variable. It also contains information of each filed of a TypeLayout.

For the Slang Reflection API, you will be mostly dealing with `VariableLayout` and the variants of `TypeLayout`. Both of them reflect the layout information, but `VariableLayout` is more for the **offset** information from the beginning of the given scope, and `TypeLayout` is more for the **size** information of the type. You can access `TypeLayoutReflection` from `VariableLayoutReflection` in the reflection APIs.

> ======================================================

> **TODO**: Need to rewrite the lines below

> ======================================================

## How to actually bind with Shader Cursor

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

### Simple example with Shader Cursor

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