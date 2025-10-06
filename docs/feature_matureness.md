---
title: Slang Feature Matureness
layout: page
description: Slang Feature Matureness
permalink: "/docs/feature_matureness/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

The table below shows the matureness of each Slang feature.

There are four types of Status:
- Stable: feature is stable and mature, and is documented by the language spec.
- Public Review: feature is implemented and tested by the community, and is now under public review and ready to be marked as stable and become part of the language spec.
- Experimental: feature is implemented and being tested by early adopters. Features in this stage are subject to change or removal at any time.  
<br>

| Feature | Status | Notes |
| --- | --- | --- |
| Attributes and user defined attributes | Stable |  |
| Auto variable type inference | Stable |  |
| HLSL syntax | Stable | Some known gaps around specific intrinsics; templates intentionally left out |
| enum types | Stable |  |
| Extension | Stable |  |
| Intellisense | Stable |  |
| Modules (import) | Stable | Being widely adopted in many code bases and haven't seen true quality issues reported for a long while. There are issues reported for quality of life improvements, but not about implementation defects. |
| Namespaces | Stable |  |
| Operator Overload | Stable |  |
| Optional<T> | Stable |  |
| ParameterBlock<T> | Stable |  |
| Properties | Stable | No issues found or reported in the last year. (this is to establish reference, many features not listed will fall in this category) |
| Raytracing | Stable |  |
| Reflection | Stable |  |
| User-defined operator[] (with multi parameter support) | Stable |  |
| Vulkan Interop (scalar layout, -fvk-* options) | Stable |  |
| Associated types for static dispatch | Experimental | Has been there for a long while with a lot of user code adoption |
| Autodiff (first-order) | Experimental | Adopted by many large scale code bases (3000+ lines of code), have not seen correctness issues for a long period. There are requests for unimplemented features. Improvements, enhancements and refactors are known and planned. |
| Autodiff (higher-order) | Experimental | Implemented and adopted in 2 different codebases. Known holes in design, and has not been widely adopted or exercised so its quality maybe significantly lower. |
| Builtin generic interfaces and operator overloads for generic code | Experimental | There isn't bugs or quality issues, and a lot of user code is depending on this, but we don't have good test coverage to build the confidence that it will provide good user experience. |
| Capabilities | Experimental | Implementation not done. |
| GLSL Compatibility | Experimental | Lightly adopted in MKL's mini examples, and a subset of CTS. Need more detailed scope and more time to test its quality. |
| Generic existential types | Experimental | Not being used or tested much |
| Generic existential types | Experimental | Not being used or tested much |
| Generic interface as generic constraints | Experimental | Not widely adopted, test coverage are not comprehensive but the basic feature works. Known limitations in implementation that we need to spec out for now. |
| Geometry Shader (spirv direct) | Experimental | Still seeing bug reports from time to time, but likely more mature than Mesh Shader due to the long time it exists |
| Link time specialization | Experimental | Adopted by one user library and tested with several user applications. No issues has been filed in last two weeks. There are known gaps in implementation but our users are not running into them. |
| Mesh Shader (spirv-direct) | Experimental | Still seeing bugs from time to time, not thoroughly tested. |
| Multi-entrypoint (spirv direct) | Experimental | Being adopted in many codebases including Valve's, still seeing bug reports from time to time, need time to verify its quality |
| Multi-file Modules (__include) | Experimental | Implemented and tested with several different configurations. However, not fully tested with precompiled modules. No user code is adopting this feature. |
| Multi-file Modules (__include) | Experimental | Implemented and tested with several different configurations. However, not fully tested with precompiled modules. No user code is adopting this feature. |
| Non-generic Interface as generic constraints | Experimental | The basis of stdlib and widely adopted in user codebase. This is the most basic use of interface types and has been working well. |
| Non-generic existential types (dynamic dispatch) | Experimental | Nontrivial adoption, a lot of test coverage. But syntax around existential types may change. |
| Non-generic existential types (dynamic dispatch) | Experimental | Nontrivial adoption, a lot of test coverage. But syntax around existential types may change. |
| Non-generic existential types (static dispatch) | Experimental | Syntax around existential types may change. |
| Non-generic existential types (static dispatch) | Experimental | Syntax around existential types may change. |
| Obfuscation | Experimental | Implemented a long while ago and adopted by OV, not seeing bug reports but they may be broken with latest language developments and lack of sufficient testing, especially when used in tendum with precompiled modules and link time specialization. |
| Precompiled Modules (serialization / up-to-date-ness verification) | Experimental | Adopted by one user library and tested with serveral applications. |
| SPIRV Debug | Experimental | Bug rate stablized, and has been working well. But need more adoption or testing to receive a higher matureness rating. |
| SPIRV Pointers | Experimental | Adopted by many users, and address many corner case issues reported by the user. Related bug rate is converging to 0. |
| Uniformity Analysis | Experimental | Implemented the first version, tested with 2 unit tests, no actual user code exercising it, not thoroughly tested, unlikely to work out of box when it gets actual use but expected to mature within 2 weeks in close iteration loop with adopting users. |
| Uniformity Analysis | Experimental | Implemented the first version, tested with 2 unit tests, no actual user code exercising it, not thoroughly tested, unlikely to work out of box when it gets actual use but expected to mature within 2 weeks in close iteration loop with adopting users. |
| `as` and `is` operators | Experimental |  |
| `reinterpret<T>` | Experimental |  |
{:.table}