# Getting Started with Slang

## Releases

The fastest way to get started using Slang is to use a pre-built binary package, available through GitHub [releases](https://github.com/shader-slang/slang/releases). Binary packages are currently available for:

* Windows 32-bit x86
* Windows 64-bit x86-64
* Ubuntu Linux 64-bit x86-64

Binary releases include the command-line compiler `slangc`, a shared library for the compiler, and the header files necessary for interacting with that library.

## Building from Source

Instructions for building Slang from source code are maintained as part of the source code repository, [here](https://github.com/shader-slang/slang/blob/master/docs/building.md).

## Documentation

The documentation for the Slang project is currently limited, but includes the following main pieces:

* A [language guide](slang/language-guide) to introduce the language features for developers already familiar with HLSL.

* A [guide](slang/command-line-slangc) to the `slangc` command-line tool and its options. However, it should be noted that the command-line tool is intended for simple use cases, and complicated applications are advised to adopt API-based compilation if possible.

* An [API guide](slang/api-users-guide) to give information on how Slang compilation and reflection can be integrated into an application.

* Guides on [feature compatibility](slang/target-compatibility) across different compilation targets, including in-depth information on the conventions used by the [CPU](slang/cpu-target) and [CUDA](slang/cuda-target) targets.
