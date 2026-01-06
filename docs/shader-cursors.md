---
title: A practical and scalable approach to cross-platform shader parameter passing using Slang’s reflection API
layout: page
description: A practical and scalable approach to cross-platform shader parameter passing using Slang’s reflection API
permalink: "/docs/shader-cursors/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

## Introduction

This document describes a comprehensive strategy for handling *parameter-passing* for GPU shader code. The presented approach is able to scale to large shader codebases which implement many different features across multiple modules. The Slang reflection API was intentionally designed to support this approach and to make it practical to adopt.

### Target Audience(s)

Our primary audience for this document is developers who are building and maintaining a large GPU shader codebase, and who have the freedom or opportunity to consider their high-level architecture for shader parameter passing. These developers may find that the approach outlined here is a good fit for their requirements, and we hope that they will consider adopting it. Developers who are already locked in to an architectural approach may find this material enlightening or aspirational, but not immediately actionable.

A second audience for this document is any developer who wants to better understand the motivations behind the design of the Slang reflection API -- especially developers who are considering contributing to the Slang project such that they might need to make changes to the interface or implementation of reflection. Because the engine approach described here motivates many of the design choices in the API, an understanding of the material in this document should help inform understanding of the reflection API design.

### This is not the only valid approach!

It is important to emphasize that this document only describes *one* approach to parameter-passing. Other approaches are possible and can yield good results; indeed, these other approaches are quite common in production shader codebases.

The approach we describe here was developed in collaboration with early adopters of Slang, based on their requirements and the challenges they face. We believe that this is a good general-purpose approach, and that developers can benefit from understanding it even if they do not adopt it.  
Developers who are not interested in the approach described here are invited to utilize other documentation on the Slang reflection API instead.

## Background: Shader Parameter Passing

### The Challenge

In typical programming languages, a developer does not often have to think about *parameter passing*; one function simply calls another, and the values given as arguments automatically show up as the values of parameters in the called function. Things are not so simple for GPU graphics programmers, for a few key reasons.

First, invoking a shader program typically involves communication between different programs, written in different programming languages, and running on different processors. A GPU shader program (comprising all of the per-stage entry points that are used together) is typically invoked via an API call from a host CPU program.

Second, the underlying mechanisms for passing parameter data from the CPU “caller” to the GPU “callee” are defined by the platform GPU API and its conventions. Data might be passed in simple buffers, descriptor sets, or API-defined “slots”. For a given shader parameter the application must pass argument data using the right mechanism, and at the right offset/index/location for that mechanism.

Furthermore, different target platforms and GPU APIs may use drastically different mechanisms for the same type of parameter. For example, a simple global-scope texture parameter is passed via an API-defined slot in Metal, via a descriptor set for Vulkan, and as ordinary data inside a buffer for OptiX.

### Typical Approaches

Before describing our approach to shader parameter passing, we will survey how the above challenges are tackled in many existing applications and engines.

#### Encapsulate Shader Features as Files

A large shader codebase is usually decomposed into a variety of different *features*: logical units of shader code that can be combined together as part of larger programs. The features of a real-time ray-tracing codebase might include various types of light sources, material models, path-tracing strategies, and reconstruction filters.

As in any large codebase, developer productivity benefits from good *separation of concerns* between different features. Typically we find different features (e.g., two different material models) split into different files. For example, a rasterization-based rendering engine might have a file that contains an implementation of cascaded shadow maps (CSMs):

```hlsl
// CascadedShadowMaps.hlsl
...
float evaluateCSM(...);
```

The features in a shader codebase may depend on one another, and in typical file-based approaches to modularity, dependencies are expressed via `#include` directives. For example, an implementation of sky lighting might make use of the CSM feature:

```hlsl
// SkyLight.hlsl
...
float3 evaluateSkyLighting(...);
```

A particular set of entry points for a rendering pass would then `#include` the files that define the features that will be used in that pass (perhaps conditionally, if certain features are optional and can be enabled/disabled for the given pass).

#### Define Shader Parameters as Global Variables

A given feature will typically have its own shader parameters. For example the sky lighting feature shown above might have a parameter to represent the color and intensity of the light from the sun, while the CSM feature would have parameters for shadow map textures. A typical application would declare those parameters at global scope, using code similar to the following:

```hlsl
// CascadedShadowMaps.hlsl

Texture2D shadowCascades[4];
SamplerComparisonState shadowCascadeSampler;
cbuffer CSMUniforms
{
    float4 shadowCascadeDistances;
};
float evaluateCSM(...);
```

Note how this typical approach treats the parameters of a feature differently, based on their type. Parameters of *ordinary* types like `float4` -- those that can be represented as “plain old data” in memory on all target platforms -- are grouped and declared as part of a constant buffer. Parameters of *opaque* types like `Texture2D` -- those that are often passed via special API-specific mechanisms -- are each declared as distinct global-scope uniform shader parameters. Because constant buffers are opaque types, the declaration of `CSMUniforms` in the above example is itself a global-scope uniform shader parameter.

To keep building our running example, the parameters of the Sky lighting feature might look something like:

```hlsl
// SkyLight.hlsl

TextureCube skyEnvMap;
SamplerState skyEnvSampler;
cbuffer SkyUniforms
{
    float3 sunLightIntensity;
    float3 sunLightDirection;
};
float3 evaluateSkyLighting(...);
```

#### Determine Where Each Global Parameter is Bound

Here we find a split in how typical codebases approach shader parameter passing. In order for host application code to set the value for a shader parameter like `shadowCascadeSampler` above, it needs to know both the API-specific mechanism used to set parameters of that type (e.g., a descriptor written into a descriptor set for Vulkan) and the location that the parameter is *bound* to for that mechanism (e.g., for Vulkan the location would include the descriptor set index and binding index).

##### Manually Bind Parameters to API-Specific Locations

Historically, shading languages like HLSL and GLSL have supported a wide variety of annotations that can be manually attached to shader parameters to specify how those parameters should be bound to locations for API-specific mechanisms. For example, an HLSL programmer might use a `register` annotation to manually specify what register and space a texture should bind to for D3D12, and a `[[vk::binding]]` annotation to manually specify what binding index and descriptor set it should bind to for Vulkan:

```hlsl
// CascadedShadowMaps.hlsl

[[vk::binding(0,9)]] Texture2D shadowCascades[4] : register(t0,space9);
[[vk::binding(1,9)]] SamplerComparisonState shadowCascadeSampler : register(s0,space9);
[[vk::binding(2,9)]] cbuffer CSMUniforms : register(b0,space9)
{
    float4 shadowCascadeDistances;
};

float evaluateCSM(...);
```

Note that the Slang compiler supports manual binding annotations like the above; while this document does not advocate for their use, the Slang toolset does not aim to dictate application policy around how shader parameters get bound.

While manual specification is a superficially simple idea, it does not scale well to large shader codebases that need to run on many different platforms. Manual binding of parameters to locations is effectively a global register-allocation problem that must be done by hand; any two features that might be used together must not specify overlapping locations. Further, because of differences in the mechanisms used by different GPU APIs, and their related rules and restrictions, additional annotations are often needed for each target platform/API.

