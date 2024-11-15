# Using the Slang Reflection API

The reflection APIs for the shader compilers are used mostly for parameter bindings. But different graphics APIs do the resource binding differently. This causes trouble when the application wants to support multiple graphics APIs.

Slang's reflection API is designed to provide the parameter binding locations for all different graphics APIs through a consistent interface. To abstract over the differences of all target APIs, Slang introduces several concepts.

We will go over how the resource binding is done for a few graphics APIs in order to understand the problem more. And you will learn how Slang solves the problem with the reflection APIs.

## How parameter binding works for different graphics APIs

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

[numthreads(16, 16, 1)]
void computeMain(uint3 DTid : SV_DispatchThreadID)
{
    if (DTid.x < textureWidth && DTid.y < textureHeight)
    {
        float2 texCoord = float2(DTid.x / (float)textureWidth, DTid.y / (float)textureHeight);
        float4 color = myTexture.Sample(mySampler, texCoord);
        float4 transformedColor = mul(transformationMatrix, color);
        outputTexture[DTid.xy] = transformedColor;
    }
}
```

The example above shows four shader parameters.

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

layout(local_size_x = 16, local_size_y = 16, local_size_z = 1) in;
void main()
{
    uvec3 DTid = gl_GlobalInvocationID;
    if (DTid.x < textureWidth && DTid.y < textureHeight)
    {
        vec2 texCoord = vec2(DTid.x, DTid.y) / vec2(textureWidth, textureHeight);
        vec4 color = texture(sampler2D(myTexture, mySampler), texCoord);
        vec4 transformedColor = transformationMatrix * color;
        imageStore(outputTexture, ivec2(DTid.xy), transformedColor);
    }
}
```

- `myTexture` is bound to binding index `0`.
- `mySampler` is bound to binding index `1`.
- `outputTexture` is bound to binding index `2`.
- `ConstantBuffer` is bound to binding index `3`.

### Vulkan

The shader parameters in Vulkan support all the binding syntax of OpenGL, but support additional concepts like D3D12 does.

1. GLSL with Vulkan backend can specify a descriptor set index with a `set` keyword, which is similar to `space` in D3D12.
2. GLSL with Vulkan backend can declare arrays of descriptors by using `[]` syntax, which is similar to "array of descriptors" in D3D12.

Consider the following example,

```glsl
// Vulkan GLSL Compute Shader Example with descriptor set

layout(binding = 0) uniform texture2D myTexture1; // Bound to binding index 0 and descriptor set 0.
layout(binding = 0, set = 1) uniform texture2D myTexture2; // Bound to binding index 0 and descriptor set 1
layout(binding = 0, set = 2) uniform texture2D myTexture3[10]; // Bound from binding index 0 to 9 descriptors in descriptor set 2.
```

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
#include <metal_stdlib>
using namespace metal;

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
    if (DTid.x < args->textureWidth && DTid.y < args->textureHeight)
    {
        float2 texCoord = float2(DTid.x / float(args->textureWidth), DTid.y / float(args->textureHeight));
        float4 color = myTexture.sample(mySampler, texCoord);
        float4 transformedColor = float4(0.0, 0.0, 0.0, 0.0);
        for (int i = 0; i < 4; ++i)
        {
            transformedColor += args->transformationMatrix[i] * color[i];
        }
        outputTexture.write(transformedColor, uint2(DTid.xy));
    }
}
```

### Size and offset differences
Different graphics APIs use different structures to store the shader parameters.
 - Direct3D 11 (D3D11): Uses HLSL packing rules, where variables are packed into 16-byte boundaries (4-component vectors). Scalars and smaller vectors can share space within these boundaries if they fit.
 - Direct3D 12 (D3D12): Packs variables more tightly based on their natural alignment, without the 16-byte boundary restrictions. This results in more compact offsets.
 - OpenGL: Follows the std140 layout, which imposes stricter alignment rules. Vectors like float3 are aligned to 16 bytes, and padding is added as necessary.
 - Vulkan: Uses std140 or std430 layouts. In the std140 layout (commonly used for uniform buffers), the alignment rules are similar to OpenGL's std140.
 - Metal: Aligns data according to its natural alignment but with considerations for efficient GPU access. It often results in offsets similar to those in OpenGL and Vulkan.

Consider the following example,
```
cbuffer MyConstants : register(b0)
{
    float      myFloat;
    float2     myFloat2;
    float3     myFloat3;
    float4     myFloat4;
    int        myInt;
    bool       myBool;
    float4x4   myMatrix;
};
```
Offsets for each variable is,
| Variable | D3D11 | D3D12 | OpenGL (std140) | Vulkan (std140) | Vulkan (std430) | Metal |
|--------------|-----------|-----------|---------------------|---------------------|---------------------|-----------|
| myFloat | 0 | 0 | 0 | 0 | 0 | 0 |
| myFloat2 | 4 | 4 | 8 | 8 | 8 | 8 |
| myFloat3 | 16 | 12 | 16 | 16 | 16 | 16 |
| myFloat4 | 32 | 28 | 32 | 32 | 32 | 32 |
| myInt | 48 | 44 | 48 | 48 | 48 | 48 |
| myBool | 52 | 48 | 52 | 52 | 52 | 52 |
| myMatrix | 64 | 64 | 64 | 64 | 64 | 64 |


## How Slang binds the resources

TODO: The content below describes a rough idea of what needs to be written.

- Fundamental Idea: A type can have multi-dimensional size. Examples

    ```
    Struct { Texture2D t1; StructuredBuffer<int> b2; Sampler2D s3; int4 data; }
    ```
    
    What's the size of this type on different target APIs? The size is not a single number, but a vector whose dimensions are determined by the target API.

- `TypeLayout`: Stores the multi-dimensional size of a type
- `VarLayout`: Stores the offset of a variable or a struct field.

(Use a figure to explain type layout and var layout, left-hand side of the figure: a struct definition, use arrows to point to the type layout and var layout of the struct and each field).

Show the same figure but this time for a different API (e.g. D3D11 vs Vulkan).

## `ParameterBlock` provides consistent binding locations in a separate space

TODO: The content below describes a rough idea of what needs to be written.

The main difference is whether or not the enclosing resources bleed into the outer environment. `ConstantBuffer`: No indirection, everything bleeds out. `ParameterBlock`: Uses a separate space to hold all child elements; only the “space” binding will bleed out.

Best practices are to use parameter blocks to reuse parameter binding logic by creating descriptor sets/descriptor tables once and reusing them in different frames. `ParameterBlocks` allow developers to group parameters in a stable set, where the relative binding locations within the block are not affected by where the parameter block is defined. This enables developers to create descriptor sets and populate them once, and reuse them over and over. For example, the scene often doesn't change between frames, so we should be able to create a descriptor table for all the scene resources without having to rebind every single parameter in every frame.

## How to figure out which binding slots are unused

TODO: The content below describes a rough idea of what needs to be written.

Querying if a parameter location is actually used by the shader after DCE.

Done through the `IMetadata` interface:

1. `IComponentType::getEntryPointMetadata()` or `IComponentType::getTargetMetadata()` returns `IMetadata*`
2. `IMetadata::isParameterLocationUsed(int set, int binding)` tells you whether or not the parameter binding at the specific location is being used.
3. Combine this with the reflection API, you can know if a parameter is used or not.