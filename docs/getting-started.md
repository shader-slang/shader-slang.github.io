---
title: Getting Started
layout: getting-started
description: Getting Started
permalink: "/docs/getting-started/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

<div class="section greyBar">
<div class="container">
        <div class="row">
            <div class="col-6">
                <h3>Try Slang
                    <hr>
                </h3>
                <p>Try slang locally in your browser without downloading or installing anything with the Slang
                    Playground.</p>
                <a class="btn btn-primary " href="https://try.shader-slang.org/">Try the Slang Playground</a>
            </div>
            <div class="col-6">
                <img class="img-fluid" src="/images/getting-started/slang-demo.png" alt="">
            </div>
        </div>
    </div>
</div>

<div class="container">
<div class="section">
    <div class="row">
        <div class="col-12">
            <h3>Machine Learning with Slang
                <hr>
            </h3>
            <p>The SlangPy package seamlessly bridges the graphics and machine learning ecosystems in Python. You can write Slang code to implement complex data structures and algorithms, or to use rasterization and ray-tracing. Slang code can be integrated directly into your Python/PyTorch training loop with SlangPy. No boilerplate, no C++.</p>
            <a class="btn btn-primary " href="https://slangpy.shader-slang.org/">Try SlangPy</a>
        </div>
    </div>
</div>
</div>

<div class="container">
<div class="section">
    <div class="row">
        <div class="col-12">
            <h3>Learn How to Become a Slang Expert
                <hr>
            </h3>
            <p>Slang code is highly portable, but can still leverage unique platform capabilities, including the latest
                features in
                Direct3D and Vulkan. For example, developers can make full use of <a
                    href="external/slang/docs/user-guide/05-convenience-features.html#pointers-limited">pointers</a> when generating
                SPIR-V. Slang's <a href="/slang/user-guide/capabilities.html">capability
                    system</a> helps applications manage feature set differences across target platforms by ensuring
                code only uses available
                features during the type-checking step, before generating final code. Additionally, Slang provides <a
                    href="external/slang/docs/user-guide/a1-04-interop.html">flexible
                    interop</a> features to enable directly embedding target code or SPIR-V into generated shaders.</p>
        </div>
    </div>
</div>
</div>

<div class="container">
<div id="docs_tutorials" class="section">
    <div class="row">
        <div class="col-12">

            {% assign gs_items = site.data.getting-started.items %}
            <div class="grid gridSlang">
                {% for item in gs_items %}
                {% if item.title and item.title != '' %}
                <div class="g-col-md-4 g-col-sm-6 g-col-12 gridSlang-wrapper">
                    <div class="icon">{{ item.icon }}</div>
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.description }}</p>
                    {% if item.link_url and item.link_url != '' %}
                    <p class="gridSlang-link"><a href="{{ item.link_url }}">{{ item.link_label }} &gt;</a></p>
                    {% else %}
                    <p class="gridSlang-link">{{ item.link_label }}</p>
                    {% endif %}
                </div>
                {% endif %}
                {% endfor %}
            </div>
        </div>
    </div>
</div>
</div>