##### Use Reflection to Query How Parameters are Bound

A more scalable approach, in terms of software development effort, than manual specification of binding is to allow the compiler for GPU shader code to automatically bind shader parameters to their per-target-API locations, and then to use *reflection* to query the location that was assigned to each parameter.

While relying on reflection in this way allows shader code to be kept simple and modular, it can be difficult for applications to achieve high performance for shader parameter passing. There are a few reasons for these difficulties.

Because all of the parameters of *all* features are declared at the same (global) scope, a compiler does not have the information it might need to group logically-related parameters for the purpose of efficiently passing them using mechanisms like Vulkan descriptor sets and D3D12 descriptor tables. For example all of the global-scope uniform shader parameters are automatically assigned locations with the same descriptor set index for Vulkan, such that every invocation of a GPU program must fill in a fresh descriptor set with *all* of the parameter values, if *any* of the values have changed.

Furthermore, most GPU compilers make few or no guarantees about the consistency of how parameters are automatically bound to locations when the same features (and thus the same parameters) are used in multiple programs, or when code is conditionally enabled/disabled (even just code in function bodies). The lack of such guarantees further impedes applications from efficiently using and *re-using* API constructs like descriptor sets across GPU operations.

#### Summary

We have described the way shader parameter passing is implemented today in typical codebases, and highlighted how these approaches typically suffer from either poor scalability in software-development effort, or poor runtime efficiency. Next we describe an approach that allows application developers to circumvent this trade-off.

## Use Types to Encapsulate Shader Features

### Each Feature Becomes a Struct in Slang

The essence of our approach is *type-based encapsulation*. Put simply, for each shader feature that a developer introduces, they should take *all* of its parameters and group them into a Slang `struct` type. This type will then be used to define the parameter-passing interface between the host application and GPU code. For example, to revisit our example of a cascaded shadow map feature:

```hlsl
// CascadedShadowMaps.slang

struct CascadedShadowMap
{
	Texture2D shadowCascades[4];
	SamplerComparisonState shadowCascadeSampler;
	float4 shadowCascadeDistances;

	float evaluate(...);
}
```

Note how all the parameters of a feature are declared the same way, independent of their type. Both parameters of ordinary type (`shadowCascadeDistances`) and opaque types (`shadowCascades`) are declared as fields of the same `struct`.

Encapsulating parameters into `struct` types avoids polluting the global scope with many declarations related to distinct features. Over-use of global variables is broadly understood to be a bad programming practice, but exactly that kind of bad practice is *typical* of current GPU shader codebases.

One reason why (ab)use of global variables may have been popular in shader code is that it provides the operations of a feature (like evaluateCSM() in the earlier code examples) implicit access to the shader parameters of that feature. In the revised code we show above, the global-scope function evaluateCSM() has been turned into an evaluate() method on the CascadedShadowMap type itself. The body of that method enjoys the same kind of convenient access to the parameters of the feature, through the implicit this parameter of the method.

#### Nest Types When it Makes Sense

When one feature depends on another (as our example sky light feature depends on the CSM feature), and there is a “has-a” relationship between those features, we encourage developers to model this relationship by nesting the relevant types:

```hlsl
// SkyLight.slang
import CascadedShadowMaps;

struct SkyLight
{
	CascadedShadowMap csm;
	TextureCube skyEnvMap;
	SamplerState skyEnvSampler;
	float3 sunLightIntensity;
	float3 sunLightDirection;

	float3 evaluateSkyLighting(...);
}
```

Note here how the `SkyLight type` includes a field, `csm`, of type `CascadedShadowMap`. Because a single `struct` type like `CascadedShadowMap` can encapsulate all of the parameters of a feature, independent of their types, the sky light feature can be insulated from the implementation details of the CSM feature; adding or removing parameters from the CSM feature does not require changing the code in `SkyLight.slang`.

### Each Feature Also Gets a Host Type

The next key to our approach is to define a type in the host application that corresponds to each feature in the GPU shader codebase. For our running example, a host application written in C++ might define something like:

```cpp
// CascadedShadowMaps.h
namespace MyEngine {
class CascadedShadowMap : public MyEngine::Object
{
public:
	...
private:
	MyEngine::Texture* shadowCascades[4];
	float shadowCascadeDistances[4];
	MyEngine::Sampler* shadowCascadeSampler;
};
}
```

Just as the Slang struct type defined earlier encapsulates the logical feature in the GPU shader codebase, this host type encapsulates the same feature in the CPU application code.

Note that the host type does *not* need to declare the exact same members with the exact same types as the GPU code. As a simple example, the `shadowCascadeDistances` are a vector in the GPU code and an array in the CPU code. All that matters is that this host type logically owns the data that needs to be passed to the parameters of the GPU feature.

#### Nesting Should be Mirrored in the Host Code

In cases where features in the GPU shader codebase logically nest, the corresponding host types should also make use of nesting:

```cpp
// SkyLight.h
namespace MyEngine {
class SkyLight : public MyEngine::Light
{
public:
	...
private:
	MyEngine::CascadedShadowMap* csm;
	MyEngine::Texture* skyEnvMap;
	MyEngine::Sampler* skyEnvSampler;
	MyEngine::ColorRGB sunLightIntensity;
	MyEngine::Vec3 sunLightDirection;
};
}
```

Here we see that the host-side representation of the sky light feature owns an object of the host-side `CascadedShadowMap` type. The nesting relationship in the shader code is mirrored in the host code.

### Encapsulate Parameter Passing in a Method

The next essential ingredient for our approach is a method belonging to the host type, that is responsible for writing parameter data for the corresponding GPU feature. For our running example, this would be something like:

```cpp
class CascadedShadowMap : ...
{
public:
	void writeInto(MyEngine::ShaderCursor cursor);
	...
};
```

In this example, the `writeInto()` operation is responsible for writing the data for the parameters of this feature into appropriate GPU-API-specific locations: bytes in buffers, descriptors in descriptor sets, etc. The details of *where* the data is being written to is encapsulated here as a *shader cursor*.

Much of this document will be dedicated to the ways that an application or engine can implement a shader cursor abstraction, but for now the key is to understand that a shader cursor acts like a pointer into whatever target-specific buffers or objects parameters are being written to. Much like a pointer in C/C++, a shader cursor type provides operations that can *navigate* from a cursor that points to an aggregate (like a structure or array) to its parts (fields or elements).

The body of `CascadedShadowMap::writeInto()` can be as simple as the following:

```cpp
// CascadedShadowMap.cpp
void CascadedShadowMap::writeInto(MyEngine::ShaderCursor cursor)
{
	for(int i = 0; i < 4; ++i)
	    cursor.field("shadowCascades").element(i).write(shadowCascades[i]);
	cursor.field("shadowCascadeDistances").write(shadowCascadeDistances);
	cursor.field("shadowCascadeSampler").write(shadowCascadeSampler);
}
```

Conceptually, this code takes a cursor, representing the destination to write to, and uses it to navigate to the individual parameters (fields of the `CascadedShadowMap` struct in the shader code) and write to them. Much of the remainder of this document is dedicated to showing how to (easily) implement the relevant operations on `ShaderCursor` such as `field()`, `element()`, and `write()`.

