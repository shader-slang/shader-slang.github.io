# Slang Feature matureness

The table below shows the matureness of each Slang feature.

There are four types of Status:

- Production: This status indicates that the feature has been fully developed and is operational at a production level.
- Beta: This status indicates that the feature is undergoing public testing. There might be some issues as it is still in the refinement phase.
- Alpha: This status indicates that the feature is in the internal testing phase. The feature is subject to significant changes and is likely to be unstable.
- Experimental: This status indicates that the feature is in the preliminary stages of development. These features are being tested internally to explore new possibilities and are not intended for public use.

| Feature | Status | Notes |
| --- | --- | --- |
| Attributes and user defined attributes | Production |  |
| Auto variable type inference | Production |  |
| Core HLSL language | Production | Some known gaps around specific intrinsics; templates intentionally left out |
| Core Slang Language | Production |  |
| enum types | Production |  |
| Extension | Production |  |
| Intellisense | Production |  |
| Modules (import) | Production | Being widely adopted in many code bases and haven't seen true quality issues reported for a long while. There are issues reported for quality of life improvements, but not about implementation defects. |
| Namespaces | Production |  |
| Operator Overload | Production |  |
| Optional<T> | Production |  |
| ParameterBlock<T> | Production |  |
| Properties | Production | No issues found or reported in the last year. (this is to establish reference, many features not listed will fall in this category) |
| Raytracing | Production |  |
| Reflection | Production |  |
| User-defined operator[] (with multi parameter support) | Production |  |
| Vulkan Interop (scalar layout, -fvk-* options) | Production |  |
| Autodiff (higher-order) | Alpha | Implemented and adopted in 2 different codebases. Known holes in design, and has not been widely adopted or exercised so its quality maybe significantly lower. |
| GLSL Compatibility | Alpha | Lightly adopted in MKL's mini examples, and a subset of CTS. Need more detailed scope and more time to test its quality. |
| Generic interface as generic constraints | Alpha | Not widely adopted, test coverage are not comprehensive but the basic feature works. Known limitations in implementation that we need to spec out for now. |
| Link time specialization | Alpha | Adopted by one user library and tested with several user applications. No issues has been filed in last two weeks. There are known gaps in implementation but our users are not running into them. |
| Mesh Shader (spirv-direct) | Alpha | Still seeing bugs from time to time, not thoroughly tested. |
| SPIRV Pointers | Alpha | Adopted by many users, and address many corner case issues reported by the user. Related bug rate is converging to 0. |
| `as` and `is` operators | Alpha |  |
| Associated types for static dispatch | Beta | Has been there for a long while with a lot of user code adoption |
| Autodiff (first-order) | Beta | Adopted by many large scale code bases (3000+ lines of code), have not seen correctness issues for a long period. There are requests for unimplemented features. Improvements, enhancements and refactors are known and planned. |
| Builtin generic interfaces and operator overloads for generic code | Beta | There isn't bugs or quality issues, and a lot of user code is depending on this, but we don't have good test coverage to build the confidence that it will provide good user experience. |
| Geometry Shader (spirv direct) | Beta | Still seeing bug reports from time to time, but likely more mature than Mesh Shader due to the long time it exists |
| Multi-entrypoint (spirv direct) | Beta | Being adopted in many codebases including Valve's, still seeing bug reports from time to time, need time to verify its quality |
| Non-generic Interface as generic constraints | Beta | The basis of stdlib and widely adopted in user codebase. This is the most basic use of interface types and has been working well. |
| Obfuscation | Beta | Implemented a long while ago and adopted by OV, not seeing bug reports but they may be broken with latest language developments and lack of sufficient testing, especially when used in tendum with precompiled modules and link time specialization. |
| Precompiled Modules (serialization / up-to-date-ness verification) | Beta | Adopted by one user library and tested with serveral applications. |
| reinterpret<T> | Beta |  |
| SPIRV Debug | Beta | Bug rate stablized, and has been working well. But need more adoption or testing to receive a higher matureness rating. |
| Capabilities | Experimental | Implementation not done. |
| Generic existential types | Experimental | Not being used or tested much |
| Multi-file Modules (__include) | Experimental | Implemented and tested with several different configurations. However, not fully tested with precompiled modules. No user code is adopting this feature. |
| Non-generic existential types (dynamic dispatch) | Experimental | Nontrivial adoption, a lot of test coverage. But syntax around existential types may change. |
| Non-generic existential types (static dispatch) | Experimental | Syntax around existential types may change. |
| Uniformity Analysis | Experimental | Implemented the first version, tested with 2 unit tests, no actual user code exercising it, not thoroughly tested, unlikely to work out of box when it gets actual use but expected to mature within 2 weeks in close iteration loop with adopting users. |
| Capabilities | Experimental | Implementation not done. |
| Generic existential types | Experimental | Not being used or tested much |
| Multi-file Modules (__include) | Experimental | Implemented and tested with several different configurations. However, not fully tested with precompiled modules. No user code is adopting this feature. |
| Non-generic existential types (dynamic dispatch) | Experimental | Nontrivial adoption, a lot of test coverage. But syntax around existential types may change. |
| Non-generic existential types (static dispatch) | Experimental | Syntax around existential types may change. |
| Uniformity Analysis | Experimental | Implemented the first version, tested with 2 unit tests, no actual user code exercising it, not thoroughly tested, unlikely to work out of box when it gets actual use but expected to mature within 2 weeks in close iteration loop with adopting users. |
