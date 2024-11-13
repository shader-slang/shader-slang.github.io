# Using the Slang Reflection API

The reflection APIs for the shader compilers are used mostly for parameter bindings. But different graphics APIs do the resource binding differently. This causes troubles when the application wants to support multiple graphics APIs.

Slang's reflection API is designed to provide the parameter binding locations for all different graphics APIs through a consistent interface. To abstract over the differences of all target APIs, slang introduces several concepts.

We will go over how the resource binding is done for a few grpahics APIs in order to understand the problem more. And you will learn how Slang solves the problem with the reflection APIs.

## How parameter binding works for D3D12 and Vulkan

TODO: the content below describes a rough idea of what needs to be written.
- Traditional D3D11:  parameters are given a binding index based on its type. Textures has t0,t1,... bindings, and samplers are allocated in the “s” registers as in s0, s1,... same for UAVs (in u registers) and constant buffers (in c registers).
- Traditional OpenGL api: everything is in the same binding space, specified by the layout(binding =...)
- D3D12: introduces the concept of register spaces and descriptor tables. Developers can group parameter bindings into spaces, and can allocate descriptor tables to store the actual bindings.
- Vulkan: there is descriptor set index, and binding index within a descriptor set. All resource parameters must be allocated a (descriptor set index, binding index) as its location.
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


