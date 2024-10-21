# Documentation

## Guides

The Slang [User's Guide](https://shader-slang.github.io/slang/user-guide/) provides an introduction to the Slang language and its major features, as well as the compilation and reflection API.

There is also documentation specific to using the [`slangc`](command-line-slangc.md) command-line tool.

## Tutorials

- [Write your first slang shader](/docs/first-slang-shader.md).
- Getting started with Slang as an HLSL user.
- Getting started with Slang as an GLSL user.

## Advanced Users
--------------

For the benefit of advanced users we provide detailed documentation on how Slang compiles code for specific platforms.
The [target compatibility guide](target-compatibility.md) gives an overview of feature compatibility for targets. 

The [CPU target guide](cpu-target.md) gives information on compiling Slang or C++ source into shared libraries/executables or functions that can be directly executed. It also covers how to generate C++ code from Slang source.  

The [CUDA target guide](cuda-target.md) provides information on compiling Slang/HLSL or CUDA source. Slang can compile to equivalent CUDA source, as well as to PTX via the nvrtc CUDA complier.

Contributors
------------

For contributors to the Slang project, the information under the [`design/`](design/) directory may help explain the rationale behind certain design decisions and help when ramping up in the codebase.
