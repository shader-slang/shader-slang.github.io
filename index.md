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

## Write Cross Platform Shaders
<img class="fullwidthImage" style="max-width:600px" src="/assets/cross-platform.jpg"/>

The Slang compiler can generate code for a wide variety of targets and APIs: D3D12, Vulkan, Metal, D3D11, OpenGL, CUDA, and CPU. Slang code can be broadly portable, but still take advantage of the unique features of each platform. For textual targets such as Metal Shading Language(MSL) and CUDA, Slang generates readable code that preserves the original identifier names and the type + call structure for ease of debugging.

## Access Latest GPU Feature
<img class="fullwidthImage" style="max-width:800px" src="/assets/latest-feature.jpg"/>

Being cross-platform does not need to mean reducing to accessible GPU feature set to the least common denominator of all platforms.
Slang exposes latest features in Direct3D and Vulkan, and provides a capability system to allow application code to manage the feature set differences on different platforms.
For example, Slang allows you to use [pointers](/slang/user-guide/convenience-features.html#pointers-limited) when generating SPIRV.
In addition, Slang provides [flexible interop](/slang/user-guide/a1-04-interop.html) features to allow you to directly embed target code or SPIRV in your shaders.

## Automatic Differentiation
<img class="fullwidthImage" style="max-width:800px" src="/assets/autodiff.jpg"/>

Slang can [automatically generate both forward and backward derivative propagation code](/slang/user-guide/autodiff.html) for complex functions that involve arbitrary control flow and dynamic dispatch. This allows users to easily make existing rendering codebases differentiable, or to use Slang as the kernel language in a PyTorch driven machine learning framework via [`slangtorch`](/slang/user-guide/a1-02-slangpy.html).

## Module System
<img class="fullwidthImage" style="max-width:900px" src="/assets/modules-1.jpg"/>

Slang provides a [module system](/slang/user-guide/modules.html) that can be used to logically organize code and benefit from separate compilation. Slang modules can be compiled offline to a custom IR (with optional obfuscation) and then linked at runtime to generate DXIL, SPIR-V etc.

## Code Specialization that Works with Modules

Slang supports [generics and interfaces](/slang/user-guide/interfaces-generics.html) (a.k.a. type traits/protocols) to allow clear expression of shader specialization without resorting to preprocessor techniques or string-pasting. Unlike C++ templates, Slang's generics are checked ahead of time and don't produce cascading error messages that are difficult to diagnose. The same generic shader can be specialized for a variety of different types to produce specialized code ahead of time, or on the fly, completely under application control.

## Easy On-ramp from HLSL and GLSL

Slang's syntax is similar to HLSL and most existing HLSL code can be compiled with the Slang compiler out-of-the-box, or with minor modifications. It is possible to start taking advantage of Slang's benefits without rewriting or porting your shader codebase.

In addition, Slang offers a compatbility module that allows you to use most GLSL intrinsic functions and parameter binding syntax.

## Comprehensive Tooling Support
<img class="fullwidthImage" style="max-width:700px" src="/assets/tooling-support.jpg"/>

Slang has full intellisense features in Visual Studio Code and Visual Studio through the Language Server Protocol.
Full debugging experience is also available with SPIRV and RenderDoc.