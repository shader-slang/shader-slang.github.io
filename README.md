Slang is a language for real-time graphics programming that extends HLSL with new capabilities for modular, extensible, and high-performance programming.

# Why Slang?

Real-time graphics developers need tools that help them achieve the highest possible performance on a variety of hardware platforms and GPU APIs while also managing the complexity of large and evolving GPU codebases. Slang has been designed and implemented based on these needs:

* Compatibility: The Slang language is backwards compatible with most existing HLSL, so you don't need to rewrite your code. The Slang compiler can generate code for D3D12, Vulkan, D3D11, CUDA, and CPU, with more targets on the way.

* Modular and Extensible Graphics Code: The extensions that Slang adds to HLSL support cleaner and more modular shader code, allowing developers to confidently scale up their codebases to support ray tracing and other new real-time graphics techniques.

* Performance: Slang is first and foremost a GPU language, and its new features have been carefully implemented so that they do not compromise on the runtime performance of generated code.

* Automatic Differentiation: Slang supports automatic differentiation as a first-class language feature. This enables developers to seemlessly integrate gradient-based learning techniques into their rendering systems, or to use graphics components in a machine learning framework via [slangpy](https://shader-slang.com/slang/user-guide/a1-02-slangpy.html). Slang supports differentiating arbitrary control flow, user-defined types, dynamic dispatch, generics, and global memory accesses. With Slang, existing real-time renderers written using Slang or plain HLSL can be made differentiable and learnable without major source code changes. 

If you want to read more about the unique features of Slang, you can do so [here](features.md).

# Getting Started

If you'd like to give Slang a try, please read our guide on how to [get started](getting-started.md). Check out the [Slang User's Guide](https://shader-slang.com/slang/user-guide/index.html) to learn more about the language features, and [Slang Standard Library Reference](https://shader-slang.com/stdlib-reference) for detailed documentation on Slang's builtin types and functions available for use in your shader code.

We also provide a [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=shader-slang.slang-language-extension) for complete intellisense experience.

# Contributing

The Slang project is developed as open-source software [on GitHub](https://github.com/shader-slang/slang).
Issues and pull requests from individuals and organizations are welcome.

# License

The code of the Slang project is [available](https://github.com/shader-slang/slang/blob/master/LICENSE) under the MIT license.

By default, the Slang project is compiled to use the [glslang](https://github.com/KhronosGroup/glslang) project, which is distributed under a BSD license.
