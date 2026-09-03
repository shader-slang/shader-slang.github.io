---
layout: post
title: "SIGGRAPH 2026 Materials Now Available: Recordings and Resources from Our Events"
date: 2026-08-28 17:00:00
categories: [ "blog" ]
tags: [slang, siggraph, events]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/siggraph-logo-2026.webp
human_date: "August 28, 2026"
---

Recordings and materials from our SIGGRAPH 2026 sessions are now available! Whether you missed the conference or want to revisit the content, you can find everything below — from our courses and Birds of a Feather to the High-Performance Graphics talk that kicked off the week.

### High-Performance Graphics 2026: neural.slang

The week started a couple of days before SIGGRAPH proper with a [High-Performance Graphics 2026](https://www.highperformancegraphics.org/2026/schedule/) Hot3D talk on **neural.slang**, a new experimental standard module for implementing inline neural networks directly in shader code.

[Talk slides (PDF)](https://shader-slang.org/assets/downloads/neural_slang_hot3d.pdf)

### Course: Introduction to Neural Shading

We kicked off the week with this course covering the foundations of neural shading: building and training MLPs directly in Slang shaders, leveraging GPU tensor cores for hardware acceleration, and implementing neural materials as compact learned representations. The course included SlangPy-based Python examples and C++ implementations covering autodiff basics, cooperative vector acceleration, mipmap filtering, and a complete neural material pipeline. Instructors: Benedikt Bitterli, Chris Cummings, Kai Zhang, Shannon Woods.

[Course materials on GitHub](https://github.com/shader-slang/neural-shading-s26/)\
[Course slides (PDF)](https://github.com/shader-slang/neural-shading-s26/raw/refs/heads/main/slides/Neural_Shading_Course_Slides_2026.pdf)

### Course: Introduction to Slang: The Next-Generation Shading Language

This hands-on course took attendees from Slang basics through modules, interfaces, SlangPy integration, and automatic differentiation. Instructors: Nia Bickford, Chris Hebert.

[Lab materials](https://developer.download.nvidia.com/ProGraphics/nvpro-samples/SlangLab/Lab-2026.zip)\
[Slides (PDF)](https://developer.download.nvidia.com/ProGraphics/nvpro-samples/SlangLab/Slides-2026.pdf)

### Course: Hands-On Machine Learning with Slang

Chris Hebert led a practical session on building GPU ML inference pipelines with Slang — implementing a CNN from scratch using a lightweight set of pre-written kernels, loading SafeTensors weights, running inference, and applying kernel fusion for better performance. Course materials are still being compiled, but will be available soon.

### Real-Time Shading BOF

The Real-Time Shading Birds of a Feather session featured several talks, tracing the evolution of procedural shading from its birth to today. The session also highlighted results from the **2026 Shader Ecosystem Survey**, which gathered responses from more than 400 developers about their workflows and top pain points. Presenters included Randi Rost, Ken Perlin, Marc Olano, and Shannon Woods.

[Recording](https://www.khronos.org/developers/linkto/real-time-shading-bof)\
[Presentation materials](https://www.khronos.org/developers/linkto/real-time-shading-bof-sigg26)

### Birds of a Feather: Slang in Action

The Slang BOF covered the latest ecosystem news and roadmap progress, with Tzu-Mao Li (UCSD) presenting a survey of how his students are using Slang in research, and Sai Bangaru sharing early work on heterogeneous Slang. Presenters: Shannon Woods, Tzu-Mao Li, Sai Bangaru.

[Recording](https://www.khronos.org/developers/linkto/slang-in-action)\
[Presentation slides (PDF)](https://www.khronos.org/assets/uploads/developers/presentations/Slang_BOF_-_SIGGRAPH_Jul26.pdf)

---

All Khronos sessions from SIGGRAPH 2026 are available on the [Khronos SIGGRAPH 2026 events page](https://www.khronos.org/events/siggraph-2026), including the Khronos Fast Forward kickoff and the full run of BOFs.
