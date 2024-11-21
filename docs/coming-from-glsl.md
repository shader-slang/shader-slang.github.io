# Migrating to Slang from GLSL

## Overview
Slang allows the developers to use GLSL syntax as the input shader. But this feature is intended to provide an easy transition from your existing GLSL based system to Slang system. The GLSL support is not meant to be complete and it may not be up-to-date with the GLSL spec.

## How to use GLSL shaders as the input
By default, Slang doesn't recognize GLSL syntax. You need to explicitly enable it with an option, `-allow-glsl` or `-lang glsl`.

With these options, Slang will import an extra module for GLSL and the GLSL specific intrinsics will be recognized.

It means that all of Slang syntax is still available and you can use both Slang and GLSL syntax in a same shader file.

## Layout rules
By default, Slang uses `std140` as the layout rule. You can explicitly specify to use `std430` whenever needed.

Some examples are follows:
```
StructuredBuffer<T, Std140Layout> std140Layout;
StructuredBuffer<T, Std430Layout> std430Layout;
StructuredBuffer<T, ScalarLayout> scalarLayout;
```

The layout rule can also be changed with options like `-force-glsl-scalar-layout` or `-fvk-use-scalar-layout`.

With those options, Slang will align all aggregrate types according to their elements' natural alignment as a rule described in `VK_EXT_scalar_block_layout`, aka `ScalarLayout`.

## Matrix layout
By default, GLSL uses column-major matrix layout.
TODO:

## Precision qualifiers are ignored
Slang doesn't respect the precision qualifiers such as `lowp`, `mediump`, and `highp`. All `float` type will be treated as a high precision float.

## `double` type may not be supported depending on the target or target profile
While GLSL supports `double` type with extensions and restrictions, HLSL and WGSL don't support `double` type.

The precision could be lost when using GLSL shader with those targets that don't support `double` type.

## Multiple entry-points are allowed
GLSL requires an entry point to be named as `main`. It prevents a shader file from having more than one entry-point like how other shading languages allow such as HLSL and Metal.

But this requirement doesn't apply when using Slang with the option `-allow-glsl`. In other words, you can define multiple entry-points in a same shader file.

## Texture-combined sampler
GLSL has types called "Texture-combined sampler" such as `sampler2D`, `sampler3D` and so on. Slang will "legalize" it into two objects: a texture object and a sampler object.

For example, `sampler2D` will be split into `Texture2D` and `SamplerState` when translated to `HLSL`.

## `mod` in GLSL is Modulus not Remainder
It is important to understand that there are two ways to perform the `mod` operation.
 1. **Modulus**: modulus returns `x - y * floor(x / y)`
 2. **Remainder**: remainder is calculated such that x = i * y + f, where i is an integer, f has the same sign as x, and the absolute value of f is less than the absolute value of y.

| Shading Language | Function name  | What it does |
|------------------|----------------|--------------|
| CPP              | fmod           | Remainder    |
| HLSL             | fmod           | Remainder    |
| GLSL             | mod, operator% | Modulus      |
| Metal            | fmod           | Modulus      |
| WGSL             | operator%      | Remainder    |

For this reason, the function `mod` is not translated to `fmod` when targeting HLSL, as an example. And it is translated to `x - y * floor(x / y)`.

## Request a support
Please feel free to [report](github.com/shader-slang/slang/issues) issues regarding the GLSL support.

