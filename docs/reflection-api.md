# A Practical and Scalable Approach to Cross-Platform Shader Parameter Passing Using Slang's Reflection API

## Introduction

In this document, we present **one practical approach** to implementing shader parameter passing in an application or engine using Slang's reflection API. This method leverages Slang's powerful features to provide a scalable and cross-platform solution for managing shader parameters efficiently.

We believe this approach is effective, and the Slang reflection API has been designed to support it directly and well. While this is a recommended strategy, it's important to note that **other approaches are possible and supported**. We plan to publish additional "how-to" documents detailing alternative methods for using the reflection API for different needs.

## Target Audience

This guide is intended for developers who:

- Maintain **large, multi-platform shader codebases**.
- Care about **reuse of shader code modules** for efficiency and maintainability.
- Aim to **keep platform-specific code to a minimum** to ensure portability and ease of development.

## Background

### Why Is This Challenging?

To execute a shader program, an application must provide arguments for all its shader parameters. This parameter passing is orchestrated by the CPU application code invoking the GPU program. However, the mechanisms for parameter passing are mediated by **platform-specific GPU APIs**, each with its own set of rules and constraints.

Different platforms handle shader parameters differently:

- **Direct3D**: Uses register slots (`b`, `t`, `s`, `u`) for binding constant buffers, textures, samplers, and UAVs, respectively.
- **Vulkan**, **OpenGL**, **WGSL**: Employs binding indices and descriptor sets without differentiating resource types.
- **Metal**: Binds resources via API slots, similar to Direct3D, but with its own syntax and conventions.
- **CUDA/OptiX**: Might pass parameters as ordinary data within buffers.

These differences make it challenging to write cross-platform applications that manage shader parameters efficiently while keeping code maintainable.

### Typical Approaches in Current Engines/Applications

#### Manually-Specified Explicit Binding

Developers can manually assign binding indices to each shader parameter using explicit annotations.

The shader code and the host code can share headers with `#define` directives to synchronize binding annotations. The host code doesn't need the reflection APIs to query binding information. But the binding information has to be manually maintained across platforms. And it places the burden of global resource allocation on the application developer.

When different platforms require different binding rules and annotations, developers may  choose to write separate binding annotations for each platform. But it can exacerbate the scalability issue with N platforms and M modules, increasing maintenance overhead. And it may also lead to duplicated code and a higher chance of errors.

Developers may derive bindings for one platform from another. The binding information for D3D, as an example, can be derived for Vulkan. But it requires to find a lowest-common-denominator that should work for all targets. It may not fully leverage the capabilities and best practices of each platform.

#### Post-Compilation Reflection

More popular approach is to allow platform compilers to process code, eliminate unused parameters, and automatically assign bindings.

Since unused shader parameters will be eliminated, each shader can be optimized for the best without paying the cost for the unused ones. But the binding information will vary arbitrarily across the variants of the same shader source. And it prevents the buffers and descriptor sets from being reused, because even if their source code was same, the binding information will not match due to the variants. It lowers the efficiency and portability of the application.

Developers don't need to maintain the binding information or any platform specific annotation rules, because the platform compilers will assign bindings automatically. But it requires to use per-target reflection APIs to query where parameters ended up. And the per-target reflection APIs may require developers to understand legalization rules for parameters.

## Alternative solution: binding based on types

Let's say your system has modules and features. You will want to define `struct` types intended for your purposes like "Scene" module, "Material" module" or "Shadow" feature rather than the purpose to conformant to the compiler restrictions.

On the shader side, Slang allows developers to define `struct` that bundles together all of its parameters such as scalars, vectors, matrices, textures and samplers. Slang developers also have freedom to nest other `struct` types in another `struct` type when it makes sense.

On the host side, you define the types that mirror the shader side types. Slang requires the host types to have the members that are necessary to fill in the corresponding parameters, but the types don't need to have the exactly same members.

When querying with Slang reflection API about the types, the binding information is based on how the shader side types are defined. And the binding information is assigned before any unused parameters are identified and before the target specifics are considered. It means that the **offsets** of fields will not change across programs or variants.

Then, the application can get the **binding indices** by adding up the the offset value of each member with the offset value of the nesting struct the member belongs to, recursively.

Example (Slang Shader Code):