#### When Features Nest, Re-Use the Methods

One of the benefits of our type-based approach to encapsulation is that we can easily re-use the logic for writing parameter data in a hierarchical fashion, when types nest. For example, the `writeInto()` method for the sky light feature might look like:

```cpp
// SkyLight.cpp
void SkyLight::writeInto(MyEngine::ShaderCursor cursor)
{
	csm->writeInto(cursor.field("csm"));
	cursor.field("skyEnvMap").write(skyEnvMap);
	cursor.field("skyEnvSampler").write(skyEnvSampler);
	cursor.field("sunLightIntensity").write(sunLightIntensity);
	cursor.field("sunLightDirection").write(sunLightDirection);
}
```

Here we see that the `SkyLight::writeInto()` method leverages the `CascadedShadowMap::writeInto()` method to write the parameter data for the `csm` field. We see again that our approach allows the CSM feature to fully encapsulate its implementation details; the sky light feature need not have any knowledge of the fields of CascadedShadowMap or their types.

### Declare Parameter Blocks on Entry Points

At this point a reader may be left asking where this approach actually bottoms out; it can’t be `struct`s all the way down.

The final ingredient in our approach is that when defining the entry points of a shader program, a developer can use the `struct` types for features like our `SkyLight` example, and aggregate them into a small number of top-level uniform shader parameters using the `ParameterBlock<>` type provided by Slang. For example:

```hlsl
[shader("compute")]
void lightingPass(
	uniform ParameterBlock<SkyLight> skyLight,
	uniform ParameterBlock<SomethingElse> somethingElse,
	uint3 threadID : SV_DispatchThreadID)
{
	...
	let radiance = sunLight.evaluate(...);
	...
}
```

Here we have a compute entry point, `lightingPass`, that declares two `uniform` shader parameters, each of which is a `ParameterBlock<>`.

A `ParameterBlock<>` is a type that is unique to Slang, defined in the core library. A parameter block type like `ParameterBlock<SkyLight>` is a target-independent construct that maps to the primary or preferred parameter-passing mechanism defined on each target that Slang supports.

For example, when compiling code like this for Vulkan/D3D12, the parameter `skyLight` will become a descriptor set/table that contains just the members of the `SkyLight` type (which hierarchically includes the members of the `CascadedShadowMap` type). On Metal this same parameter would map to an argument buffer, and on CPU or CUDA/OptiX targets it would compile as a simple pointer. The developer who writes the shader entry point does not need to write target-specific code to take care of these distinct per-target mechanisms.

For simple compute entry points we recommend declaring `ParameterBlock<>`s  as `uniform` parameters of the entry point. For other pipelines like rasterization and ray-tracing, where programs are composed from multiple entry points, `ParameterBlock<>`s should currently be declared as global-scope uniform parameters.

### What have we gained?

The approach we are proposing here is so simple that it may appear naive, or like it cannot possibly provide any benefits over the existing approaches that we surveyed. In truth, however, the apparent simplicity in the application code comes from the way that this approach takes advantage of carefully designed aspects of the Slang language, compiler, and reflection API.

#### Compared to Manual Binding

Compared to the approach of declaring individual global-scope shader parameters with manual binding annotations, our approach keeps the code for shader features simple and uncluttered, and supports software development practices that scale to large codebases with many features that support many target platforms. Our approach *retains* the key benefit of manual binding: the ability to group logically-related parameters for efficient parameter passing via target-specific mechanisms like descriptor sets.

#### Compared to Existing Reflection-Based Approaches

Compared to the approach of declaring individual global-scope shader parameters and then using reflection to discover how those parameters were bound, our approach can support more efficient use of parameter-passing mechanisms like descriptor sets/tables.

It is vital to note that the layout for the members of a struct type in Slang is stable for a given platform, so long as the contents of the struct do not change. This means that when the same `struct` type is used in different shader programs, or different variants of the same program, it will always be laid out the same. For example, because the layout of a `struct` like `SkyLight` is stable, a GPU descriptor set/table that has been allocated and filled in using `SkyLight::writeInto()` can be re-used across GPU program invocations, even for different programs or variants.

## Implementing a Shader Cursor Using Slang

We have shown examples of how the features in an application’s shader codebase can be encapsulated to make shader parameter passing logic clean and composable. These examples fundamentally rely on the `MyEngine::ShaderCursor` type, so we now shift our focus to showing how such a type can be implemented easily and efficiently in an application or engine codebase.

As a temporary simplification to keep the presentation as simple as possible, the `ShaderCursor` type we build in this section will be specific to the Vulkan API. A later section will discuss how the approach presented here can be extended to work with *all* of the target platforms and APIs that Slang supports.

### Public Interface

Our earlier code examples, notably the `writeInto()` method bodies, have already given us an idea of the operations that a shader cursor needs to support.

#### Navigation

Given a cursor that points to a location with some aggregate type (a `struct` or array), an application needs a way to navigate to a part of that aggregate: a field of a `struct` or an element of an array. The corresponding operations are:

```cpp
// ShaderCursor.h
struct ShaderCursor
{
public:
	ShaderCursor field(const char* name);
	ShaderCursor field(int index);
	ShaderCursor element(int index);
	...
};
```

The `field()` operations form a cursor to a field of a `struct`, based on either the name or index of the field. The `element()` operation forms a cursor to an element of an array.

#### Writing

Once a cursor has been formed that points to a small enough piece of parameter data, such as an individual texture, an application needs a way to write a value for that parameter. The corresponding operations are:

```cpp
// ShaderCursor.h
struct ShaderCursor
{
public:
	void write(MyEngine::Texture* texture);
	void write(MyEngine::Sampler* sampler);
	void write(const void* data, size_t size);

	void write(MyEngine::Vec3 value) { write(&value, sizeof(value)); }
	void write(MyEngine::ColorRGB value) { write(&value, sizeof(value)); }
	...
};
```

In this example shader cursor implementation, different overloads of the `write()` operation deal with values of ordinary types and values of opaque types. The client of this interface does not need to think about the details of how different types of parameters might be passed on different target platforms and GPU APIs.

### State

#### Location

A shader cursor logically represents a location to which the values of shader parameters can be written. Different GPU APIs expose different mechanisms for parameter-passing, and a given feature in a shader codebase might include parameters that get bound to any or all of those mechanisms. 

In the case of the Vulkan API, shader parameters are typically passed using two mechanisms:

* Bytes in a buffer (`VkBuffer`)  
* Descriptors in a descriptor set (`VkDescriptorSet`)

A shader cursor implementation for Vulkan needs to at least store sufficient state to represent a location to write to for each of these parameter-passing mechanisms:

```cpp
// ShaderCursor.h
struct ShaderCursor
{
public:
	...
private:
	VkBuffer		m_buffer;
	std::byte*		m_bufferData;
	size_t			m_byteOffset;
	VkDescriptorSet	m_descriptorSet;
	uint32_t		m_bindingIndex;
	uint32_t 		m_bindingArrayElement;		
	...
};
```

