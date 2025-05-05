---
title: Migrating to Slang from GLSL
layout: page
description: Migrating to Slang from GLSL
permalink: "/docs/coming-from-glsl/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

## Overview
This guide provides a reference for migrating GLSL shaders to Slang.

## Type and Syntax Reference

When converting GLSL shaders to Slang, you'll need to translate GLSL types and syntax to their Slang equivalents.

### Scalar Types

| GLSL Type | Slang Type | Description |
|-----------|------------|-------------|
| `float`   | `float`    | 32-bit floating point |
| `float16_t` | `half`   | 16-bit floating point |
| `int`     | `int`      | 32-bit signed integer |
| `uint`    | `uint`     | 32-bit unsigned integer |
| `bool`    | `bool`     | Boolean value |
| `double`  | `double`   | 64-bit floating point |
| `int8_t`  | `int8_t`   | 8-bit signed integer |
| `uint8_t` | `uint8_t`  | 8-bit unsigned integer |
| `int16_t` | `int16_t`  | 16-bit signed integer |
| `uint16_t`| `uint16_t` | 16-bit unsigned integer |
| `int64_t` | `int64_t`  | 64-bit signed integer |
| `uint64_t`| `uint64_t` | 64-bit unsigned integer |

### Vector Types

| GLSL Type | Slang Type | Description |
|-----------|------------|-------------|
| `vec2`    | `float2`   | 2-component float vector |
| `vec3`    | `float3`   | 3-component float vector |
| `vec4`    | `float4`   | 4-component float vector |
| `f16vec2` | `half2`    | 2-component half-precision float vector |
| `f16vec3` | `half3`    | 3-component half-precision float vector |
| `f16vec4` | `half4`    | 4-component half-precision float vector |
| `ivec2`   | `int2`     | 2-component int vector |
| `ivec3`   | `int3`     | 3-component int vector |
| `ivec4`   | `int4`     | 4-component int vector |
| `uvec2`   | `uint2`    | 2-component uint vector |
| `uvec3`   | `uint3`    | 3-component uint vector |
| `uvec4`   | `uint4`    | 4-component uint vector |
| `bvec2`   | `bool2`    | 2-component boolean vector |
| `bvec3`   | `bool3`    | 3-component boolean vector |
| `bvec4`   | `bool4`    | 4-component boolean vector |
| `dvec2`   | `double2`  | 2-component double vector |
| `dvec3`   | `double3`  | 3-component double vector |
| `dvec4`   | `double4`  | 4-component double vector |

### Matrix Types

| GLSL Type | Slang Type | Description |
|-----------|------------|-------------|
| `mat2`    | `float2x2` | 2×2 float matrix |
| `mat3`    | `float3x3` | 3×3 float matrix |
| `mat4`    | `float4x4` | 4×4 float matrix |
| `mat2x3`  | `float2x3` | 2×3 float matrix |
| `mat2x4`  | `float2x4` | 2×4 float matrix |
| `mat3x2`  | `float3x2` | 3×2 float matrix |
| `mat3x4`  | `float3x4` | 3×4 float matrix |
| `mat4x2`  | `float4x2` | 4×2 float matrix |
| `mat4x3`  | `float4x3` | 4×3 float matrix |
| `f16mat2` | `half2x2`  | 2×2 half-precision float matrix |
| `f16mat3` | `half3x3`  | 3×3 half-precision float matrix |
| `f16mat4` | `half4x4`  | 4×4 half-precision float matrix |
| `f16mat2x3` | `half2x3` | 2×3 half-precision float matrix |
| `f16mat2x4` | `half2x4` | 2×4 half-precision float matrix |
| `f16mat3x2` | `half3x2` | 3×2 half-precision float matrix |
| `f16mat3x4` | `half3x4` | 3×4 half-precision float matrix |
| `f16mat4x2` | `half4x2` | 4×2 half-precision float matrix |
| `f16mat4x3` | `half4x3` | 4×3 half-precision float matrix |

### Vector/Matrix Construction

GLSL:

```glsl
vec4 color = vec4(1.0, 0.5, 0.2, 1.0);
mat4 transform = mat4(
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
);
```

Slang:

```hlsl
float4 color = float4(1.0, 0.5, 0.2, 1.0);
float4x4 transform = float4x4(
    float4(1.0, 0.0, 0.0, 0.0),
    float4(0.0, 1.0, 0.0, 0.0),
    float4(0.0, 0.0, 1.0, 0.0),
    float4(0.0, 0.0, 0.0, 1.0)
);
```

