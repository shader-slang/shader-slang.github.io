# Slang

> Slang is a shading language that makes it easier to build and maintain large shader codebases in a modular and extensible fashion, while maintaining the highest possible performance on modern GPUs and graphics APIs.

Slang is a modern shading language and compiler designed for real-time graphics developers working with large-scale, high-performance shader code. It extends HLSL with features from modern programming languages including modules, generics, interfaces, and automatic differentiation for neural graphics applications.

**Key Features:**
- Cross-platform compilation: D3D12, Vulkan, Metal, D3D11, OpenGL, CUDA, CPU
- Automatic differentiation for machine learning and neural graphics  
- Module system for scalable software development and separate compilation
- Generics and interfaces for code specialization without preprocessor hacks
- High compatibility with existing HLSL codebases
- Capability system for managing feature differences across platforms
- Comprehensive tooling support (Language Server, Visual Studio Code, RenderDoc)

**Target Users:** Real-time graphics developers, game engine developers, graphics researchers, machine learning practitioners working with differentiable rendering.

## Detailed Language Features

**Core Language Extensions:**
- **Modules and Import System**: First-class module system enabling separate compilation, logical code organization, and clean dependency management
- **Generics and Interfaces**: Type-safe specialization without preprocessor hacks, similar to Rust/Swift traits with pre-checking to avoid cascading template errors
- **Automatic Differentiation**: Forward and backward derivative generation for neural graphics, machine learning, and optimization applications
- **Capabilities System**: Fine-grained platform feature management ensuring code compatibility across targets before compilation
- **Parameter Blocks**: Efficient grouping of shader parameters by update rate for modern graphics APIs (D3D12 descriptor tables, Vulkan descriptor sets)

**Convenience Features:**
- **Type Inference**: `var` keyword for automatic type deduction from initializers
- **Immutable Values**: `let` keyword for const-correctness and functional programming patterns  
- **Namespaces**: Hierarchical organization with `namespace`, `using` statements, and abbreviated nested syntax
- **Enhanced Control Flow**: Structured control flow with explicit join points for reliable high-level code generation
- **Pointers (Limited)**: Native pointer support when targeting SPIR-V, C++, and CUDA platforms
- **String Literals**: Cross-platform GPU printf implementation and debug output capabilities

**Cross-Platform Compatibility:**
- **HLSL Compatibility**: Most existing HLSL code compiles directly without modification
- **GLSL Interop**: Compatibility module enabling GLSL intrinsic functions and binding syntax
- **Multi-Target Generation**: Single source compiles to HLSL, GLSL, Metal, SPIR-V, CUDA, C++, and WebGPU
- **Readable Output**: Generated code preserves identifier names and structure for debugging

## Comprehensive Examples