Here our example `ShaderCursor` type has members to represent a location for each of the two parameter-passing mechanisms mentioned above. For ordinary data, there is a buffer and a byte offset into the buffer, representing a location within the buffer. For descriptors, there is a descriptor set, the index of a binding in that descriptor set, and an array index into the bindings at that index; together these fields represent a location within the descriptor set.

#### Type

A shader cursor acts much like a pointer, but the type of the data being pointed to is determined dynamically rather than statically. Thus rather than having a type template parameter like a C++ smart pointer would, this shader cursor implementation stores the type (and layout) as a field:

```cpp
// ShaderCursor.h
struct ShaderCursor
{
public:
	...
private:
	slang::TypeLayoutReflection* m_typeLayout;
	...
};
```

### Implementing the Operations

We will now go through the operations in the public interface for the example `ShaderCursor` type, and show how each can be implemented with the help of Slang’s reflection API.

Note that for simplicity of presentation, the implementation shown here does not include error checks, such as checking that a structure field actually exists or that an array element index is in bounds.

#### Writing

The implementation of writing data to a shader cursor is, in general, specific to a given GPU API, and also can depend on the type of data being written (ordinary data, textures, samplers, etc.).

##### Ordinary Data

For the Vulkan API, shader parameters of ordinary types are passed via buffer memory. Writing such a parameter to a cursor entails writing that data to the underlying buffer:

```cpp
void ShaderCursor::write(const void* data, size_t size)
{
	memcpy(m_bufferData + m_byteOffset, data, size);
}
```

The above code assumes that the memory of the buffer that the shader cursor points into is CPU-accessible. An alternative implementation for cases where the buffer might not be writable directly from CPU is:

```cpp
void ShaderCursor::write(const void* data, size_t size)
{
	vkCmdUpdateBuffer(commandBuffer,
		m_buffer,
		m_byteOffset,
		size,
		data);
}
```

Developers are encouraged to carefully evaluate the performance trade-offs of using different Vulkan API operations and pick the best one for their application/engine.

For the purposes of this document, the important thing to note is that all of the information needed to write to the buffer is readily available.

##### Opaque Types

For the Vulkan API, textures and other opaque types are passed via descriptor sets. Writing a texture to a cursor entails writing a descriptor into a descriptor set:

```cpp
void ShaderCursor::write(MyEngine::Texture* texture)
{
	VkDescriptorImageInfo image;
	image.imageView = texture->getVulkanImageView();
	image.imageLayout = texture->getVulkanImageLayout();

	VkWriteDescriptorSet write = {VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET, 0};
	write.dstSet = m_descriptorSet;
	write.dstBinding = m_bindingIndex;
	write.dstArrayElement = m_bindingArrayElement;
	write.descriptorCount = 1;
	write.descriptorType = VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE;
	write.pImageInfo = &image;

	vkUpdateDescriptorSets(vulkanDevice,
		1, &write,
		0, nullptr);
}
```

Here most of the code is just the boilerplate required to set up a call to `vkUpdateDescriptorSets()`. The essential thing to note is that all of the fields of the `VkWriteDescriptorSet` type can be determined from either the state of the shader cursor, or from the texture image itself.

#### Navigation

The operations above for writing using a shader cursor have been simple because the shader cursor tracks exactly the information that the corresponding Vulkan API operations need. The most important task remaining is to show how to compute this information correctly (and efficiently) when using a cursor to navigate to a structure field or array element.

##### Fields

The task of navigating to a structure field by name can be reduced to the task of navigating by the field index:

```cpp
ShaderCursor ShaderCursor::field(const char* name)
{
	return field(m_typeLayout->findFieldIndexByName(name));
}
```

The more interesting operation is then:

```cpp
ShaderCursor ShaderCursor::field(int index)
{
	slang::VariableLayoutReflection* field = m_typeLayout->getFieldByIndex(index);

	ShaderCursor result = *this;
	result.m_typeLayout = field->getTypeLayout();
	result.m_byteOffset += field->getOffset();
	result.m_bindingIndex += field->getOffset(slang::ParameterCategory::DescriptorTableSlot);
	
	return result;
}
```

The Slang reflection API is used to look up information about the given field, including its type layout and offsets. A shader cursor is formed to refer to the field, borrowing its initial state from the current cursor.

The byte offset of the field is the byte offset of the aggregate plus the offset of the field in that aggregate. The `getOffset()` method of `slang::VariableLayoutReflection` defaults to returning an offset in bytes.

The starting binding index of the field is the starting binding index of the aggregate plus the offset of the field in binding indices. This code explicitly queries the offset of the field using the `slang::ParameterCategory` that corresponds to Vulkan binding indices.

##### Elements

Navigating a shader cursor to an array element is only slightly more complicated than navigating to a structure field:

```cpp
ShaderCursor ShaderCursor::element(int index)
{
	slang::TypeLayoutReflection* elementTypeLayout =
		m_typeLayout->getElementTypeLayout();

	ShaderCursor result = *this;
	result.m_typeLayout = elementTypeLayout;
	result.m_byteOffset += index * elementTypeLayout->getStride();

	result.m_bindingArrayElement *= m_typeLayout->getElementCount();
	result.m_bindingArrayElement += index;

	return result;
}
```

Similarly to the case of structure fields, the Slang reflection API is used to query the type layout for the element that the new cursor will point to.

The byte offset of an array element is computed in an unsurprising manner: an additional offset is applied, equal to the desired element index times the *stride* in bytes between consecutive array elements.

Note that for many of the targets Slang supports the stride of a type layout is not the same as its size, whereas in C/C++ the stride between consecutive elements in an array of `T` is always `sizeof(T)`.

###### Computing the index into a binding array

While computing the byte offset of an array element is straightforward, the logic for indexing into the array elements of a descriptor set binding may require some explanation. The step where the desired element index is added to the existing index is intuitive, but the previous step where the existing index is multiplied by the element count of the array may not immediately make sense.

While the approach we advocate for is not intuitive, it has been chosen because it allows a shader cursor to robustly support descriptors together with complicated cases of array and structure nesting.

To help illustrate why the presented approach yields correct results, consider an array-of-arrays like the following:

```hlsl
Texture2D t[3][5];
```

When laid out for Vulkan, the array t will map to a single binding index in a descriptor set, where that index refers to a range of 15 descriptors.

The array index of a single descriptor in that range, say `t[x][y]`, is computed as `x*5 + y`. The indexing math for arrays of descriptors is consistent with indexing of arrays of ordinary type in C/C++, Slang, etc. With the shader cursor API as presented here, the equivalent operation to `t[x][y]` is `t.element(x).element(y)`.

If we start with a cursor pointing to `t`, with `m_bindingArrayElement` equal to zero, then:

* The `.element(x)` operation is indexing into a 3-element array, and will yield a new cursor with `m_bindingArrayElement` equal to `0*3 + x = x` 
* The `.element(y)` operation is indexing into a 5-element array, and will yield a new cursor with `m_bindingArrayElement` equal to `x*5 + y`, which is the desired result

## Reflecting on What Has Been Covered So Far

So far, this document has presented:

* An approach for encapsulating modular features, and their shader parameters, in a large GPU shader codebase  
* A corresponding approach for organizing the host-application logic that writes parameter data for those shader features  
* An example Vulkan implementation of a *shader cursor* type that uses the information provided by the Slang reflection API to support that host-application logic

At each step the code has been simple and clean -- both in per-feature application logic and in the shader cursor implementation. The simplicity of the code belies the fact that this approach has been used successfully in large and high-performance real-time-rendering codebases.

At this point, we hope that a reader understands our approach, can see its merits, and believes that it can be practically implemented with modest effort.

The remainder of this document is dedicated to bridging the gaps between what has been presented so far and a more complete implementation. The most important of these gaps are:

* The Vulkan-specific shader cursor needs to be revised to support multiple platforms  
* An application needs to be able to allocate constant buffers and parameter blocks based on reflection data, and to kick off the parameter-passing logic for top level shader parameters (such as parameter blocks)

## Making a Multi-Platform Shader Cursor

Above we showed an example implementation of an engine-specific ShaderCursor type, that only supported the Vulkan API. In this section we will show how to revise that implementation to support multiple targets, with help from the Slang reflection API.

### What is the challenge?

In order for the Vulkan-specific ShaderCursor to present a clean and easy-to-use interface, it was important that it stored a representation of a location to be written to for *each* of the parameter-passing mechanisms that Vulkan supports (namely: ordinary bytes in a buffer, and descriptors in a descriptor set). When navigating a cursor to a field of a struct or element of an array, the ShaderCursor implementation needed to compute proper offsets to apply for each of these mechanisms.

In order to extend a ShaderCursor implementation to support multiple GPU APIs, it would need to store an appropriate representation of a location for each parameter-passing mechanism supported by *all* of the APIs that are to be supported. For example, in order to target D3D11 a ShaderCursor would need to store not just a single binding index (as for Vulkan), but separate indices for `t`, `s`, `u`, and `b` registers. Even our presentation for Vulkan above was incomplete, since Vulkan also supports passing data via push constants, which are yet another mechanism.

The full diversity of parameter-passing mechanisms for target GPU APIs can be seen in the `slang::ParameterCategory` enumeration.

Trying to tackle this problem head-on by storing additional offsets/indices in an engine-specific `ShaderCursor` leads to messier and more complicated code, with a lot of target-specific logic mixed up with the core work that the `ShaderCursor` is meant to perform.

### Simplifying the problem with *binding ranges*

The Slang reflection API provides an additional decomposition of type layouts in terms of target-independent *binding ranges*. Each binding range corresponds to a “leaf” in the layout of a type, where that leaf has a type that is opaque for at least some type. As a contrived example:

```hlsl
struct MaterialLayer
{
	Texture2D t[3];
	float4 c;
	SamplerState s;
}
struct Material
{
	int n;
	MaterialLayer layers[5];
}
```

In this example, the type `Material` contains two binding ranges:

* A binding range for `Material::layers::t`, with a count of 15  
* A binding range for `Material::layers::s`, with a count of 5

Every type layout can be broken down as zero or more bytes of ordinary data, and zero or more binding ranges. All of the binding ranges of a type are grouped together for counting and indexing, so that no matter how complicated of a type an application is working with a `ShaderCursor` implementation need only track two things: a byte offset for ordinary data, and an index for a binding range.

### Applying this to the example ShaderCursor implementation

#### Representation of Location

Our Vulkan-specific shader cursor implementation used the following state to represent the location being written to:

```cpp
struct ShaderCursor
{
	VkBuffer		m_buffer;
	std::byte*		m_bufferData;
	size_t			m_byteOffset;
	VkDescriptorSet	m_descriptorSet;
	uint32_t		m_bindingIndex;
	uint32_t 		m_bindingArrayElement;		
	...
};
```

Note how this representation mixes up the representation of offset/index information and the conceptual object(s) being written into (the `VkBuffer` and `VkDescriptorSet`).

For a portable implementation, we move the offset/index information out into its own type:

```cpp
struct ShaderOffset
{
	size_t			byteOffset = 0;
	uint32_t		bindingRangeIndex = 0;
	uint32_t 		arrayIndexInBindingRange = 0;
};
```

And then the shader cursor itself just tracks the offset/index information and a conceptual *object* that is being written into:

```cpp
struct ShaderCursor
{
	slang::TypeLayoutReflection *m_typeLayout;
	MyEngine::ShaderObject*	m_object = nullptr;
	MyEngine::ShaderOffset	m_offset;
};
```

We now turn our attention to how that object being written into should be represented.

#### RHI ShaderObject Interface

An application/engine that supports many target GPU APIs will typically define an *RHI* (rendering hardware interface) that abstracts over the essential API- or hardware-specific operations. Looking at the Vulkan-specific ShaderCursor implementation above, the various write() operations include direct Vulkan API calls, and thus need to be put behind an RHI in a portable engine.

The `ShaderObject` type introduced above should be part of the engine’s RHI, and provide operations to write the various kinds of parameters, given an offset:

```cpp
// ShaderObject.h
class ShaderObject
{
public:
	virtual void write(ShaderOffset offset, Texture* texture) = 0;
	virtual void write(ShaderOffset offset, Sampler* sampler) = 0;
	virtual void write(ShaderOffset offset, const void* data, size_t size) = 0;
	...
};
```

The corresponding operations on the target-API-independent shader cursor then just delegate to the shader object, passing along the offset:

```cpp
void ShaderCursor::write(MyEngine::Texture* texture)
{
	m_object->write(m_offset, texture);
}
```

### Target-Independent ShaderCursor Navigation

With a new representation for the index/offset information in a location, the core `ShaderCursor` operations `field()` and `element()` need to be updated. It turns out, however, that the new target-independent versions are similarly clean and simple compared to the earlier Vulkan-specific versions.

#### Fields

Here is the target-independent code for navigating to a field by index:

```cpp
ShaderCursor ShaderCursor::field(int index)
{
	slang::VariableLayoutReflection* field = m_typeLayout->getFieldByIndex(index);

	ShaderCursor result = *this;
	result.m_typeLayout = field->getTypeLayout();
	result.m_offset.byteOffset += field->getOffset();
	result.m_offset.bindingRangeIndex += m_typeLayout->getFieldBindingRangeOffset(index);

	return result;
}
```

The only substantive difference here is that instead of updating a Vulkan-specific binding index using a query for just `slang::ParameterCategory::DescriptorSlot`, the code instead uses a separate binding-range oriented part of the reflection API: `slang::TypeLayoutReflection::getFieldBindingRangeOffset()`.

#### Elements

In contrast the case for structure fields, the logic for array elements does not really change *at all*:

```cpp
ShaderCursor ShaderCursor::element(int index)
{
	slang::TypeLayoutReflection* elementTypeLayout = m_typeLayout->getElementTypeLayout();

	ShaderCursor result = *this;
	result.m_typeLayout = elementTypeLayout;
	result.m_offset.byteOffset += index * elementTypeLayout->getStride();

	result.m_offset.arrayIndexInBindingRange *= m_typeLayout->getElementCount();
	result.m_offset.arrayIndexInBindingRange += index;

	return result;
}
```