### Matrix Operations

GLSL:

```glsl
mat4 a, b, c;
vec4 v;

// Matrix multiplication
c = a * b;

// Vector transformation (vector is treated as a row vector)
vec4 transformed = v * a;  // row vector * matrix
```

Slang:

```hlsl
float4x4 a, b, c;
float4 v;

// Matrix multiplication
c = mul(a, b);

// Vector transformation (vector is treated as a column vector)
float4 transformed = mul(a, v);  // matrix * column vector
```

Note: Slang uses the `mul()` function for matrix multiplication rather than the `*` operator. Also, vectors are treated as column vectors in Slang, while they're treated as row vectors in GLSL, so the order of arguments is inverted.

### Shader Inputs and Outputs

GLSL and Slang handle shader inputs and outputs differently. Here's a fragment/pixel shader example:

**GLSL:**
```glsl
// Fragment shader input
in vec2 texCoord;

// Fragment shader output
layout(location = 0) out vec4 fragColor;

void main() {
    // Use texCoord to sample a texture
    fragColor = vec4(texCoord, 0.0, 1.0);
}
```

**Slang (Method 1 - Using structures):**
```hlsl
// Input structure
struct PSInput {
    float2 texCoord : TEXCOORD0;
};

// Output structure
struct PSOutput {
    float4 color : SV_Target0;
};

// Pixel shader using structures
[shader("pixel")]
PSOutput main(PSInput input) {
    PSOutput output;
    
    // Use input.texCoord to sample a texture
    output.color = float4(input.texCoord, 0.0, 1.0);
    
    return output;
}
```

**Slang (Method 2 - Direct parameters):**
```hlsl
// Pixel shader using direct parameters
[shader("pixel")]
float4 main(float2 texCoord : TEXCOORD0) : SV_Target0 {
    // Use texCoord to sample a texture
    return float4(texCoord, 0.0, 1.0);
}
```

Both Slang methods produce the same result, but Method 1 is more organized for complex shaders with many inputs and outputs, while Method 2 is more concise for simple shaders.

### Built-in Variables

GLSL provides built-in variables that can be accessed directly in shaders, while Slang requires these variables to be explicitly declared as inputs or outputs in shader entry point functions. Unlike regular shader inputs and outputs which you define yourself, built-in variables provide access to system values like vertex IDs, screen positions, etc.

#### Example: Minimal Vertex Shader with Built-in Variables

Here's a simplified example showing how built-in variables work in both GLSL and Slang:

**GLSL:**
```glsl
#version 460

// No need to declare gl_VertexID - it's implicitly available

void main() {
    // Access input built-in variable directly
    int vertID = gl_VertexID;
    
    // Set position based on vertex ID
    float x = (vertID == 0) ? -0.5 : ((vertID == 1) ? 0.5 : 0.0);
    float y = (vertID == 2) ? 0.5 : -0.5;
    
    // Set output built-in variable directly
    gl_Position = vec4(x, y, 0.0, 1.0);
}
```

**Slang:**
```hlsl
// Slang: Built-in variables must be explicitly declared in the function signature
[shader("vertex")]
float4 main(uint vertexID : SV_VertexID) : SV_Position {
    // Input built-in is passed as a function parameter
    
    // Calculate position based on vertex ID
    float x = (vertexID == 0) ? -0.5 : ((vertexID == 1) ? 0.5 : 0.0);
    float y = (vertexID == 2) ? 0.5 : -0.5;
    
    // Output built-in is returned from the function
    return float4(x, y, 0.0, 1.0);
}
```

Notice the key differences:
1. In GLSL, `gl_VertexID` (input) and `gl_Position` (output) are accessed directly as global variables
2. In Slang, the input `SV_VertexID` is a function parameter, and the output `SV_Position` is the function return value

For more complex shaders, you can use structures for inputs and outputs as shown in the previous section.

#### Built-in Variables Reference

The following table maps GLSL built-in variables to their corresponding Slang system value semantics across standard shader stages. In GLSL, these variables are accessed directly as globals, while in Slang they must be declared explicitly in function signatures with appropriate semantic annotations.

