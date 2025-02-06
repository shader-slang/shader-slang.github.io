---
title: The Slang Shading Language
layout: home
description: Empowering real-time graphics developers with advanced language features.
---


<div class="container">
    <div class="section">
        <div class="row">
            <h3>Why Slang?
                <hr>
            </h3>
            <div class="col-12">
                <p>Discover the continuously evolving benefits of Slang.</p>
                <div class="grid gridSlang">
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Proven</h4>
                        Slang is an open-source shading language compiler leveraged by industry-leading organizations on
                        real-world,
                        production projects and codebases.
                    </div>

                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Open and Accessible</h4>
                        Slang moving from NVIDIA to Khronos Group hosted multi-vendor governance encourages deeper
                        collaboration with
                        the open-source community and wider ecosystem adoption.
                    </div>

                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Flexible</h4>
                        Slang is a fast-moving language designed specifically to meet the evolving needs of real-time
                        rendering
                        applications, including the leveraging of neural graphics techniques.
                    </div>

                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Productive</h4>
                        Slang streamlines the development and maintenance of large, complex shader codebases, with a
                        proactive vision
                        for shader language evolution. The Slang compiler also provides onramps for existing HLSL and
                        GLSL
                        codebases.
                    </div>

                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Portable</h4>
                        Slang supports multiple backends, enabling shader code to be written once to run almost
                        anywhere.
                    </div>

                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Performant</h4>
                        Slang's modular compilation support drives down overall compile times, delivering more reusable
                        modules and
                        dynamic shader linking.
                    </div>
                </div>
            </div>
        </div>


        <div class="section pt-4">
            <div class="row">
                <h3>Write Shaders Once, Run Anywhere
                    <hr>
                </h3>
                <div class="col-sm-5">
                    <p>
                        The Slang compiler can generate code for a wide variety of targets: D3D12, Vulkan, Metal, D3D11,
                        OpenGL, CUDA, WebGPU and even generate code to run on a CPU. For textual targets, such as Metal Shading
                        Language (MSL) and CUDA, Slang produces readable code that preserves original identifier names, as
                        well as the type and call structure, making it easier to debug.
                    </p>
                </div>

                <div class="col-sm-7">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/write-once.webp" />
                </div>
            </div>
        </div>

        <div class="section">
            <div class="row">
                <h3>Access the Latest GPU Features
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/latest-feature.webp" />

                </div>

                <div class="col-sm-6">
                    <p>
                        Slang code is highly portable, but can still leverage unique platform capabilities, including the
                        latest
                        features in
                        Direct3D and Vulkan. For example, developers can make full use of
                        <a href="/slang/user-guide/convenience-features.html#pointers-limited">pointers</a> when generating
                        SPIR-V.
                        Slang's <a href="/slang/user-guide/capabilities.html">capability system</a> helps applications
                        manage
                        feature
                        set differences
                        across target platforms by ensuring code only uses available features during the type-checking step,
                        before
                        generating
                        final code. Additionally, Slang provides <a href="/slang/user-guide/a1-04-interop.html">flexible
                            interop</a>
                        features to enable
                        directly embedding target code or SPIR-V into generated shaders.
                    </p>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="row">
                <h3>Leverage Neural Graphics with Automatic Differentiation
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/autodiff.jpg" />

                </div>

                <div class="col-sm-6">
                    <p>Slang can automatically generate both forward and backward derivative propagation code for
                        complex functions that involve arbitrary control flow and dynamic dispatch. This allows existing
                        rendering codebases to easily become differentiable, enabling adoption of neural components, or integration into a training process.</p>
                    <a class="btn btn-primary" href="/slang/user-guide/autodiff.html">Automatic Differentiation</a>
                </div>
            </div>
        </div>
        <div class="section">
            <div class="row">
                <h3>Seamless Integration with Python
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/slangpy.jpg" />
                </div>
                 <div class="col-sm-6">
                    <p>Slang code can be integrated directly into your Python/PyTorch training loop with SlangPy. You can implement complex control-divergent algorithms, sparse data structures, make use of advanced GPU features in Slang, and call your Slang code from Python without any boilerplate with the SlangPy package.</p>
                    <a class="btn btn-primary" href="https://slangpy.shader-slang.org">SlangPy</a>
                </div>
            </div>
        </div> 
        <div class="section">
            <div class="row">
                <h3>Scalable Software Development with Modules
                    <hr>
                </h3>
                <div class="col-12">
                    <img class="img-fluid" src="/images/modules-1.jpg" />

                </div>

                <div class="col-12">
                    <p>Slang provides a <a href="/slang/user-guide/modules.html">module system</a> that enables logical
                        organization of code for separate compilation. Slang modules can be independently compiled
                        offline to a custom IR (with optional obfuscation) and then linked at runtime to generate code
                        in formats such as DXIL or SPIR-V.</p>
                    <a class="btn btn-primary" href="/slang/user-guide/modules.html">Module system</a>

                </div>
            </div>
        </div>

        <div class="section">
            <div class="row">
                <h3>Code Specialization that Works with Modules
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/generics.jpg" />

                </div>

                <div class="col-sm-6">
                    <p>Slang supports <a href="/slang/user-guide/interfaces-generics.html">generics and interfaces</a>
                        (a.k.a. type traits/protocols), allowing for clear expression of shader specialization without
                        the need for preprocessor techniques or string-pasting. Unlike C++ templates, Slang’s generics
                        are pre-checked and don’t produce cascading error messages that are difficult to diagnose. The
                        same generic shader can be specialized for a variety of different types to produce specialized
                        code ahead of time, or on the fly, entirely under application control.</p>
                    <a class="btn btn-primary" href="/slang/user-guide/interfaces-generics.html">Generics and Interfaces</a>

                </div>
            </div>
        </div>

        <div class="section">
            <div class="row">
                <h3>Easy On-ramp for HLSL and GLSL Codebases
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/hlsl-compatibility.jpg" />

                </div>

                <div class="col-sm-6">
                    <p>Slang’s syntax is similar to HLSL, and most existing HLSL code can be compiled with the Slang
                        compiler out-of-the-box, or with just minor modifications. This allows existing shader codebases
                        to immediately benefit from Slang without requiring a complete rewrite or port.
                        Slang provides a compatibility module that enables the use of most GLSL intrinsic functions and
                        GLSL’s parameter binding syntax.</p>
                    <a class="btn btn-primary" href="/docs/coming-from-hlsl/">Port from HLSL</a>

                </div>
            </div>
        </div>

        <div class="section">
            <div class="row">
                <h3>Comprehensive Tooling Support
                    <hr>
                </h3>
                <div class="col-sm-6">
                    <img class="img-fluid" src="{{ site.url }}{{ site.baseurl }}/images/tooling-support.webp" />

                </div>

                <div class="col-sm-6">
                    <p>Slang comes with full support of IntelliSense editing features in Visual Studio Code and Visual
                        Studio through the Language Server Protocol. Full debugging capabilities are also available
                        through RenderDoc and SPIR-V based tools.</p>
                    <a class="btn btn-primary" href="/tools">Tools</a>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="container">
    <div class="section">
        <div class="row">
            <h3>Open Governance
                <hr>
            </h3>
            <div class="col-sm-12">
                <p>Slang is now hosted as a <a href="https://www.khronos.org/">Khronos Group</a> open-source project,
                    fostering industry-wide collaboration to propel its ongoing growth
                    and evolution. While Slang has been available as open source for a while, establishing multi-company
                    governance is
                    essential to build industry trust by ensuring that Slang remains independent and not controlled by,
                    or dependent on,
                    single entity. This trust empowers the graphics industry to collaboratively invest in and depend on
                    Slang for
                    business-critical applications.
                </p>
            </div>
        </div>
    </div>
</div>