Astute readers might have noted that nothing about the array-indexing case shown previously had appeared Vulkan-specific, and that is indeed the case. All that has changed here is renaming to account for the new `ShaderOffset` type.

#### That’s Really It

The above changes to the `field()` and `element()` operations are sufficient to make the navigation operations on `ShaderCursor` target-independent. The remaining work is all in the RHI implementation of a shader object for each target.

### Target-Specific ShaderObject Implementation

The target-API-specific shader object implementation is responsible for interacting with the underlying GPU API, and is also the place where the target-independent binding range abstraction needs to be translated over to the target-specific concepts.

A Vulkan-specific shader object might be declared as:

```cpp
// VulkanShaderObject.h
class VulkanShaderObject : public ShaderObject
{
public:
	void write(ShaderOffset offset, Texture* texture) override;
	void write(ShaderOffset offset, Sampler* sampler) override;
	void write(ShaderOffset offset, const void* data, size_t size) override;
	...
private:
	slang::TypeLayoutReflection*	m_typeLayout;
	VkBuffer				m_buffer;
	std::byte*				m_bufferData;
	VkDescriptorSet			m_descriptorSet;
};
```

Note how this type now holds the Vulkan-specific fields from our earlier `ShaderCursor` implementation, and *also* tracks the Slang type layout for the overall object being written into. For example, if a `ShaderObject` were created to represent a `ParameterBlock<SkyLight>`, then the `m_typeLayout` in that shader object would be a Slang type layout for `SkyLight`.

The `write()` operations of this Vulkan RHI shader object are similar to those of the earlier Vulkan-specific `ShaderCursor`, with the key additional work of translating a binding range index into the Vulkan-specific binding index:

```cpp
void VulkanShaderObject::write(ShaderOffset offset, Texture* texture)
{
	uint32_t bindingIndex = m_typeLayout->getBindingRangeFirstDescriptorRangeIndex(
		offset.bindingRangeIndex);

	VkDescriptorImageInfo image;
	image.imageView = texture->getVulkanImageView();
	image.imageLayout = texture->getVulkanImageLayout();

	VkWriteDescriptorSet write = {VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET, 0};
	write.dstSet = m_descriptorSet;
	write.dstBinding = bindingIndex;
	write.dstArrayElement = offset.arrayIndexInBindingRange;
	write.descriptorCount = 1;
	write.descriptorType = mapToDescriptorType(m_typeLayout->getBindingRangeType(offset.bindingRangeIndex));
	write.pImageInfo = &image;

	vkUpdateDescriptorSets(vulkanDevice,
		1, &write,
		0, nullptr);
}
```

Here we see that the Slang reflection API directly supports the translation that the RHI implementation needs to map a target-independent binding range index over to the target-specific index or offset, based on the type of the binding range.

An additional key detail in the above code that makes it more complete and robust than the earlier simple `ShaderCursor` implementation is that this RHI operation uses Slang reflection to query the type of binding represented by the range, so that it can properly account for more cases of the `VKWriteDescriptorSet::descriptorType` field:

```cpp
VkDescriptorType mapToDescriptorType(slang::BindingType bindingRangeType)
{
	switch(bindingRangeType)
	{
	case slang::BindingType::Texture:
		return VK_DESCRIPTOR_TYPE_SAMPLED_IMAGE;
	case slang::BindingType::MutableTexture:
		return VK_DESCRIPTOR_TYPE_STORAGE_IMAGE;
	...
	}
}
```

This RHI code is able to remain simple and clean because the Slang reflection API provides methods that directly query the information that an RHI needs to know (in this case, in order to fill out the fields of a `VkWriteDescriptorSet`):

* The `slang::TypeLayoutReflection::getBindingRangeFirstDescriptorRangeIndex()` method translates the target-independent binding range index into the Vulkan binding index  
* The `slang::TypeLayoutReflection::getBindingRangeType()` method provides information about the binding range that can be mapped directly to the `VkDescriptorType`

### Is that really all the code that is needed?

Yet again, we have arrived at a solution so simple it might seem like nothing has been done. We took a Vulkan-specific shader cursor and split it into a target-independent shader cursor that uses the concept of binding ranges as exposed by the Slang reflection API, and then showed how the parts of the old implementation that interacted with the Vulkan API can be moved under an RHI.

At this point RHI `ShaderObject` implementations comparable to `VulkanShaderObject` can be authored for the other targets that Slang supports, and the complexity of those implementations can be similarly simple.

What has been (intentionally) glossed over thus far is how to allocate `ShaderObjects` corresponding to constant buffers and parameter blocks, and how to handle the top-level shader parameters corresponding to such buffers and blocks.

## Buffers, Blocks, and Top-Level Shader Parameters

### When to use buffers, blocks, or just plain structs

The Slang core library includes two constructs that allow a developer to control how shader parameters are passed: `ConstantBuffer<>` and `ParameterBlock<>`. Both of these constructs work best when shader features organize their parameters into struct types, as this document recommends. While, e.g., both `ConstantBuffer<SkyLight>` and `ParameterBlock<SkyLight>` are allowed and meaningful, their meanings differ in a few key ways.

To help illustrate the difference in what these types mean, consider the following Slang structure type:

```hlsl
struct Aggregate
{
	SkyLight simpleValue;
	ConstantBuffer<SkyLight> constantBuffer;
	ParameterBlock<SkyLight> parameterBlock;
}
```

#### Targets with Descriptor Sets

For a targets like Vulkan, D3D12, or WebGPU, which support descriptor sets or something equivalent:

* The fields of `simpleValue`, both ordinary and opaque, become part of the memory layout of `Aggregate`. The behavior is conceptually similar (but not identical) to what would happen if the fields of `SkyLight` were copy-pasted into `Aggregate`.

* The `constantBuffer` member takes the data of ordinary type in `SkyLight` (if there is any) and wraps it up into a constant buffer; that data does not impact the in-memory layout of `Aggregate`. However the layout of `Aggregate` will include all of the opaque-type data in `SkyLight` (since that data cannot be passed via an ordinary buffer) as well as the binding/register for the constant buffer used to wrap up the ordinary data (if one was needed)

* The `parameterBlock` member wraps up the ordinary-type data in `SkyLight` in a constant buffer (if necessary), and then wraps up all of the opaque-type data in `SkyLight` (plus the constant buffer, if one was introduced) in a descriptor set/table. None of the members of `SkyLight` become part of the layout of `Aggregate`, although the layout of `Aggregate` *will* include the descriptor set/table that was introduced.

A developer who is aggregating/nesting types in their shader code can thus pick between these three options as needed in order to match their desired policies for how shader parameter data will be re-used or not. Each successive option above introduces more indirection than the option before it, which can enable more buffers and/or descriptor sets to be re-used, but may come with other trade-offs.

#### Other Targets

Not all of the compilation targets that Slang supports have behavior akin to Vulkan/D3D12/WebGPU, and these additional targets have their own layout behaviors:

* For targets like D3D11, which support constant buffers but not descriptor sets/tables, the `ParameterBlock<>` type behaves exactly like the `ConstantBuffer<>` type.