| GLSL Built-in | Slang System Value |
|---------------|-------------------|
| `gl_BaseInstance` | `SV_StartInstanceLocation` |
| `gl_BaseVertex` | `SV_StartVertexLocation` |
| `gl_BaryCoordEXT` | `SV_Barycentrics` |
| `gl_ClipDistance` | `SV_ClipDistance` |
| `gl_CullDistance` | `SV_CullDistance` |
| `gl_CullPrimitiveEXT` | `SV_CullPrimitive` |
| `gl_DrawID` | `SV_DrawIndex` |
| `gl_FragCoord` | `SV_Position` |
| `gl_FragDepth` | `SV_Depth` |
| `gl_FragStencilRefEXT` | `SV_StencilRef` |
| `gl_FrontFacing` | `SV_IsFrontFace` |
| `gl_FullyCoveredEXT` | `SV_InnerCoverage` |
| `gl_GlobalInvocationID` | `SV_DispatchThreadID` |
| `gl_InstanceID` | `SV_InstanceID` |
| `gl_InvocationID` | `SV_GSInstanceID/SV_OutputControlPointID` |
| `gl_Layer` | `SV_RenderTargetArrayIndex` |
| `gl_LocalInvocationID` | `SV_GroupThreadID` |
| `gl_LocalInvocationIndex` | `SV_GroupIndex` |
| `gl_PointSize` | `SV_PointSize` |
| `gl_Position` | `SV_Position` |
| `gl_PrimitiveID` | `SV_PrimitiveID` |
| `gl_PrimitiveShadingRateEXT` | `SV_ShadingRate` |
| `gl_SampleID` | `SV_SampleIndex` |
| `gl_SampleMask` | `SV_Coverage` |
| `gl_ShadingRateEXT` | `SV_ShadingRate` |
| `gl_SubgroupInvocationID` | `SV_WaveLaneIndex` |
| `gl_SubgroupSize` | `SV_WaveLaneCount` |
| `gl_TessCoord` | `SV_DomainLocation` |
| `gl_TessLevelInner` | `SV_InsideTessFactor` |
| `gl_TessLevelOuter` | `SV_TessFactor` |
| `gl_VertexIndex` | `SV_VertexID` |
| `gl_ViewIndex` | `SV_ViewID` |
| `gl_ViewportIndex` | `SV_ViewportArrayIndex` |
| `gl_WorkGroupID` | `SV_GroupID` |

#### Ray Tracing Built-ins

Ray tracing built-ins in Slang are accessed through function calls rather than system value semantics. The following table maps GLSL ray tracing built-ins to their corresponding Slang functions:

| GLSL Built-in | Slang Function |
|---------------|----------------|
| `gl_HitKindEXT` | `HitKind()` |
| `gl_HitTEXT` | `RayTCurrent()` |
| `gl_InstanceCustomIndexEXT` | `InstanceIndex()` |
| `gl_InstanceID` | `InstanceID()` |
| `gl_LaunchIDEXT` | `DispatchRaysIndex()` |
| `gl_LaunchSizeEXT` | `DispatchRaysDimensions()` |
| `gl_ObjectRayDirectionEXT` | `ObjectRayDirection()` |
| `gl_ObjectRayOriginEXT` | `ObjectRayOrigin()` |
| `gl_RayTmaxEXT` | `RayTCurrent()` |
| `gl_RayTminEXT` | `RayTMin()` |
| `gl_WorldRayDirectionEXT` | `WorldRayDirection()` |
| `gl_WorldRayOriginEXT` | `WorldRayOrigin()` |

### Built-in Functions and Operators

When porting GLSL shaders to Slang, most common mathematical functions (sin, cos, tan, pow, sqrt, abs, etc.) share identical names in both languages. However, there are several important differences to be aware of, listed below:

#### Key Function Differences

| GLSL | Slang | Description |
|------|-------|-------------|
| `mix(x, y, a)` | `lerp(x, y, a)` | Linear interpolation |
| `fract(x)` | `frac(x)` | Fractional part of x |
| `inversesqrt(x)` | `rsqrt(x)` | Inverse square root (1/sqrt) |
| `atan(y, x)` | `atan2(y, x)` | Arc tangent of y/x |
| `dFdx(p)` | `ddx(p)` | Derivative with respect to screen-space x |
| `dFdy(p)` | `ddy(p)` | Derivative with respect to screen-space y |
| `m1 * m2` (matrix multiply) | `mul(m1, m2)` | Matrix multiplication |
| `v * m` (row vector) | `mul(m, v)` (column vector) | Vector-matrix multiplication |

## Resource Handling

This section covers how to convert GLSL resource declarations to Slang, including different buffer types, textures, and specialized resources.

### Resource Binding Models

Slang supports three different binding syntax options to accommodate both HLSL-style and GLSL-style resource declarations:

#### GLSL Binding Model

```glsl
// GLSL uses binding and set numbers
layout(binding = 0, set = 0) uniform UniformBufferA { ... };
```

#### Slang Binding Models

##### Option 1: HLSL Register Syntax

```hlsl
// Using register semantics with space (equivalent to set)
ConstantBuffer<UniformBufferA> bufferA : register(b0, space0);
```

##### Option 2: GLSL-style Layout Syntax

```hlsl
// Using GLSL-style binding with [[vk::binding(binding, set)]]
[[vk::binding(0, 0)]]
ConstantBuffer<UniformBufferA> bufferA;
```

##### Option 3: Direct GLSL Layout Syntax

```hlsl
// Using layout syntax identical to GLSL
layout(binding = 0, set = 0) ConstantBuffer<UniformBufferA> bufferA;
```

All binding syntax options work the same way for all resource types (ConstantBuffer, Texture2D, RWStructuredBuffer, etc.). The GLSL-style options (2 and 3) can be particularly helpful when porting GLSL shaders without changing the binding model.

### Buffer Types

| Resource Type | GLSL | Slang | Description |
|---------------|------|-------|-------------|
| Uniform Buffer | `uniform Buffer {...}` | `ConstantBuffer<T>` | Read-only constant data |
| Storage Buffer | `buffer Buffer {...}` | `RWStructuredBuffer<T>` | Read-write structured data |
| Read-only Storage Buffer | `readonly buffer Buffer {...}` | `StructuredBuffer<T>` | Read-only structured data |

**Example in GLSL:**
```glsl
#version 460

layout(std140, binding = 0) uniform Params {
    float scale;
};

struct Data {
    vec3 value;
};

layout(std430, binding = 1) buffer Storage {
    Data data;
};

layout(local_size_x = 1, local_size_y = 1, local_size_z = 1) in;
void main() {
    float s = scale;
    data.value *= s;
}
```

**Example in Slang:**
```hlsl
struct Params {
    float scale;
};

layout(binding = 0) ConstantBuffer<Params> params;

struct Data {
    float3 value;
};

layout(binding = 1) RWStructuredBuffer<Data> data;

[shader("compute")]
[numthreads(1, 1, 1)]
void main() {
    float s = params.scale;
    data[0].value *= s;
}
```

Key differences to note:
1. Slang uses the `RW` prefix to distinguish read-write resources from read-only ones
2. In Slang, structured buffers must be indexed even for a single element (e.g., `data[0].value`)
3. In Slang, all buffer members are accessed through the buffer variable name (e.g., `params.scale`, `data[0].value`)

### Texture Resources

This section covers the declaration and usage of texture resources in Slang compared to GLSL.

#### Combined Texture Samplers

GLSL:
```glsl
// Texture declaration
layout(binding = 0) uniform sampler2D inputTexture;
layout(location = 0) out vec4 fragColor;

void main() {
    // Simple texture sampling and copy to output
    vec2 uv = gl_FragCoord.xy / vec2(1280.0, 720.0);
    fragColor = texture(inputTexture, uv);
}
```

Slang:
```hlsl
// Texture declaration
layout(binding = 0) Sampler2D inputTexture;

[shader("pixel")]
float4 main(float4 position : SV_Position) : SV_Target0 {
    // Simple texture sampling and return
    float2 uv = position.xy / float2(1280.0, 720.0);
    return inputTexture.Sample(uv);
}
```

**Texture Type Mapping:**

| GLSL Type | Slang Type | Description |
|-----------|------------|-------------|
| `sampler1D` | `Sampler1D` | 1D texture with built-in sampler |
| `sampler2D` | `Sampler2D` | 2D texture with built-in sampler |
| `sampler3D` | `Sampler3D` | 3D texture with built-in sampler |
| `samplerCube` | `SamplerCube` | Cube texture with built-in sampler |
| `sampler2DArray` | `Sampler2DArray` | 2D texture array with built-in sampler |
| `samplerCubeArray` | `SamplerCubeArray` | Cube texture array with built-in sampler |
| `sampler2DShadow` | `Sampler2DShadow` | Shadow sampler for depth comparisons |
| `isampler2D` | `Sampler2D<int4>` | Integer 2D texture with built-in sampler |
| `usampler2D` | `Sampler2D<uint4>` | Unsigned integer 2D texture with built-in sampler |

**Texture Function Mapping (Combined Sampler Approach):**

