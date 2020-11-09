---
title: The Slang Programming Language
description: null
---

Slang is a language for real-time graphics programming that extends HLSL with new capabilities for modular, extensible, and high-peformance programming.

# Why Slang?

Real-time graphics developers need tools that help them achieve the highest posible performance on a variety of hardware platforms and GPU APIs while also managing the complexity of large and evolving GPU codebases. Slang has been designed and implemented based on these needs:

* Compatibility: The Slang language is backwards compatible with most existing HLSL, so you don't need to rewrite your code. The Slang compiler can generate code for D3D12, Vulkan, D3D11, CUDA, and CPU, with more targets on the way.

* Modular and Extensible Graphics Code: The extensions that Slang adds to HLSL support cleaner and more modular shader code, allowing developers to confidently scale up their codebases to support ray tracing and other new real-time graphics techniques.

* Performance: Slang is first and foremost a GPU language, and its new features have been carefully implemented so that they do not compromise on the runtime performance of generated code.

If you want to read more about the unique features of Slang, you can do so [here](features.md).

# Getting Started

If you'd like to give Slang a try, please read our guide on how to [get started](getting-started.md).

# Contributing

The Slang project is developed as open-source software [on GitHub](https://github.com/shader-slang/slang).
Issues and pull requests from individuals and organizations are welcome.

# License

The code of the Slang project is [available](https://github.com/shader-slang/slang/blob/master/LICENSE) under the MIT license.

By default, the Slang project is compiled to use the [glslang](https://github.com/KhronosGroup/glslang) project, which is distributed under a BSD license.