* For targets like CUDA/OptiX and CPU, on which all types are ordinary, the `ConstantBuffer<SkyLight>` and `ParameterBlock<SkyLight>` types are both laid out exactly like a `SkyLight*` -- that is, these constructs map to simple pointer indirection.

Developers of portable codebases are encouraged to pick between the three options illustrated above (by-value nesting, constant buffers, or parameter blocks) based on performance considerations for targets like Vulkan/D3D12; doing so will tend to result in good performance on these other targets as well.

### Allocating Shader Objects

An attentive reader may have had a lurking question from when we presented our first (Vulkan-specific) shader cursor implementation: how is one supposed to allocate a `VkDescriptorSetLayout` to correspond to some type in their Slang shader code? For example, given a `ParameterBlock<SkyLight>` shader parameter, how does one allocate a descriptor set based on the type `SkyLight`?

We have intentionally deferred discussion of this question until *after* presenting a multi-platform implementation of shader cursors, because it turns out that the binding ranges reflected by Slang provide a convenient answer to this question.

#### What Information Is Needed?

We are going to focus primarily on the needs of Vulkan and D3D12 here. Other target platforms and APIs tend to have similar considerations, or are simpler to work with.

Given the discussion above of how the `ConstantBuffer<T>` and `ParameterBlock<T>` types are laid out by the Slang compiler, we can see that a ShaderObject intended to represent one (or both) of those cases needs to be able to store:

* Zero or one buffer, to hold the ordinary data of `T` (if any)  
* Zero or one descriptor set/table, to hold the descriptors of `T` (if any)

In order to allocate the buffer, an application simply needs to know the number of bytes of uniform data in `T`, which can be queried as simply as `typeLayout->getSize()`. If the result is zero, then no buffer is needed; otherwise, a buffer of that many bytes is needed.

The more interesting challenge is the descriptor set/table. Consider the Vulkan case, where allocating a matching descriptor set requires the following steps:

* Enumerate the bindings in the layout of `T`, and for each fill in a matching `VkDescriptorSetLayoutBinding` and append it to an array.

  * If there were a non-zero number of bytes of ordinary data, then first include a `VkDescriptorSetLayoutBinding` for the constant buffer that wraps up the ordinary data  
* Invoke `vkCreateDescriptorSetLayout` with the array above to create a `VkDescriptorSetLayout`  
* Invoke `vkAllocateDescriptorSets` using the above layout to create the descriptor set

The first of those steps is the one where support from the Slang reflection API is clearly needed.

#### The Hard Way: Recursively Walking Reflected Type Layouts

In order to enumerate all of the bindings in an arbitrary `slang::TypeLayoutReflection`, an application needs to recursively traverse the structure of types. This can be accomplished with a helper type like:

```cpp
struct ShaderObjectLayoutBuilder
{
	std::vector<VkDescriptorSetLayoutBinding> m_bindings;
	uint32_t m_bindingIndex = 0;
	void addBindingsForParameterBlock(
		slang::TypeLayoutReflection* typeLayout);
	void addBindingsFrom(
		slang::TypeLayoutReflection* typeLayout,
		uint32_t elementCount);
}
```

The `addBindingsForParameterBlock()` method needs to handle the detail of including a binding in the descriptor set for the constant buffer that gets introduced if the type layout contains any ordinary data:

```cpp
void ShaderObjectLayoutBuilder::addBindingsForParameterBlock(
slang::TypeLayoutReflection* typeLayout)
{
	if(auto size = typeLayout->getSize())
	{
		VkDescriptorSetLayoutBinding layoutBinding;
		layoutBinding.binding = m_bindingIndex++;
		layoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
		layoutBinding.descriptorCount = 1;
		...
		m_bindings.push_back(layoutBinding);
	}
	addBindingsFrom(typeLayout, 1);
}
```

The `addBindingsFrom()` method needs to look at the kind of type that is passed in and add zero or more entries to `m_bindings`, possibly via recursively calling itself. It can do this by `switch`ing on the kind of type passed in:

```cpp
void ShaderObjectLayoutBuilder::addBindingsFrom(
slang::TypeLayoutReflection* typeLayout,
uint32_t descriptorCount)
{
	switch(typeLayout->getKind())
	{
	case slang::TypeReflection::Kind::Scalar:
	case slang::TypeReflection::Kind::Vector:
	case slang::TypeReflection::Kind::Matrix:
		// these kinds of types only have ordinary data
		return;
	...
	}
}
```

The leaf case here is resources, samplers, etc.:

```cpp
case slang::TypeReflection::Kind::Resource:
...
	VkDescriptorSetLayoutBinding layoutBinding;
	layoutBinding.binding = m_bindingIndex++;
	layoutBinding.descriptorType = ...;
	layoutBinding.descriptorCount = descriptorCount;
	...
	m_bindings.push_back(layoutBinding);
	break;
}
```

Note that in this case it is not immediately obvious how to set the descriptorType field of `VkDescriptorSetLayoutBinding`; the right value to set there depends on more details of the type being passed in. Rather than dive into those details, we will simply note that the next section will show an overall easier way to accomplish this task.

The recursive cases involve arrays and structure types. The array case is relatively straightforward, and simply modifies the `descriptorCount` that is passed down into a recursive call:

```cpp
case slang::TypeReflection::Kind::Array:
	addBindingsFrom(
		typeLayout->getElementType()
		descriptorCount*typeLayout->getElementCount());
	break;
}
```

The structure case is similarly straightforward, and simply recursively traverses each field:

```cpp
case slang::TypeReflection::Kind::Struct:
	for(int f = 0; f < typeLayout->getFieldCount(); f++)
	{
		addBindingsFrom(
			typeLayout->getFieldByIndex(f)->getTypeLayout(),
			descriptorCount);
	}
	break;
```

##### An Important Assumption

The above code is doing something subtle, that readers should note. Rather than use the Slang reflection API to query the binding indices that were assigned by the Slang compiler, this code is simply incrementing the `m_bindingIndex` member every time a suitable leaf field is encountered. This approach works because the application code shown here is mirroring the same simple and deterministic way that the Slang compiler traverses types to automatically compute layout. Such a simple approach will not work in codebases that deviate from the approach that this document advocates for, and who make heavy use of manually-specified binding.

Note that these assumptions are valid in part because the Slang compiler, as a matter of policy, does not eliminate unused shader parameters (whether as top-level parameters, or nested within structures) prior to computing layout and assigning binding locations. This design choice is in contrast to most existing GPU shader compilers, which aggressively eliminate unused textures, and other parameters of opaque types, and then only perform layout and reflect the parameters that remain.

#### The Easy Way: Using Binding Ranges

The concept of binding ranges in the Slang is closely linked to the way that descriptor sets are organized for Vulkan/D3D12/etc. Using the Slang reflection API for binding ranges makes it possible to write a non-recursive version of the above logic:

```cpp
void ShaderObjectLayoutBuilder::addBindingsFrom(
slang::TypeLayoutReflection* typeLayout,
uint32_t descriptorCount)
{
	int bindingRangeCount = typeLayout->getBindingRangeCount();
	for(int i = 0; i < bindingRangeCount; ++i)
	{
		VkDescriptorSetLayoutBinding layoutBinding;
		layoutBinding.binding = m_bindingIndex++;
		layoutBinding.descriptorType = mapToDescriptorType(m_typeLayout->getBindingRangeType(i));
		layoutBinding.descriptorCount = descriptorCount * m_typeLayout->getBindingRangeBindingCount(i);
		...
		m_bindings.push_back(layoutBinding);
	}
}
```

