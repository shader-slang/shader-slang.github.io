---
layout: post
title: "Slang at SIGGRAPH 2025"
date: 2025-08-08 17:00:00
categories: [ "blog" ]
tags: [slang, siggraph]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/siggraph-logo.webp
human_date: "August 8, 2025"
youtube_id: "Y7uBfTxFnnA"
---

We're excited to announce that Slang will have a significant presence at **SIGGRAPH 2025** in Vancouver this August! This year's conference will feature three major Slang events: a hands-on lab for learning the language, a comprehensive course on neural shading techniques, and a Birds of a Feather session for community discussion and updates.

## [Hands-On Class: Introduction to Slang](https://s2025.conference-schedule.org/?post_type=page&p=14&id=gensubcur_104&sess=sess287)

**Sunday, August 10, 4:00-5:30 PM PDT**  
**West Building, Rooms 121-122**

Join us for a comprehensive hands-on lab that will take you from Slang basics to advanced features. This interactive session, led by NVIDIA's Nia Bickford, Tristan Lorach, and Chris Hebert, will cover:

- **Language Fundamentals**: Modern shader programming constructs and syntax
- **Advanced Features**: Modules, generics, and interfaces for scalable code organization
- **SlangPy Integration**: Python-based development and rapid prototyping
- **Automatic Differentiation**: Neural graphics and machine learning capabilities
- **Cross-Platform Development**: Writing shaders that work across multiple GPU APIs

The lab is designed for graphics developers of all experience levels, from those new to shader programming to experienced developers looking to modernize their workflow. Computers will be provided, so no preparation is required—just bring your curiosity and enthusiasm for modern shader development!

## [Birds of a Feather: Developing with Slang](https://s2025.conference-schedule.org/?post_type=page&p=14&id=bof_177&sess=sess558)

**Wednesday, August 13, 2:30-3:30 PM PDT**  
**British Ballroom, Fairmont Waterfront**

This community-focused session will provide the latest updates on Slang development and foster discussions about the future of shader programming. The session will include:

- **Community Update**: Latest developments and ecosystem growth
- **Language Roadmap**: Upcoming features and development priorities
- **Industry Perspectives**: Real-world experiences from companies using Slang
- **Open Discussion**: Q&A and community feedback

This is your opportunity to connect with the Slang Working Group, share your experiences, and help shape the future direction of the language. Whether you're actively using Slang or just curious about modern shader development, this session will provide valuable insights and networking opportunities.

## [An Introduction to Neural Shading](https://s2025.conference-schedule.org/?post_type=page&p=14&id=gensub_420&sess=sess208)

**Thursday, August 14, 9:00 AM-12:15 PM PDT**  
**West Building, Rooms 109-110**

This intensive course will teach you how to implement neural shading techniques using Slang, where traditional graphics algorithms are replaced with neural networks. This course covers:

- **Neural Shading Fundamentals**: Theory and practical implementation of neural networks in graphics
- **Automatic Differentiation**: Deep dive into Slang's autodiff capabilities for gradient-based optimization
- **MLP Implementation**: How to build and optimize Multi-Layer Perceptrons in Slang
- **Hardware Acceleration**: Leveraging modern GPU tensor cores and cooperative vectors
- **Production Deployment**: Real-world considerations for shipping neural shading techniques

The course includes interactive samples written in Python and Slang, allowing you to follow along and experiment with the techniques in real-time. This is your opportunity to learn from the experts who are pushing the boundaries of what's possible with neural graphics.

## Latest Slang Release

We're also excited to announce our latest Slang release, which brings significant improvements and new features to the language. This release continues our commitment to making shader programming more accessible and powerful: Slang Release [v2025.14.3](https://github.com/shader-slang/slang/releases/tag/v2025.14.3)

We're also excited to announce our latest Slang release, which brings significant improvements and new features to the language, including:

### Language Enhancements and New Functionality

* Support for default implementations in interface methods
* New `override` keyword requirement for overriding default interface methods
* Added control arguments for floating-point denormal mode
* Extended `expand` operator support for concrete tuple values

### Compiler Architecture Improvements

We've redesigned how AST deserialization and deduplication is implemented in the compiler, enabling on-demand deserialization of the core module. This architectural improvement leads to a significant performance boost, with over 3x speedup in `createGlobalSession` and reduced end-to-end compile times for small to medium shaders. In our benchmarks, the compile time for a typical fragment shader with `slangc` dropped from 260ms to 80ms.

### Improvements to Code Generation, Debugging, and Platform Support.

* Added support for `SPV_EXT_fragment_invocation_density` (`SPV_NV_shading_rate`)
* Implemented GLSL/SPIR-V built-in variable `DeviceIndex`
* Added MSVC-style bitfield packing
* Improved matrix type handling:
  - Automatic lowering of unsupported matrix types for GLSL/WGSL/Metal targets
  - Conversion of `int`/`uint`/`bool` matrices to arrays for SPIR-V
* Enhanced reflection API with combined texture-sampler flag to differentiate `Texture2D` from `Sampler2D`
* Added `mad` operation support in WGSL
* Improved debugging capabilities:
  - Added `DebugGlobalVariable` instructions to SPIR-V output
  - Updated to 1-based argument indexing for `DebugLocalVariable`

### Language Server Improvements

* Auto-sort completion suggestions by relevance and context   
* Show function signature assistance when working with generic types and functions  
* Intelligent auto-completion when implementing interface methods with override keyword

Apart from these changes, we also landed many smaller fixes that improve the compiler's performance, stability and consistency.

This release demonstrates our ongoing investment in Slang's capabilities and our commitment to the graphics development community. Whether you're working on traditional rendering pipelines or exploring neural graphics techniques, these new features will help you write better, more maintainable shader code.

## Can't Make It to SIGGRAPH?

If you can't attend SIGGRAPH 2025 in person, you can still stay connected with the Slang community:

- **Try Slang Online**: Experiment with [Slang in your browser](https://shader-slang.org/slang-playground)
- **Join the Community**: Connect with other developers on our [Discord server](https://khr.io/slangdiscord)
- **Explore Examples**: Check out our [GitHub repository](https://github.com/shader-slang/slang) for tutorials and sample code
- **Follow Updates**: Stay informed about Slang developments through our [blog](https://shader-slang.com/blog) and social media

## Looking Forward

SIGGRAPH 2025 marks an exciting milestone for Slang as we continue to build a modern, accessible shader programming ecosystem. Whether you're attending the hands-on lab, the neural shading course, the Birds of a Feather session, or all three, we're looking forward to meeting you and sharing the latest developments in shader language technology.

See you in Vancouver!

---

*For more information about SIGGRAPH 2025, visit the [official conference website](https://s2025.siggraph.org/).* 