| GLSL Function | Slang Function | Description |
|---------------|----------------|-------------|
| `texture(sampler, coord)` | `sampler.Sample(coord)` | Basic texture sampling |
| `textureLod(sampler, coord, lod)` | `sampler.SampleLevel(coord, lod)` | Sample with specific mip level |
| `textureGrad(sampler, coord, ddx, ddy)` | `sampler.SampleGrad(coord, ddx, ddy)` | Sample with explicit derivatives |
| `textureOffset(sampler, coord, offset)` | `sampler.SampleOffset(coord, offset)` | Sample with offset |
| `texelFetch(sampler, coord, lod)` | `sampler.Load(int3(coord, lod))` | Direct texel fetch |
| `textureSize(sampler, lod)` | `sampler.GetDimensions(lod, width, height)` | Get texture dimensions |
| `textureGather(sampler, coord)` | `sampler.Gather(coord)` | Gather four texels |
| `textureGatherOffset(sampler, coord, offset)` | `sampler.GatherOffset(coord, offset)` | Gather with offset |

#### Separate Texture Samplers

GLSL:
```glsl
// Declare texture and sampler separately
uniform texture2D colorTexture;
uniform sampler texSampler;

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(1280.0, 720.0);
    // Combine texture and sampler for sampling
    vec4 color = texture(sampler2D(colorTexture, texSampler), uv);
    fragColor = color;
}
```

Slang:
```hlsl
// Declare texture and sampler state separately
Texture2D colorTexture;
SamplerState texSampler;

[shader("pixel")]
float4 main(float4 position : SV_Position) : SV_Target {
    float2 uv = position.xy / float2(1280.0, 720.0);
    // Pass sampler state explicitly to the Sample method
    return colorTexture.Sample(texSampler, uv);
}
```

### Image Resources

This section covers the declaration and usage of image resources in Slang compared to GLSL, including how to perform image load/store operations.

GLSL:
```glsl
// Image declaration
layout(binding = 4, rgba8) uniform image2D outputImage;

layout(local_size_x = 8, local_size_y = 8) in;
void main() {
    // Get the pixel coordinate for this thread
    ivec2 pixelCoord = ivec2(gl_GlobalInvocationID.xy);
    
    // Simple image store operation (set to red color)
    imageStore(outputImage, pixelCoord, vec4(1.0, 0.0, 0.0, 1.0));
}
```

Slang:
```hlsl
// Image declaration
layout(binding = 4) RWTexture2D<float4> outputImage;

[shader("compute")]
[numthreads(8, 8, 1)]
void main(uint3 dispatchThreadID : SV_DispatchThreadID) {
    // Get the pixel coordinate for this thread
    int2 pixelCoord = int2(dispatchThreadID.xy);
    
    // Simple image store operation (set to red color)
    outputImage[pixelCoord] = float4(1.0, 0.0, 0.0, 1.0);
}
```

**Image Type Mapping:**

| GLSL Type | Slang Type | Description |
|-----------|------------|-------------|
| `image1D` | `RWTexture1D<float4>` | 1D read-write image |
| `image2D` | `RWTexture2D<float4>` | 2D read-write image |
| `image3D` | `RWTexture3D<float4>` | 3D read-write image |
| `imageCube` | `RWTextureCube<float4>` | Cube read-write image |
| `image2DArray` | `RWTexture2DArray<float4>` | 2D array read-write image |
| `iimage2D` | `RWTexture2D<int4>` | Integer 2D read-write image |
| `uimage2D` | `RWTexture2D<uint4>` | Unsigned integer 2D read-write image |

**Image Function Mapping:**

| GLSL Function | Slang Function | Description |
|---------------|----------------|-------------|
| `imageLoad(image, coord)` | `image[coord]` or `image.Load(coord)` | Read from image |
| `imageStore(image, coord, value)` | `image[coord] = value` or `image.Store(coord, value)` | Write to image |
| `imageSize(image)` | `image.GetDimensions(width, height)` | Get image dimensions |

## Shader Entry Point Syntax

GLSL and Slang use fundamentally different approaches for shader entry points. While GLSL always uses a `void main()` function with implicit inputs/outputs through global variables, Slang uses explicitly typed entry points with decorators and function parameters/return values.

This section provides a general overview of the entry point pattern differences. Detailed shader stage-specific conversion information will be covered in a later section.

### Core Entry Point Pattern