```hlsl
struct MaterialParams
{
    float4 baseColor;
    Texture2D baseColorTexture;
    SamplerState baseColorSampler;
};

struct LightingParams
{
    float3 lightDirection;
    float3 lightColor;
};

struct SceneParams
{
    MaterialParams material;
    LightingParams lighting;
};
```

Example (Host Code):

```cpp
struct MaterialParams
{
    Vector4 baseColor;
    Texture* baseColorTexture;
    Sampler* baseColorSampler;
};

struct LightingParams
{
    Vector3 lightDirection;
    Vector3 lightColor;
};

struct SceneParams
{
    MaterialParams material;
    LightingParams lighting;
};

// TODO: need code to show how to get the binding indices
```

> ==============================================================================

> TODO: the lines below here needs to be rewritten

> ==============================================================================

## Evaluating This Approach

Let's assume that all shader parameters of your program were bundled up into one big struct.

**Pros**

 - No need for explicit binding annotations whatsoever
   - No global resource allocation problem: just declare what you use
   - No need to tweak annotations when compiling for a new platform
 - Arbitrary module composition
   - More flexible even than the post-compilation reflection option: can include multiple instances of a given feature/component
 - Offsets of parameters within a struct do not change across programs and variants.
   - Can allocate and re-use buffers, descriptor sets, etc. within (and potentially across) frames

**Cons**

 - Pay for unused parameters
   - Requires different approach to architecture of shader code
     - Old-fashioned: functions in a subsystem can implicitly access the parameters it needs, because they are all globals
     - New: functions in a subsystem need their parameters explicitly passed in
   - Can keep subsystem code clean by using methods on the Slang struct to implement subsystem functionality, rather than global functions

## Implementation: How the Slang Reflection API Tells You What You Need

### Simple cases by examples

### Key Concepts: Layouts for Types and Variables

#### TypeLayout (`TypeLayoutReflection`)

- Provides **size and alignment information** for a type.
- Contains information about **sub-parts**:
  - Fields of a struct.
  - Element type of an array.
  - Other nested types.

#### VariableLayout (`VariableLayoutReflection`)

- Provides **offset information** for a variable within its containing scope.
- Each field in a struct's type layout is associated with a variable layout.

#### Layout is Multi-Dimensional

### Slang API Approach to Reflecting All of This

#### Accessing Type and Variable Layouts

Example:

```cpp
// Obtain TypeLayoutReflection for SceneParams
TypeReflection* sceneParamsType = slangReflection->findTypeByName("SceneParams");
TypeLayoutReflection* sceneParamsLayout = slangReflection->getTypeLayout(sceneParamsType);

// Iterate over fields
for (unsigned int i = 0; i < sceneParamsLayout->getFieldCount(); ++i)
{
    VariableLayoutReflection* fieldLayout = sceneParamsLayout->getFieldByIndex(i);
    const char* fieldName = fieldLayout->getName();
    // Obtain offset and size per resource kind
    for (int kind = 0; kind < SLANG_PARAMETER_CATEGORY_COUNT; ++kind)
    {
        size_t offset = fieldLayout->getOffset((slang::ParameterCategory)kind);
        size_t size = fieldLayout->getSize((slang::ParameterCategory)kind);
        // Use offset and size for binding
    }
}
```

#### Handling Nested Structs and Arrays

- **Nested Structs:** Recursively access and process fields.
- **Arrays:** Use element strides and counts to compute offsets for elements.

#### Binding Parameters Using Offsets

- Use the offsets provided by the reflection API to **bind parameters** accurately.
- This ensures **correct data alignment and binding**, regardless of the platform.

## Shader Cursors: Writing the Application/Engine Code to Actually Bind Things

### Why Shader Cursors?

Shader cursors provide a **convenient abstraction** for navigating and setting shader parameters based on the layouts provided by the reflection API.

- Simplify managing **offsets and resource bindings**.
- **Abstract away platform-specific details**, allowing for cross-platform code.
- Facilitate **recursive parameter setting**, particularly with nested structs and arrays.

### What Is a Shader Cursor?

- Conceptually a **pointer or reference** into a descriptor set, buffer, or parameter block.
- **Knows the type layout** of the data it points to.
- Provides methods to:
  - **Compute cursors** to fields by index or name.
  - **Compute cursors** to array elements.
  - **Set values and resources** at the current cursor position.

