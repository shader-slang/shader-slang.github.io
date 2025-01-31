---
layout: post
title: "Now Available: Matrix-vector operations using tensor cores"
date: 2025-01-30 20:00:00 +0000
categories: [ "news" ]
tags: [slang]
author: "Jay Kwak, NVIDIA, and Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/2025-01-30-coop-vec-available.webp
human_date: "January 30, 2025"
---

Just released, the [SPV_NV_cooperative_vector extension](https://github.khronos.org/SPIRV-Registry/extensions/NV/SPV_NV_cooperative_vector.html) in SPIR-V provides a new set of types to SPIR-V, and Slang has added experimental support for these cooperative vectors as well, so that you can make use of these types when targeting SPIR-V. Cooperative vectors enable shaders to do matrix operations utilizing hardware specialized for tensor operations on GPUs where they are available.

A cooperative vector is an opaque vector type. Unlike normal vector types, they can have arbitrary length and support a relatively limited set of operations. These types are intended to help accelerate the evaluation of small neural networks, where each invocation is performing its own independent evaluation of the network. Behind the scenes, the hardware will try to share calculations as much as possible within a given subgroup, which can improve the performance compared to a traditional implementation.Therefore, while using cooperative vectors to perform multiplications with different matrices in a subgroup is supported by this feature, it’s best to reduce the data divergence as much as possible to achieve best performance.

Slang’s support for cooperative vectors is currently an experimental feature. For more details on what you can expect from experimental features, and how they are expected to progress to stable status, please check out our [language change process documentation](https://shader-slang.org/community/language-change-process/).

Cooperative vector is currently available as a vendor extension in SPIR-V (SPV_NV_cooperative_vector), and developers will need a driver that supports this extension in order to use it. Cooperative vectors are permitted in any stage in SPIR-V with this extension. If cooperative vector support is added to other target platforms, they may have different restrictions.

Full documentation of cooperative vector operations in Slang can be found in the [cooperative vector feature proposal](https://github.com/shader-slang/slang/tree/master/docs/proposals/019-cooperative-vector.md)

Code Examples
The following code snippet shows a simple example of how to use cooperative vectors in a Slang compute shader:

```hlsl
// Slang shader with Cooperative Vector support

ByteAddressBuffer inputBuffer1;
ByteAddressBuffer inputBuffer2;
RWStructuredBuffer<int32_t> outputBuffer;

[numthreads(4, 4, 1)]
void computeMain(int threadID : SV_DispatchThreadID)
{
    CoopVec<int32_t,32> lhs = coopVecLoad<32, int32_t>(inputBuffer1);
    CoopVec<int32_t,32> rhs = coopVecLoad<32, int32_t>(inputBuffer2);
    let result = lhs + rhs;

    for(int i = 0; i < result.getCount(); ++i)
        outputBuffer[threadID*32 + i] = result[i];
}
```

This compute shader loads 32 values from a shader parameter, `inputBuffer`, and stores them in a local variable, `result`, whose type is CoopVec<int,32>.

Note that the variable `result` is a vector with 32 elements, which is much longer than a traditional vector, whose size ranges up to 4.

The following code snippet shows another example that performs a matrix multiplication with a cooperative vector:

```hlsl
// Slang shader with Cooperative Vector support

ByteAddressBuffer input; // [1 2 3 4 …]
ByteAddressBuffer matrix; // [1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16]
RWStructuredBuffer<int32_t> outputBuffer;

[numthreads(16, 1, 1)]
void computeMain(int threadID : SV_DispatchThreadID)
{
    CoopVec<int8_t, 4> vec = coopVecLoad<4, int8_t>(input, threadID * 4 * sizeof(float));
    let result = coopVecMatMul<int32_t, 4, 4>(
        vec, // input vector
        CoopVecComponentType::SignedInt8, // vector interpretation
        matrix, // input matrix
        0, // matrix offset in byte
        CoopVecComponentType::SignedInt8, // matrix interpretation
        CoopVecMatrixLayout::RowMajor, // matrix layout
        false, // matrix transpose
        4 // matrix stride
    );

    for(int i = 0; i < result.getCount(); ++i)
        outputBuffer[threadID*4 + i] = result[i]; // [30 70 110 150 …]
}
```
This compute shader loads 4 values and stores them in a cooperative vector variable, `vec`.
The `coopVecMatMul()` function performs matrix multiplication with a given vector and a given matrix.

Note that most cooperative vector functions take "interpretation" parameters. If a target platform doesn't directly support int8 type, the interpretation parameter can allow you to use smaller data types for the calculation.

For more practical examples of Cooperative Vector usage, please see the RTX Neural Shading and RTX Neural Texture Compression (NTC) SDKs that will be released soon within RTX Kit. NTC contains implementations of neural texture decompression using Cooperative Vectors in Slang, as well as fallback implementations of the same using traditional shader math. On recent NVIDIA GPUs, using Cooperative Vectors can provide up to 4x speedup in decompression compared to using DP4a instructions.

