# Frequently Asked Questions

#### Does Slang use LLVM?

No. The Slang compiler itself is not built on the LLVM tech stack, and does not depend on LLVM.
If you are using Slang to generate textual or SPIRV code, no LLVM binaries are required. If you are using Slang to produce standalone executables or dynamically linked
libraries, then a prebuilt LLVM wrapper library called `slang-llvm` is required.

#### What's the distribution size of Slang?

The Slang compiler binary is around 5-10 MB depending on build configuration and target architecture.

#### Can I add another code generation target to Slang?

Absolutely! Slang is open and everyone is welcomed to contribute! Slang supports two types of targets: textual targets such as HLSL/GLSL/WGSL/C++ or binary targets such as SPIRV. Generally, adding support for textual targets is simpler and a lot of the infrastructual can be reused between the targets. We recently added support for Metal and WGSL, and more backends can be added following the similar process. Please create a discussion thread on the [Slang GitHub repo](https://github.com/shader-slang/slang/discussions) to start working with the dev team on adding a new target.