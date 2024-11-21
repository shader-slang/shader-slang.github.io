---
layout: post
title: "There’s a lot going on with Slang!"
date: 2024-11-20 10:00:00
categories: [ "blog" ]
tags: [slang]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/2024-11-slang-blog-falcor-tiger.webp
---

If you’ve been following Slang developments, you’ve probably noticed a lot of changes happening recently! We’ve been hard at work, and we’re excited to share the latest updates with the Slang community. 

### Slang: Now a Khronos Open-Source Project!

Probably the most noticeable change around here is the new look and feel of the website, which reflects a big move for the Slang project: we have just finished migrating the Slang open source project to Khronos, the industry consortium dedicated to building an open ecosystem of acceleration standards, formats and open source. 

With Slang now hosted at Khronos, it’s no longer tied to any single company, fostering even broader community and industry collaboration. We’ve opened up Slang’s development and decision-making processes, added new documentation on [community and developer practices](https://shader-slang.com/community/), and launched a [Slang Discord](https://discord.gg/cf2bWwct) for ongoing technical conversations. Slang participation is open to everyone, and it’s now easier than ever to get involved—whether as a Slang contributor, committer, or code owner!

But there’s a lot more than just license and governance changes going on—we’ve introduced many new features in the last few months. Here is a detailed look at the recent advancements, all available in the [v2024.14.5 release](https://github.com/shader-slang/slang/releases/tag/v2024.14.5):

### Metal Support

One of the biggest enhancements in recent months is [support for Apple's Metal shading language](https://shader-slang.com/slang/user-guide/metal-target-specific) as a backend target. This opens up new possibilities for developers targeting iOS and macOS platforms, bringing the power of Slang shaders to even more applications and games. Slang’s Metal support includes vertex, fragment, compute, mesh, and amplification shaders.

### WebGPU Support

But Metal Shading Language is not the only new backend, Slang can now also [compile to WGSL](https://shader-slang.com/slang/user-guide/wgsl-target-specific) for WebGPU! WebGPU is the latest graphics API for the web, providing high-performance and flexible access to GPU capabilities. With Slang's new WebGPU support, developers can now compile and run Slang shaders directly in the browser,making it easier than ever to create immersive and interactive web experiences.

### Live Playground

To make it easier for developers to experiment with and learn Slang, we have launched a [live playground](http://try.shader-slang.com). This online tool allows you to compile Slang shaders to various targets, including GLSL, HLSL, MSL, and WGSL, and run them directly in your browser. 

The live playground runs the full Slang compiler as a WebAssembly module, compressed to just 5MB! This allows all shader compilations to run locally in the browser, with no data sent to the cloud. When WebGPU is available in the browser, the playground can execute Slang code by cross-compiling it to WGSL.

<img src="/images/posts/2024-11-slang-blog-live-playground.webp" alt="" class="img-fluid">
The live playground provides an interactive and user-friendly environment where you can test and refine your shaders in real-time– including leveraging the integrated language server support. Whether you are a seasoned developer or just starting out, the live playground is a valuable resource for exploring the capabilities of Slang.

### Focus on Auto-Diff Performance

The recent release of a [Slang implementation of the original Gaussian Splatting rasterizer](https://github.com/google/slang-gaussian-rasterization) has given us the opportunity to scrutinize and improve the performance of Slang’s automatic differentiation, with the end result that we have achieved performance parity between Slang’s auto-diff code and the hand-written CUDA implementation, showing the potential to easily create high performance neural shaders..

<img src="/images/posts/2024-11-slang-blog-falcor-tiger.webp" alt="" class="img-fluid">
NVIDIA Falcor research rendering framework using Slang

### Atomic&lt;T&gt;

Atomic operations are implemented differently across different shading languages. While HLSL allows atomic operations on arbitrary types, Metal Shading Language (MSL) and WGSL restrict them to be used only on atomic types. In order to be able to use atomics across all supported backends, Slang has added the Atomic<T> type, allowing developers to use atomics directly in Slang and have them be translated cleanly into the relevant target languages.

### New Type-System Features

We have further expanded Slang’s type system to support [where clauses](https://shader-slang.com/slang/user-guide/interfaces-generics.html#generics),  [variadic generics](https://shader-slang.com/slang/user-guide/interfaces-generics.html#variadic-generics), [Tuple types](https://shader-slang.com/slang/user-guide/convenience-features.html#tuple-types), [IFunc interfaces](https://github.com/shader-slang/slang/blob/master/docs/proposals/009-ifunc.md), and [extensions on generic types](https://shader-slang.com/slang/user-guide/interfaces-generics.html#extensions-to-interfaces). These additions make it easier to implement more advanced shader architectures using Slang, with code that is much easier to maintain than preprocessor macro expansion or external code generation (meta-programming) logic.

### Unicode support
Not everyone writes ASCII-only code, and so Slang now accepts Unicode, including in identifier names.

### Improved Documentation and Sample Material

We understand the importance of comprehensive documentation and high-quality sample material in helping developers get the most out of Slang, so we’ve been expanding and improving the [Slang Developer Documentation Suite](https://shader-slang.com/docs/), adding samples and reference material. Please let us know where you’d like to see more! 

### Join Us!

We invite you to join us on Slang’s ongoing journey to push the boundaries of shading language power. Whether you are a developer utilizing Slang in your projects, a contributor helping to shape its future, or simply an enthusiast following our progress, your support and engagement are invaluable to us.

Stay tuned for more updates, and be sure to explore the new features and resources we have introduced. Together, let's unlock the full potential of Slang and create amazing graphics experiences across diverse platforms.

Thank you for being a part of the Slang community!