**Basic Usage:**
- [Hello World Compute](https://github.com/shader-slang/slang/tree/master/examples/hello-world): Minimal compute shader demonstrating basic Slang usage
- [CPU Hello World](https://github.com/shader-slang/slang/tree/master/examples/cpu-hello-world): CPU compilation and execution example
- [Triangle Rendering](https://github.com/shader-slang/slang/tree/master/examples/triangle): Basic vertex/fragment shader graphics pipeline

**Advanced Language Features:**
- [Shader Objects](https://github.com/shader-slang/slang/tree/master/examples/shader-object): Interface-based shader specialization replacing preprocessor techniques
- [Shader Toy Effects](https://github.com/shader-slang/slang/tree/master/examples/shader-toy): Modular effect system using generics and interfaces
- [Reflection API](https://github.com/shader-slang/slang/tree/master/examples/reflection-api): Runtime shader parameter introspection and binding
- [Parameter Blocks](https://github.com/shader-slang/slang/tree/master/examples/reflection-parameter-blocks): Efficient resource grouping for modern APIs

**Machine Learning and Differentiation:**
- [Autodiff Texture](https://github.com/shader-slang/slang/tree/master/examples/autodiff-texture): Automatic differentiation for texture operations
- [MLP Training](https://github.com/shader-slang/slang/tree/master/examples/mlp-training): Multi-layer perceptron with automatic gradients
- [Cooperative Vector Training](https://github.com/shader-slang/slang/tree/master/examples/mlp-training-coopvec): SIMD-optimized neural network training

**Ray Tracing and Advanced Graphics:**
- [Hardware Ray Tracing](https://github.com/shader-slang/slang/tree/master/examples/ray-tracing): DirectX and Vulkan ray tracing integration
- [Ray Tracing Pipeline](https://github.com/shader-slang/slang/tree/master/examples/ray-tracing-pipeline): Complete RT pipeline with multiple shader stages
- [GPU Printing](https://github.com/shader-slang/slang/tree/master/examples/gpu-printing): Cross-API debug output and printf functionality
- [Model Viewer](https://github.com/shader-slang/slang/tree/master/examples/model-viewer): 3D model rendering with materials and lighting

**Platform-Specific Examples:**
- [WGPU WebAssembly](https://github.com/shader-slang/slang/tree/master/examples/wgpu-slang-wasm): WebGPU compilation for browser execution
- [CUDA Interop](https://github.com/shader-slang/slang/tree/master/examples/cpu-com-example): CUDA C++ generation and host integration
- [Aftermath Integration](https://github.com/shader-slang/slang/tree/master/examples/nv-aftermath-example): NVIDIA Nsight Aftermath GPU crash debugging

## Core Documentation

- [User Guide](https://shader-slang.com/slang/user-guide/): Complete introduction to Slang language features, compilation, and reflection API
- [Language Reference](https://shader-slang.com/slang/language-reference/): Detailed reference for Slang language constructs and syntax
- [Getting Started](https://shader-slang.com/slang/user-guide/get-started): Quick start guide with installation and first shader example
- [Building from Source](https://github.com/shader-slang/slang/blob/master/docs/building.md): Build instructions and dependencies
- [Main Repository](https://github.com/shader-slang/slang): Source code, releases, and issue tracking

## Language Features

- [Modules and Access Control](https://shader-slang.com/slang/user-guide/modules-and-access-control): Module system and separate compilation
- [Interfaces and Generics](https://shader-slang.com/slang/user-guide/interfaces-generics): Type traits and generic programming
- [Automatic Differentiation](https://shader-slang.com/slang/user-guide/autodiff): Forward and backward derivative generation
- [Capabilities System](https://shader-slang.com/slang/user-guide/capabilities): Platform feature management
- [Convenience Features](https://shader-slang.com/slang/user-guide/convenience-features): Syntax improvements over HLSL

## Compilation and Targets

- [Compiling with Slang](https://shader-slang.com/slang/user-guide/compiling): Command-line and API compilation
- [slangc Reference](https://github.com/shader-slang/slang/blob/master/docs/command-line-slangc-reference.md): Complete command-line options
- [Supported Targets](https://shader-slang.com/slang/user-guide/targets): Platform support and capabilities
- [CPU Target Guide](https://github.com/shader-slang/slang/blob/master/docs/cpu-target.md): Compiling to CPU and C++
- [CUDA Target Guide](https://github.com/shader-slang/slang/blob/master/docs/cuda-target.md): CUDA compilation and interop
- [Target Compatibility](https://github.com/shader-slang/slang/blob/master/docs/target-compatibility.md): Feature compatibility matrix

## Examples and Tutorials

- [Hello World Example](https://shader-slang.com/slang/user-guide/get-started#your-first-slang-shader): Basic compute shader
- [Shader Toy Example](https://github.com/shader-slang/slang/tree/master/examples/shader-toy): Modular effects using interfaces
- [Autodiff Texture Example](https://github.com/shader-slang/slang/tree/master/examples/autodiff-texture): Automatic differentiation demo
- [Ray Tracing Examples](https://github.com/shader-slang/slang/tree/master/examples/ray-tracing): Hardware ray tracing support
- [All Examples Directory](https://github.com/shader-slang/slang/tree/master/examples): Complete example collection

## API and Reflection

- [Reflection API](https://shader-slang.com/slang/user-guide/reflection): Querying shader parameters and layout
- [Standard Library Reference](https://shader-slang.com/stdlib-reference/): Built-in types and functions documentation
- [C++ API Headers](https://github.com/shader-slang/slang/tree/master/include): Public API interface
- [Link-time Specialization](https://shader-slang.com/slang/user-guide/link-time-specialization): Runtime code generation

## Development and Contributing

- [Design Overview](https://github.com/shader-slang/slang/blob/master/docs/design/overview.md): Compiler architecture and design
- [Coding Conventions](https://github.com/shader-slang/slang/blob/master/docs/design/coding-conventions.md): Code style guidelines
- [IR Design](https://github.com/shader-slang/slang/blob/master/docs/design/ir.md): Intermediate representation details
- [Build System](https://github.com/shader-slang/slang/blob/master/docs/building.md): CMake configuration and build process

## Optional

- [FAQ](https://github.com/shader-slang/slang/blob/master/docs/faq.md): Frequently asked questions
- [Release Downloads](https://github.com/shader-slang/slang/releases): Binary packages for all platforms
- [Playground](https://shader-slang.com/slang-playground): Online compiler and editor
- [SlangPy Python Bindings](https://shader-slang.com/slang/user-guide/a1-02-slangpy): Python integration for machine learning 