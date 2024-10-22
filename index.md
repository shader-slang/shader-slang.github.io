<div id="banner">
<div id="bannerLeft">
    <span id="bannerText">
    Slang is a GPU-first language with modern features for modular, extensible, and high-performance programming.
    </span>
    <div id="mainPageBanerNav">
    <a class="mainPageBtn" href="/slang-playground" title="Try slang directly in your browser."><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-terminal" viewBox="0 0 16 16">
  <path d="M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9M3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708z"/>
  <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
</svg> Try</a>
    <a class="mainPageBtn" href="https://github.com/shader-slang/slang/releases/latest" title="Download latest prebuilt release."><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
        </svg> Download</a>
    <a class="mainPageBtn" href="https://github.com/shader-slang/slang" title="Slang GitHub Repository"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
</svg></a>
    </div>
</div>
<img id="bannerCode" src="/assets/slang-example-code.gif"/>
</div>

# Why Slang?

The Slang system is designed to provide developers of real-time graphics applications with the services they need when working with large-scale and high-performance shader code.

* The Slang compiler can generate code for a wide variety of targets and APIs: D3D12, Vulkan, Metal, D3D11, OpenGL, CUDA, and CPU. Slang code can be broadly portable, but still take advantage of the unique features of each platform. For textual targets such as Metal Shading Language(MSL) and CUDA, Slang generates readable code that preserves the original identifier names and the type + call structure for ease of debugging.

* [Automatic differentiation](https://shader-slang.com/slang/user-guide/autodiff.html) as a first-class language feature. Slang can automatically generate both forward and backward derivative propagation code for complex functions that involve arbitrary control flow and dynamic dispatch. This allows users to easily make existing rendering codebases differentiable, or to use Slang as the kernel language in a PyTorch driven machine learning framework via [`slangtorch`](https://shader-slang.com/slang/user-guide/a1-02-slangpy.html).

* Generics and interfaces allow shader specialization to be expressed cleanly without resorting to preprocessor techniques or string-pasting. Unlike C++ templates, Slang's generics are checked ahead of time and don't produce cascading error messages that are difficult to diagnose. The same generic shader can be specialized for a variety of different types to produce specialized code ahead of time, or on the fly, completely under application control.

* Slang provides a module system that can be used to logically organize code and benefit from separate compilation. Slang modules can be compiled offline to a custom IR (with optional obfuscation) and then linked at runtime to generate DXIL, SPIR-V etc.

* Parameter blocks (exposed as `ParameterBlock<T>`) provide a first-class language feature for grouping related shader parameters and specifying that they should be passed to the GPU as a coherent block. Parameter blocks make it easy for applications to use the most efficient parameter-binding model of each API, such as descriptor tables/sets in D3D12/Vulkan.

* Rather than require tedious explicit `register` and `layout` specifications on each shader parameter, Slang supports completely automate and deterministic assignment of binding locations to parameter. You can write simple and clean code and still get the deterministic layout your application wants.

* For applications that want it, Slang provides full reflection information about the parameters of your shader code, with a consistent API across all target platforms and graphics APIs. Unlike some other compilers, Slang does not reorder or drop shader parameters based on how they are used, so you can always see the full picture.

* Slang is backwards-compatible with most existing HLSL code. It is possible to start taking advantage of Slang's benefits without rewriting or porting your shader codebase.

* Full intellisense features in Visual Studio Code and Visual Studio through the Language Server Protocol.

* Full debugging experience with SPIRV and RenderDoc.