### Implementing a Simple Shader Cursor (Vulkan Example)

#### Data Stored in a Shader Cursor

- **Type Layout (`TypeLayoutReflection`):** The type of data being pointed to.
- **Descriptor Set:** The Vulkan descriptor set being manipulated.
- **Buffer:** The buffer being written to for constant data.
- **Offsets:**
  - **Byte Offset:** Within the buffer.
  - **Binding Offset:** Within the descriptor set.
  - **Array Index:** Within a binding.

#### Key Operations

##### Get Cursor to Structure Field

```cpp
ShaderCursor ShaderCursor::getField(const char* fieldName)
{
    auto fieldLayout = typeLayout->findFieldByName(fieldName);
    ShaderCursor fieldCursor;
    fieldCursor.typeLayout = fieldLayout->getTypeLayout();
    fieldCursor.descriptorSet = this->descriptorSet;
    fieldCursor.bindingOffset = this->bindingOffset + fieldLayout->getOffset(slang::ParameterCategory::DescriptorTableSlot);
    fieldCursor.byteOffset = this->byteOffset + fieldLayout->getOffset(slang::ParameterCategory::ConstantBuffer);
    return fieldCursor;
}
```

##### Get Cursor to Array Element

```cpp
ShaderCursor ShaderCursor::getElement(size_t index)
{
    auto elementTypeLayout = typeLayout->getElementTypeLayout();
    ShaderCursor elementCursor;
    elementCursor.typeLayout = elementTypeLayout;
    elementCursor.descriptorSet = this->descriptorSet;
    size_t stride = typeLayout->getElementStride(slang::ParameterCategory::DescriptorTableSlot);
    elementCursor.bindingOffset = this->bindingOffset + index * stride;
    stride = typeLayout->getElementStride(slang::ParameterCategory::ConstantBuffer);
    elementCursor.byteOffset = this->byteOffset + index * stride;
    return elementCursor;
}
```

##### Setting Values

```cpp
void ShaderCursor::setData(const void* data, size_t size)
{
    // Copy data into buffer at byteOffset
    memcpy(buffer + byteOffset, data, size);
}

void ShaderCursor::setResource(Texture* texture)
{
    // Bind texture to descriptor set at bindingOffset
    vkUpdateDescriptorSet(descriptorSet, bindingOffset, texture);
}

void ShaderCursor::setSampler(Sampler* sampler)
{
    // Bind sampler to descriptor set at bindingOffset
    vkUpdateDescriptorSet(descriptorSet, bindingOffset, sampler);
}
```

#### Handling Buffers/Blocks

- Allocate buffer memory based on **size information** from the reflection API.
- Use **byte offsets** to write data into the correct location in the buffer.
- For parameter blocks, manage **binding spaces** and **registers** as per the platform's requirements.

## Appendices

### Appendix A: Why the Math for Arrays Works the Way It Does

- **Element Stride:** The distance (in bytes or bindings) between elements in an array.
- When computing offsets for array elements, **element stride is multiplied by the index** to reach the correct position.
- This accounts for any padding or alignment requirements imposed by the platform.

### Appendix B: Layout for Constant Buffers and Parameter Blocks

- **Constant Buffers:** Store constant data (e.g., scalar and vector types). Use byte offsets for parameter binding.
- **Parameter Blocks (`ParameterBlock<T>`):** Encapsulate a set of parameters, potentially including resources, into a single binding point.
- The reflection API provides **size and alignment** details to correctly allocate and populate these buffers.

### Appendix C: Binding Ranges

- **Binding Ranges:** Represent a contiguous range of resource bindings, such as a texture array.
- The reflection API provides information about **binding ranges**, allowing the application to bind resources efficiently.
- **Cross-Platform Consistency:** By using binding ranges, the same application code can manage resources uniformly across different graphics APIs.

## Conclusion

By **thinking in terms of types** and leveraging Slang's reflection API, developers can implement a practical and scalable approach to shader parameter passing that is **cross-platform** and **efficient**. This method abstracts platform-specific details, reduces maintenance overhead, and allows for **arbitrary module composition** without the complexities of traditional approaches.

While it requires a shift in how shader code and application code are architected, the benefits of consistency, reusability, and scalability make it a compelling strategy for modern graphics applications.