**GLSL Pattern:**
```glsl
#version 460
// Global inputs (in) and outputs (out)
in type input_name;
out type output_name;

// Global uniforms and resources
uniform type resource_name;

// Always uses void main() with no parameters
void main() {
    // Access inputs and resources directly
    // Write to outputs directly
}
```

**Slang Pattern:**
```hlsl
// Shader type specified by decorator
[shader("stage_type")]

// Explicit inputs as parameters, outputs as return value
return_type main(parameter_type param : semantic) : return_semantic {
    // Access inputs through parameters
    // Return output value explicitly
}
```

### Shader Stage Decorators

| Shader Stage | Slang Decoration |
|--------------|------------------|
| **Vertex** | `[shader("vertex")]` |
| **Hull/Tessellation Control** | `[shader("hull")]` |
| **Domain/Tessellation Evaluation** | `[shader("domain")]` |
| **Geometry** | `[shader("geometry")]` |
| **Pixel/Fragment** | `[shader("pixel")]` |
| **Compute** | `[shader("compute")]` |
| **Amplification/Task** | `[shader("amplification")]` |
| **Mesh** | `[shader("mesh")]` |
| **Ray Generation** | `[shader("raygeneration")]` |
| **Closest Hit** | `[shader("closesthit")]` |
| **Miss** | `[shader("miss")]` |
| **Any Hit** | `[shader("anyhit")]` |
| **Intersection** | `[shader("intersection")]` |
| **Callable** | `[shader("callable")]` |

Note: For detailed conversions of specific shader stages including tessellation, geometry, mesh, and ray tracing shaders, see the "Shader Stage-Specific Conversions" section later in this guide.

## Shader Stage-Specific Conversions

This section provides mappings for each shader stage from GLSL to Slang, focusing on essential declarations, attributes, and stage-specific functionality.

### Vertex Shaders

#### Core Declaration Mapping

**GLSL:**
```glsl
// No special attributes required
void main() {
    gl_Position = /* output position calculation */;
}
```

**Slang:**
```hlsl
[shader("vertex")]
float4 main(float3 position : POSITION) : SV_Position {
    return /* output position calculation */;
}
```

#### Key Conversion Points

- **Declaration**: Add `[shader("vertex")]` decoration

### Fragment/Pixel Shaders

#### Core Declaration Mapping

**GLSL:**
```glsl
// Early depth testing (optional)
layout(early_fragment_tests) in;

// Output color target(s)
layout(location = 0) out vec4 fragColor;

void main() {
    fragColor = /* color calculation */;
}
```

**Slang:**
```hlsl
// Early depth testing (optional)
[earlydepthstencil]
[shader("pixel")]
float4 main(float4 position : SV_Position) : SV_Target0 {
    return /* color calculation */;
}
```

#### Key Conversion Points

- **Declaration**: Add `[shader("pixel")]` decoration
- **Early Z testing**: Use `[earlydepthstencil]` attribute
- **Multiple outputs**: Use a struct with multiple fields with `SV_Target0/1/2` semantics

### Compute Shaders

#### Core Declaration Mapping

**GLSL:**
```glsl
layout(local_size_x = 8, local_size_y = 8, local_size_z = 1) in;
void main() {
    // Access thread ID via gl_GlobalInvocationID
}
```

**Slang:**
```hlsl
[shader("compute")]
[numthreads(8, 8, 1)]
void main(uint3 dispatchThreadID : SV_DispatchThreadID) {
    // Access thread ID via dispatchThreadID parameter
}
```

#### Key Conversion Points

- **Thread group size**: Replace `layout(local_size_x=X...) in` with `[numthreads(X,Y,Z)]`
- **Shared memory**: Replace `shared` with `groupshared`
- **Barriers**: Replace `barrier()` with `GroupMemoryBarrierWithGroupSync()`

### Hull Shader (Tessellation Control)

#### Core Declaration Mapping

**GLSL:**
```glsl
// Patch size specification
layout(vertices = 3) out;

void main() {
    // Set tessellation levels and compute control points
    gl_TessLevelOuter[0] = 1.0;
    // ...
}
```

**Slang:**
```hlsl
// Hull shader requires multiple attributes and a separate patch constant function
[shader("hull")]
[domain("tri")]
[partitioning("fractional_odd")]
[outputtopology("triangle_cw")]
[outputcontrolpoints(3)]
[patchconstantfunc("PatchConstantFunction")]
ControlPoint main(InputPatch<Vertex, 3> patch, uint cpID : SV_OutputControlPointID) {
    // Compute control points
}

// Separate function for tessellation factors
struct PatchTessFactors {
    float4 tessFactor : SV_TessFactor;
    float2 insideTessFactor : SV_InsideTessFactor;
};

PatchTessFactors PatchConstantFunction(InputPatch<Vertex, 3> patch) {
    // Set tessellation levels
}
```

