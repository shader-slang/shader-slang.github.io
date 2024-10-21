<div id="banner">
<span id="bannerText">
Slang is a GPU-first language with modern features for modular, extensible, and high-performance programming.
</span>
<img id="bannerCode" src="/assets/slang-example-code.gif"/>
</div>

# Why Slang?

The Slang system is designed to provide developers of real-time graphics applications with the services they need when working with large-scale and high-performance shader code.

* The Slang compiler can generate code for a wide variety of targets and APIs: D3D12, Vulkan, Metal, D3D11, OpenGL, CUDA, and CPU. Slang code can be broadly portable, but still take advantage of the unique features of each platform. For textual targets such as Metal Shading Language(MSL) and CUDA, Slang generates readable code that preserves the original identifier names and the type + call structure for ease of debugging.

* [Automatic differentiation](https://shader-slang.com/slang/user-guide/autodiff.html) as a first-class language feature. Slang can automatically generate both forward and backward derivative propagation code for complex functions that involve arbitrary control flow and dynamic dispatch. This allows users to easily make existing rendering codebases differentiable, or to use Slang as the kernel language in a PyTorch driven machine learning framework via [`slangtorch`](https://shader-slang.com/slang/user-guide/a1-02-slangpy.html).

* Generics and interfaces allow shader specialization to be expressed cleanly without resort to preprocessor techniques or string-pasting. Unlike C++ templates, Slang's generics are checked ahead of time and don't produce cascading error messages that are difficult to diagnose. The same generic shader can be specialized for a variety of different types to produce specialized code ahead of time, or on the fly, completely under application control.

* Slang provides a module system that can be used to logically organize code and benefit from separate compilation. Slang modules can be compiled offline to a custom IR (with optional obfuscation) and then linked at runtime to generate DXIL, SPIR-V etc.

* Parameter blocks (exposed as `ParameterBlock<T>`) provide a first-class language feature for grouping related shader parameters and specifying that they should be passed to the GPU as a coherent block. Parameter blocks make it easy for applications to use the most efficient parameter-binding model of each API, such as descriptor tables/sets in D3D12/Vulkan.

* Rather than require tedious explicit `register` and `layout` specifications on each shader parameter, Slang supports completely automate and deterministic assignment of binding locations to parameter. You can write simple and clean code and still get the deterministic layout your application wants.

* For applications that want it, Slang provides full reflection information about the parameters of your shader code, with a consistent API across all target platforms and graphics APIs. Unlike some other compilers, Slang does not reorder or drop shader parameters based on how they are used, so you can always see the full picture.

* Slang is backwards-compatible with most existing HLSL code. It is possible to start taking advantage of Slang's benefits without rewriting or porting your shader codebase.

* Full intellisense features in Visual Studio Code and Visual Studio through the Language Server Protocol.

* Full debugging experience with SPIRV and RenderDoc.