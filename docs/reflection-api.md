# Using the Slang Reflection API

The reflection APIs for the shader compilers are used mostly for parameter bindings. But different graphics APIs do the resource binding differently. This causes troubles when the application wants to support multiple graphics APIs.

Slang's reflection API is designed to provide the parameter binding locations for all different graphics APIs through a consistent interface. To abstract over the differences of all target APIs, slang introduces several concepts.

We will go over how the resource binding is done for a few grpahics APIs in order to understand the problem more. And you will learn how Slang solves the problem with the reflection APIs.

## How parameter binding works for different graphics APIs

### Direct3D 11
The shader parameters in D3D11 are bound in one of four ways.
1. When the resource type is texture, it is bound to a register starting with a letter `t`.
2. When the resource type is sampler, it is bound to a register starting with a letter `s`.
3. When the resource type is constant, it is bound to a register starting with a letter `b`.
4. When the resource type is Unordered Access View, it is bound to a register starting with a letter `u`.

Consider the following example,
```
// D3D11 HLSL Compute Shader Example

Texture2D myTexture : register(t0); // Texture bound to t0
SamplerState mySampler : register(s0); // Sampler bound to s0

cbuffer ConstantBuffer : register(b0) // Constant buffer bound to b0
{
    float4x4 transformationMatrix;
    uint textureWidth;
    uint textureHeight;
};

RWTexture2D<float4> outputTexture : register(u0); // UAV bound to u0

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
`myTexture` is bound to a register `t0`, because it is a `Texture2D` type.
`mySampler` is bound to a register `s0`, because it is a `SamplerState` type.
`ConstantBuffer` is bound to a register `b0`, becuase it is a `cbuffer` type.
`outputTexture` is bound to a register `u0`, because it is a `RWTexture2D` or also known as UAV type.

### Direct3D 12
The shader parameters in D3D12 introduced two new concepts for the binding.
1. register `space` can be specified.
2. "array of descriptors" can be specified.

Consider the following example,
```
// D3D12 HLSL Compute Shader Example with Register Spaces

Texture2D myTexture1 : register(t0); // Texture bound to t0 in a default space, which is space0
Texture2D myTexture2 : register(t0, space1); // Texture bound to t0 in space1 and doesn't conflict with t0 in space0
Texture2D myTexture3[10] : register(t0, space2); // bound from t0 to t9 registers in space2
```
`myTexture1` and `myTexture2` uses the same register index, `t0`, but they don't conflict because `myTexture2` uses a slot from a different space.
`myTexture3` is bound to multiple slots from `t0` to `t9` in `space2`.

### OpenGL
TODO: Need a better description with an example

- Traditional OpenGL api: everything is in the same binding space, specified by the layout(binding =...)

### Vulkan
TODO: Need a better description with an example

- Vulkan: there is descriptor set index, and binding index within a descriptor set. All resource parameters must be allocated a (descriptor set index, binding index) as its location.

### Metal
TODO: Need a better description with an example

- Metal: has argument buffer that behaves like a descriptor set in Vulkan, that is capable of holding different types of parameter bindings and can be populated beforehand.


## How Slang binds the resources

TODO: the content below describes a rough idea of what needs to be written.
- Fundamental Idea: a type can have multi-dimensional size. Examples
```
Struct {Texture2D t1; StructuredBuffer<int> b2; Sampler2D s3; int4 data; }
```
What’s the size of this type on different target APIs? The size is not a single number, but a vector whose dimensions are determined by the target API.
- TypeLayout: stores the multi-dimensional size of a type
- VarLayout: stores the offset of a variable or a struct field.
(Use a figure to explain type layout and var layout, left hand side of the figure: a struct definition, use arrows to point to the type layout and var layout of the struct and each field).
Show the same figure but this time for a different API (e.g. D3D11 vs Vulkan).

## `ParameterBlock` provides consistent binding locations in a separated space

TODO: the content below describes a rough idea of what needs to be written.
The main difference is whether or not the enclosing resources bleeds into the outer environment. ConstantBuffer: no indirection, everything bleeds out. ParameterBlock: uses a separate space to hold all child elements, only the “space” binding will bleed out.

Best practices to use parameter blocks to reuse parameter binding logic by creating descriptor set/ descriptor tables once and reuse them in different frames. ParameterBlocks allows developers to group parameters in a stable set, where the relative binding locations within the block is not affected by where the parameter block is defined, this enables developers to create descriptor set and populate them once, and reuse them over and over. For example: Scene often doesn’t change between frames, so we should be able to create descriptor table for all the scene resources without having to rebind every single parameter in every frame.


## How to figure out which binding slots are unused

TODO: the content below describes a rough idea of what needs to be written.
Querying if a parameter location is actually used by the shader after DCE.
Done through the IMetadata interface:
1. IComponentType::getEntryPointMetadata() or IComponentType::getTargetMetadata() returns IMetadata*
1. IMetadata::isParameterLocationUsed(int set, int binding) tells you whether or not the parameter binding at the specific location is being used.
1. Combine this with the reflection API, you can know if a parameter is used or not.


