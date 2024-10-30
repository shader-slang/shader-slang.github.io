# Frequently Asked Questions

#### Does Slang use LLVM?

No. The Slang compiler itself is not built on the LLVM tech stack, and does not depend on LLVM.
If you are using Slang to generate textual or SPIRV code, no LLVM binaries are required. If you are using Slang to produce standalone executables or dynamically linked
libraries, then a prebuilt LLVM wrapper library called `slang-llvm` is required.

#### What's the distribution size of Slang?

The Slang compiler binary is around 5-10 MB depending on build configuration and target architecture.

