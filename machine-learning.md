---
title: Machine Learning with Slang
layout: page
description: Leverage Slang's powerful features for machine learning and neural graphics applications
---

# Machine Learning with Slang

Slang is a modern shader language and compiler that extends traditional graphics programming with powerful machine learning capabilities. Building on its foundation as a high-performance shading language for real-time graphics, Slang integrates features like automatic differentiation and interoperability with Python-based ML training frameworks like PyTorch, allowing you to incorporate custom GPU operations directly into neural network training workflows.

<div class="container">
    <div class="section">
        <div class="row">
            <h3>Automatic Differentiation for Neural Graphics
                <hr>
            </h3>
            <div class="col-sm-6">
                <img class="img-fluid" src="{{ site.baseurl }}/images/autodiff.jpg" />
            </div>
            <div class="col-sm-6">
                <p>Slang provides built-in automatic differentiation capabilities that can transform complex shader code into differentiable functions. This allows you to:</p>
                <ul>
                    <li>Generate both forward and backward derivative propagation code automatically</li>
                    <li>Support arbitrary control flow and dynamic dispatch in differentiable code</li>
                    <li>Make existing rendering codebases differentiable with minimal changes</li>
                    <li>Integrate neural components into traditional rendering pipelines</li>
                    <li>Incorporate your graphics code into machine learning training processes</li>
                </ul>
                <p>Whether you're implementing gradient-based optimization, neural rendering, or differentiable simulation, Slang's autodiff capabilities provide the foundation you need.</p>
                <a class="btn btn-primary" href="https://docs.shader-slang.org/en/latest/external/slang/docs/user-guide/07-autodiff.html">Learn more about Automatic Differentiation</a>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="row">
            <h3>SlangPy: Seamless Integration with Python-based ML Frameworks
                <hr>
            </h3>
            <div class="col-sm-6">
                <img class="img-fluid" src="{{ site.baseurl }}/images/slangpy.jpg" />
            </div>
            <div class="col-sm-6">
                <p>SlangPy enables direct integration of Slang code into Python-based ML training frameworks like PyTorch, bridging the gap between high-performance GPU programming and machine learning workflows. With SlangPy, you can:</p>
                <ul>
                    <li>Call Slang code directly from Python ML training loops without boilerplate</li>
                    <li>Integrate custom GPU operations into PyTorch and other Python ML frameworks</li>
                    <li>Implement complex algorithms not easily expressed in standard Python ML libraries</li>
                    <li>Create efficient sparse data structures optimized for ML training workloads</li>
                    <li>Leverage GPU hardware features from within Python-based training pipelines</li>
                    <li>Utilize rasterization and ray-tracing techniques within ML workflows</li>
                    <li>Integrate Slang code into the training loop with zero boilerplate or C++ required</li>
                </ul>
                <p>SlangPy makes it easy to extend your Python-based machine learning workflows with custom GPU code when you need performance and flexibility beyond what standard frameworks provide.</p>
                <a class="btn btn-primary" href="https://docs.shader-slang.org/en/latest/external/slangpy/docs/">Explore SlangPy</a>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="row">
            <h3>Slang Machine Learning Development
                <hr>
            </h3>
            <div class="col-12">
                <p>Slang provides a complete workflow for machine-learning-enchanced graphics development that leverages its shader language foundation:</p>
                <div class="grid gridSlang">
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Develop Shaders</h4>
                        <p>Write high-performance shader code in Slang, leveraging familiar HLSL-like syntax and advanced shader language features like generics and interfaces.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Differentiate</h4>
                        <p>Use automatic differentiation to transform your shaders into differentiable code for training neural networks or optimization algorithms.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Integrate</h4>
                        <p>Connect your Slang code to Python-based ML training frameworks like PyTorch, enabling custom GPU operations within training loops.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Deploy</h4>
                        <p>Compile your shaders to multiple backend targets (CUDA, HLSL, SPIR-V, etc.) for cross-platform deployment in both graphics and ML contexts.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Optimize</h4>
                        <p>Take advantage of Slang's shader module system and compilation model to minimize compile times and maximize runtime performance.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Iterate</h4>
                        <p>Use comprehensive shader tooling support for faster development cycles and easier debugging in both graphics and ML contexts.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="row">
            <h3>Use Cases for ML with Slang Shaders
                <hr>
            </h3>
            <div class="col-12">
                <p>Combining Slang's shader language capabilities with machine learning opens up unique opportunities:</p>
                <div class="grid gridSlang">
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Neural Rendering</h4>
                        <p>Implement neural rendering techniques like NeRF, neural radiance caching, and learned material models directly in your rendering pipeline using Slang shaders.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Custom ML Operators</h4>
                        <p>Create high-performance custom operators as Slang shaders for machine learning frameworks when standard operations don't meet your needs.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Differentiable Simulation</h4>
                        <p>Build differentiable physics, cloth, fluid, and particle simulation shaders that can be optimized through gradient-based methods.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Graphics Research</h4>
                        <p>Prototype and experiment with novel neural graphics algorithms using Slang's flexible shader language designed specifically for graphics programmers.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Production Pipelines</h4>
                        <p>Integrate machine learning components into existing graphics shader pipelines without sacrificing performance or portability, maintaining a single shader language across your codebase.</p>
                    </div>
                    <div class="g-col-md-4 g-col-sm-6 g-col-12">
                        <h4>Sparse Computation</h4>
                        <p>Implement efficient sparse data structures and algorithms that aren't well-supported by tensor-based ML frameworks.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="row">
            <h3>Get Started with ML in Slang Shaders
                <hr>
            </h3>
            <div class="col-sm-12">
                <p>Ready to explore machine learning with Slang? Check out these resources to get started:</p>
                <ul>
                    <li><a href="https://docs.shader-slang.org/en/latest/external/slang/docs/user-guide/07-autodiff.html">Automatic Differentiation Guide</a> - Learn how to use Slang's autodiff capabilities in your shaders</li>
                    <li><a href="https://docs.shader-slang.org/en/latest/external/slangpy/docs/">SlangPy Documentation</a> - Integrate Slang with Python-based ML frameworks like PyTorch</li>
                    <li><a href="https://docs.shader-slang.org/en/latest/coming-from-hlsl.html">Coming from HLSL</a> - Transition guide for DirectX shader developers</li>
                    <li><a href="https://docs.shader-slang.org/en/latest/coming-from-glsl.html">Coming from GLSL</a> - Transition guide for OpenGL/Vulkan shader developers</li>
                    <li><a href="https://shader-slang.org/slang-playground/">Slang Playground</a> - Experiment with Slang shader code in your browser</li>
                </ul>
                <a class="btn btn-primary" href="/docs/getting-started">Get Started with Slang Shaders</a>
            </div>
        </div>
    </div>
</div> 