#### Key Attribute Mappings

| GLSL | Slang | Description |
|------|-------|-------------|
| `layout(vertices = N) out` | `[outputcontrolpoints(N)]` | Number of control points |
| *Implicit* | `[domain("tri/quad/isoline")]` | Patch domain type |
| *Implicit* | `[partitioning("integer/fractional_even/fractional_odd")]` | Tessellation pattern |
| *Implicit* | `[outputtopology("triangle_cw/triangle_ccw/line")]` | Output topology |
| *N/A* | `[patchconstantfunc("FunctionName")]` | Function for tessellation factors |

#### Key Conversion Points

- **Split structure**: Separate the per-control-point calculations from patch-constant calculations
- **Explicit domain/partitioning**: Add required attributes that are implicit in GLSL
- **Patch constants**: Create separate function decorated with `[patchconstantfunc]`
- **Input/Output patches**: Use `InputPatch<T, N>` and return individual control points

### Domain Shader (Tessellation Evaluation)

#### Core Declaration Mapping

**GLSL:**
```glsl
// Domain and tessellation mode
layout(triangles, equal_spacing, ccw) in;

void main() {
    // Use gl_TessCoord to interpolate 
    gl_Position = /* position calculation using gl_TessCoord */;
}
```

**Slang:**
```hlsl
[shader("domain")]
[domain("tri")]
float4 main(
    PatchTessFactors patchConstants,
    float3 tessCoord : SV_DomainLocation,
    const OutputPatch<ControlPoint, 3> patch
) : SV_Position {
    // Use tessCoord to interpolate
    return /* position calculation using tessCoord */;
}
```

#### Key Attribute Mappings

| GLSL | Slang | Description |
|------|-------|-------------|
| `layout(triangles) in` | `[domain("tri")]` | Patch domain type |
| `layout(equal_spacing) in` | *Set in hull shader* | Tessellation spacing |
| `layout(ccw) in` | *Set in hull shader* | Winding order |

#### Key Conversion Points

- **Domain specification**: Use `[domain("tri/quad/isoline")]` attribute
- **Tessellation coordinates**: Access via `SV_DomainLocation` parameter
- **Control points**: Access via `OutputPatch<T, N>` parameter
- **Patch constants**: Access via a patch constant struct parameter

### Geometry Shader

#### Core Declaration Mapping

**GLSL:**
```glsl
// Set primitive types and max vertices
layout(triangles) in;
layout(triangle_strip, max_vertices = 3) out;

void main() {
    // Process and emit vertices
    EmitVertex();
    EndPrimitive();
}
```

**Slang:**
```hlsl
[shader("geometry")]
[maxvertexcount(3)]
void main(
    triangle VSOutput input[3], 
    inout TriangleStream<GSOutput> outputStream
) {
    // Process and append vertices
    outputStream.Append(vertex);
    outputStream.RestartStrip();
}
```

#### Key Attribute Mappings

| GLSL | Slang | Description |
|------|-------|-------------|
| `layout(points/lines/triangles) in` | Input parameter prefix (`triangle`) | Input primitive type |
| `layout(points/line_strip/triangle_strip) out` | Output stream type | Output primitive type |
| `layout(max_vertices = N) out` | `[maxvertexcount(N)]` | Maximum output vertices |

#### Key Conversion Points

- **Declaration**: Add `[shader("geometry")]` and `[maxvertexcount(N)]`
- **Input primitives**: Use primitive type prefix on input array parameter
- **Output primitives**: Use appropriate stream type (`PointStream`, `LineStream`, `TriangleStream`)
- **Vertex emission**: Replace `EmitVertex()` with `outputStream.Append(v)`
- **End primitive**: Replace `EndPrimitive()` with `outputStream.RestartStrip()`

### Amplification Shader (Task Shader)

#### Core Declaration Mapping

**GLSL:**
```glsl
#extension GL_EXT_mesh_shader : require

layout(local_size_x = 32) in;

taskPayloadSharedEXT TaskData payload;

void main() {
    // Set mesh shader dispatch count
    EmitMeshTasksEXT(taskCount, 1, 1, payload);
}
```

