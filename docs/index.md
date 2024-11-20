# Documentation

## Overview

#### [The Slang User's Guide](/slang/user-guide/)
The guide provides an introduction to the Slang language and its major features, as well as the compilation and reflection API.

#### [The Slang's Standard Modules Reference](/stdlib-reference/)

The reference of the standard modules that comes with the Slang compiler.

#### [Language Specification](https://github.com/shader-slang/spec)

The formal specification of the Slang programming language. Work in progress.

#### [Slang Feature Matureness](/docs/feature_matureness)

List of Slang Features with their stableness/matureness.

#### [Frequently Asked Questions](/docs/faq)

Answers to a list of frequently asked questions.

## Articles

#### [The Commandline Tool Reference](https://github.com/shader-slang/slang/blob/master/docs/command-line-slangc-reference.md)

There is the documentation specific to using the `slangc` command-line tool.

#### [SPIR-V Specific Functionalities](/slang/user-guide/spirv-target-specific.html)

Things to know when using Slang to compile to SPIR-V.

#### Metal Specific Functionalities

Things to know when using Slang to compile to the Metal Shading Language.

[//]: # (TODO: write documentation in user-guide next to spirv doc, and update link here)

#### WGSL Specific Functionalities

Things to know when using Slang to compile to the WGSL.

[//]: # (TODO: write documentation in user-guide next to spirv doc, and update link here)

## Tutorials

#### [Write your first slang shader](/docs/first-slang-shader)
See how to write a simple compute shader in Slang and compile it for execution on Vulkan.

#### [Using the compilation API](/slang/user-guide/compiling)
See how to use Slang's compilation API to integrate the Slang compiler into your application.

#### [Using the reflection API](/slang/user-guide/reflection)
See how to use Slang's reflection API to query for parameter binding info at runtime.

#### [Understanding Slang Generics](/docs/understanding-generics.md)

Learn how to use Slang's generics and interfaces to write structured code that can be
specialized at compile time. This tutorial covers the differences between generics and C++ templates
and how to map common templated code to generics.

#### Migrating to Slang from HLSL

Main things to know if you are coming to Slang as an HLSL developer.

[//]: # (TODO: write documentation and update link here)

#### Migrating to Slang from GLSL

Main things to know if you are coming to Slang as an GLSL developer.

[//]: # (TODO: write documentation and update link here)


## Contributors

[//]: # (TODO: link more internal documentation and contribution process, build instructions etc.)

For contributors to the Slang project, the information under the [docs/proposals/](https://github.com/shader-slang/slang/tree/master/docs/proposals) directory documents all feature proposals to the Slang language or the compiler API.