Note that making use of binding ranges not only eliminates the need for recursion, but also directly exposes the information that the application needs in order to fill out the `descriptorType` field in `VkDescriptorSetLayoutBinding`.

Note also that even when using binding ranges to simplify this code, an application still needs to apply logic as shown in `addBindingsForParameterBlock()` to account for a constant-buffer binding, in the case where a type includes ordinary data. As in the earlier example, we are keeping the code simple by computing binding indices directly in the host code (`m_bindingIndex++`), in a way that will match Slang’s automatic layout rules; this simple logic might not work for a codebase that employs manual binding annotations.

### Cache and Re-Use Shader Object Layouts

Given the way that, e.g., the Vulkan API distinguishes between `VkDescriptorSets` and `VkDescriptorSetLayouts`, we advocate that the RHI for an applicaiton/engine should make a distinction between `ShaderObject`s and `ShaderObjectLayout`s. The relevant parts of the RHI might look something like:

```cpp
class ShaderObject;
class ShaderObjectLayout
class RHI
{
	virtual ShaderObjectLayout* createShaderObjectLayout(
	slang::TypeLayoutReflection* typeLayout) = 0;
	virtual ShaderObject* createParameterBlock(
		ShaderObjectLayout* layout) = 0;
}
```

We encourage applications to cache and re-use `ShaderObjectLayout`s, to avoid redundantly creating multiple RHI objects corresponding to the same Slang reflection information.

### Writing to a Top-Level Shader Parameter

When application shader code has been written so that top-level shader parameters are all `ParameterBlock<>`s, it can be very easy to kick off parameter passing. This section will show the logic an application can use to construct and fill in a fresh parameter block for a top-level shader parameter, using the RHI design already shown.

#### When Using Globals

In the case where the shader parameter in question is declared as a global:

```hlsl
ParameterBlock<SkyLight> gSkyLight;
...
```

the application code needs to look up this parameter by name to start querying how it was bound:

```cpp
void appCodeToRenderSomething(
	slang::ShaderReflection* programLayout,
	MyEngine::SkyLight* skyLight)
{
	auto globals = programLayout->getGlobalParamsTypeLayout();
	auto skyLightParam = globals->getFieldByIndex(globals->findFieldIndex("gSkyLight"));
	uint32_t descriptorSetIndex = skyLightParam->getOffset(slang::ParameterCategory::RegisterSpace);
...
}
```

In this example, the application code has determined the `descriptorSetIndex` that the `gSkyLightParameter` maps to for Vulkan (or, equivalently, the register space that the parameter maps to for D3D12).

#### When Using Entry-Point Parameters

In the case where the shader parameter in question is declared as a parameter of a compute entry point:

```hlsl
[shader("compute")]
void computeSomething(
	ParameterBlock<SkyLight> skyLight,
	...)
{ ... }
```

the application logic is similar:

```cpp
void appCodeToComputeSomething(
slang::ShaderReflection* programLayout,
MyEngine::SkyLight* skyLight)
{
	auto computeEntryPoint = programLayout->getEntryPointByIndex(0);
	auto params = computeEntryPoint->getTypeLayout();

	auto skyLightParam = params ->getFieldByIndex(params ->findFieldIndex("gSkyLight"));
	uint32_t descriptorSetIndex = skyLightParam->getOffset(slang::ParameterCategory::RegisterSpace);
...
}
```

Just as in the case for a global parameter, we have extracted the `skyLightParam` and its `descriptorSetIndex` from the reflection data.

Note that this code assumes that *all* of the shader parameters are being declared as uniform entry-point parameters. Cases that mix global and entry-point shader parameters need some additional logic that is beyond what that document has space to cover.

#### Creating a Shader Object and Initial Cursor

Regardless of how the reflection-data for the top-level parameter is queried, the next major task is to create a shader object based on the type of the type of the data in the parameter block, and to start filling it in:

```c++
void appCodeToComputeSomething(
	slang::ShaderReflection* programLayout,
	MyEngine::SkyLight* skyLight)
{
	...
	auto skyLightTypeLayout = skyLightParam->getTypeLayout()->getElementTypeLayout();

	auto skyLightShaderObject = rhi->createParameterBlock(
		rhi->createShaderObjectLayout(skyLightTypeLayout));

	skyLight->writeInto(ShaderCursor(skyLightShaderObject));

	rhi->setDescriptorSet(descriptorSetIndex, skyLightShaderObject);
}
```

This code starts by querying the *element type* of the shader parameter. Remember that the parameter was declared as a `ParameterBlock<SkyLight>`, so its type layout is the type layout of a `ParameterBlock<>`, and the application needs to query the layout of the element type (in this case `SkyLight`) in order to allocate a matching shader object.

Next the code allocates a shader object to match the type layout for `SkyLight`, using the logic we described above for computing a descriptor set layout based on Slang reflection information.

Once the shader object is allocated, the code invokes the `SkyLight::writeInto()` operation to write the state of the CPU-side `SkyLight `object into the GPU-side `SkyLight` structure, and then sets the shader object as a descriptor set using the application/engine’s RHI.

#### Creating a Shader Cursor from a ShaderObject

The key missing piece in the preceding code example is the operation to create a shader cursor from a shader object, but this turns out to be a simple matter. The desired operation in the `ShaderCursor` API is:

```c++
struct ShaderCursor
{
public:
	ShaderCursor(ShaderObject* object);
	...
};
```

and the implementation amounts to:

```c++
ShaderCursor::ShaderCursor(ShaderObject* object)
	: m_object(object)
	, m_typeLayout(object->getTypeLayout())
{}
```

## Conclusion

Our goal with this document has been to illustrate an idiomatic approach that an application/engine can use to achieve GPU shader code and host-side logic for shader parameter-passing that is both practical and scalable to large codebases.

The Slang project developers have significant experience implementing and using this approach. The slang-rhi library follows the design approach given here closely, and is used both to test Slang on all of its target platforms, and by large and modular rendering codebases like NVIDIA’s Falcor. Readers who are interested in exploring or adopting this approach in their renderers are encouraged to look at those open-source codebases for more implementation details.

The Slang compiler and reflection API play a vital role in supporting this idiom. The way that the Slang compiler applies its layout rules for struct types deterministically, and treats both ordinary and opaque types equivalently means that the layout of shader parameters is stable and robust across recompiles, different program variants, etc. The Slang reflection API robustly handles types that mix ordinary- and opaque-type data, and provides an optional breakdown of types into target-independent binding ranges specifically to simplify application/engine codebases that adopt type-based modularity.

The Slang toolset does not enforce this approach, and strives to support developers who organize their shader code in other idiomatic ways. However, our experience working with large and complicated renderers architected to take advantage of Slang has shown us that the approach we describe here has many benefits, and we hope that developers will consider it when designing their software architecture.
