---
layout: post
title: "There's a lot going on with Slang!"
date: 2024-11-04 01:00:00 +0000
categories: [ "blog" ]
tags: [slang]
author: "Shannon Woods, NVIDIA and Slang Working Group Chair"
image: /images/posts/2024-12-blog-a-lot-going-on.webp
---

If you’ve been following Slang along its journey, you’ve probably noticed a lot of changes going on recently! We’ve been hard at work on a bunch of things, and we’re excited to share it with the community. Here is a detailed look at the recent advancements:

### Metal Support

One of the bigger enhancements in recent months is the addition of support for Metal. This support opens up new possibilities for developers looking to target iOS and macOS platforms, bringing the power of Slang shaders to even more applications and games. Slang’s Metal support includes vertex, fragment, compute, mesh, and amplification shaders.

### WebGPU Support

In our ongoing efforts to stay at the cutting edge of graphics technology, we are proud to introduce WebGPU support. WebGPU is a next-generation graphics API for the web, designed to provide high-performance and flexible access to GPU capabilities. With Slang's new WebGPU support, developers can now compile and run Slang shaders directly in web browsers, taking full advantage of the latest advancements in web graphics. This integration makes it easier than ever to create immersive and interactive web experiences.

### Live Playground
To make it even easier for developers to experiment with and learn Slang, we have launched a live playground. This online tool allows you to compile Slang shaders to various targets, including GLSL, HLSL, Metal, and WGSL, and run them directly in your browser. The live playground provides an interactive and user-friendly environment where you can test and refine your shaders in real-time– including leveraging the integrated language server support. Whether you are a seasoned developer or just starting out, the live playground is a valuable resource for exploring the capabilities of Slang.

The live playground runs the full Slang compiler as a Web Assembly module, which is compressed down to just 5MB! This means that all shader compilations are done locally in the client browser, and no data will be sent to any servers. When WebGPU is available from the browser, the playground can also run the Slang code by cross-compiling to WGSL.

This means that all shader compilations are done locally in the client browser, and no data will be sent to any servers. When WebGPU is available from the browser, the playground can also run the Slang code by cross-compiling to WGSL.

### Focus on Auto-Diff Performance

The recent release of a Slang implementation of the Gaussian Splatting rasterizer has given us the opportunity to scrutinize and improve the performance of Slang’s automatic differentiation, with the end result that we have achieved performance parity between Slang’s auto-diff code and the hand-written CUDA implementation.

### atomic&lt;T&gt;

Atomic operations are implemented differently across different shading languages. While HLSL allows atomic operations on arbitrary types, Metal and WGSL restrict them to be used only on atomic types. In order to be able to use atomics across all supported backends, Slang has added the atomic<T> type, allowing developers to use atomics directly in Slang and have them be translated cleanly into the relevant target languages.

### New Type-System Features

We further expanded Slang’s type system to support where clauses, variadic generics, Tuple types, IFunc interfaces, and extensions on generic types. These additions enable more advanced shader architectures to be implemented as first-class Slang code that are much easier to maintain than preprocessor macro expansion or external code generation (meta-programming) logic.

### Unicode support

Not everyone writes ASCII-only code, and so Slang now accepts Unicode, including in identifier names.

### Improved Documentation and Sample Material

We understand the importance of comprehensive documentation and high-quality sample material in helping developers get the most out of Slang. Our team has made significant strides in improving and expanding our documentation. 

### The Future of Slang: An Open Standard at Khronos

As we look to the future, we are excited to announce a major move for the Slang project. Slang is migrating to live as an open standard at Khronos, the industry consortium dedicated to creating open standards for 3D graphics, XR (VR & AR), parallel computing, machine learning, vision processing and the metaverse. This transition will enable industry-wide collaboration, fostering a more unified and interoperable graphics ecosystem. By becoming an open standard, Slang will benefit from the collective expertise and contributions of the broader developer community, driving innovation and ensuring its continued evolution and relevance.

### Join Us on This Exciting Journey

We invite you to join us on this exciting journey as we continue to push the boundaries of what is possible with Slang. Whether you are a developer utilizing Slang in your projects, a contributor helping to shape its future, or simply an enthusiast following our progress, your support and engagement are invaluable to us.

Additionally, we are excited to announce that we now have a Discord channel where you can join and participate in Slang development, or ask questions of the developers.

Stay tuned for more updates, and be sure to explore the new features and resources we have introduced. Together, let's unlock the full potential of Slang and create amazing graphics experiences across platforms.

Thank you for being a part of the Slang community.