**Slang:**
```hlsl
[shader("amplification")]
[numthreads(32, 1, 1)]
void main(
    uint gtid : SV_GroupThreadID,
    out payload TaskData payload
) {
    // Set mesh shader dispatch count
    DispatchMesh(taskCount, 1, 1, payload);
}
```

#### Key Conversion Points

- **Declaration**: Add `[shader("amplification")]` and `[numthreads(X,Y,Z)]` decorations
- **Payload**: Replace `taskPayloadSharedEXT` with output parameter
- **Dispatch**: Replace `EmitMeshTasksEXT` with `DispatchMesh`
- **Thread IDs**: Access thread IDs through function parameters with semantics

### Mesh Shader

#### Core Declaration Mapping

**GLSL:**
```glsl
#extension GL_EXT_mesh_shader : require

layout(local_size_x = 32) in;
layout(triangles, max_vertices = 64, max_primitives = 126) out;

void main() {
    // Set counts
    SetMeshOutputsEXT(vertexCount, primitiveCount);
    
    // Write vertices and primitives
    gl_MeshVerticesEXT[idx].gl_Position = /* vertex position */;
    gl_PrimitiveTriangleIndicesEXT[idx] = uvec3(a, b, c);
}
```

**Slang:**
```hlsl
[shader("mesh")]
[numthreads(32, 1, 1)]
[outputtopology("triangle")]
void main(
    uint gtid : SV_GroupThreadID,
    out vertices MeshVertex verts[64],
    out indices uint3 prims[126]
) {
    // Set counts
    SetMeshOutputCounts(vertexCount, primitiveCount);
    
    // Write vertices and primitives
    verts[idx].position = /* vertex position */;
    prims[idx] = uint3(a, b, c);
}
```

#### Key Attribute Mappings

| GLSL | Slang | Description |
|------|-------|-------------|
| `layout(local_size_x = X) in` | `[numthreads(X, Y, Z)]` | Thread group size |
| `layout(triangles) out` | `[outputtopology("triangle")]` | Output primitive type |
| `layout(max_vertices = N, max_primitives = M) out` | Output parameters | Maximum vertices/primitives |

#### Key Conversion Points

- **Declaration**: Add `[shader("mesh")]` and `[numthreads(X,Y,Z)]` decorations
- **Output topology**: Use `[outputtopology("triangle")]` attribute
- **Vertex/primitive count**: Replace `SetMeshOutputsEXT` with `SetMeshOutputCounts`
- **Vertex access**: Replace `gl_MeshVerticesEXT[idx]` with `verts[idx]`
- **Primitive access**: Replace `gl_PrimitiveTriangleIndicesEXT[idx]` with `prims[idx]`

### Ray Tracing Shaders

#### Ray Generation Shader

**GLSL:**
```glsl
#extension GL_EXT_ray_tracing : require

layout(location = 0) rayPayloadEXT PayloadData payload;

void main() {
    // Launch rays
    traceRayEXT(tlas, flags, mask, sbtOffset, stride, miss, origin, tMin, direction, tMax, 0);
}
```

**Slang:**
```hlsl
[shader("raygeneration")]
void main() {
    RayDesc ray;
    ray.Origin = origin;
    ray.Direction = direction;
    ray.TMin = tMin;
    ray.TMax = tMax;
    
    PayloadData payload;
    TraceRay(tlas, flags, mask, sbtOffset, stride, miss, ray, payload);
}
```

#### Closest Hit Shader

**GLSL:**
```glsl
#extension GL_EXT_ray_tracing : require

layout(location = 0) rayPayloadInEXT PayloadData payload;

void main() {
    // Process hit
    payload.hit = true;
}
```

**Slang:**
```hlsl
[shader("closesthit")]
void main(inout PayloadData payload, in BuiltInTriangleIntersectionAttributes attr) {
    // Process hit
    payload.hit = true;
}
```

#### Miss Shader

**GLSL:**
```glsl
#extension GL_EXT_ray_tracing : require

layout(location = 0) rayPayloadInEXT PayloadData payload;

void main() {
    // Process miss
    payload.hit = false;
}
```

**Slang:**
```hlsl
[shader("miss")]
void main(inout PayloadData payload) {
    // Process miss
    payload.hit = false;
}
```

#### Key Conversion Points

- **Declaration**: Use appropriate decorator for each shader type
- **Ray payload**: Pass as `inout` parameter instead of global variable
- **Ray tracing**: Use `TraceRay` with a `RayDesc` struct
- **Built-ins**: Access through function calls instead of global variables
- **Hit attributes**: Receive via function parameters