# Tools

## Slang Release

[Download latest release here.](https://github.com/shader-slang/slang/releases/latest)

Binary packages are currently available for:

* Windows 64-bit x86-64, arm64
* Ubuntu Linux 64-bit x86-64, arm64
* MacOS x86-64, Apple Silicon

Binary releases include the command-line compiler `slangc`, a shared library for the compiler, and the header files necessary for interacting with that library.

Slang is also distributed with the [Vulkan SDK](https://www.lunarg.com/vulkan-sdk/).

## Editor Extensions

<img src="assets/auto-complete.gif"/>

Looking for intellisense support for writing Slang code?
We provide a [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=shader-slang.slang-language-extension)
and [Visual Studio extension](https://marketplace.visualstudio.com/items?itemName=shader-slang.slang-vs-extension) that provide full intellisense experience
within these IDEs, including code completion, semantic highlighting, function signature help, go to definition and more.

## Debugging

When generating SPIRV, Slang supports the Non-Semantic Debug Info extended SPIR-V instruction set that works with [RenderDoc](https://renderdoc.org/) and NVIDIA NSight for shader debugging and profiling on Vulkan.