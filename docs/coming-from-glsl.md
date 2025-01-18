---
title: Migrating to Slang from GLSL
layout: page
description: Migrating to Slang from GLSL
permalink: "/docs/coming-from-glsl/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---


## Overview
Slang allows developers to use GLSL syntax as input shaders. It provides an easy transition from your existing GLSL-based system to the Slang system. This document provides information that users may want to know when migrating from a GLSL-based system to the Slang system.

Note that the GLSL support is not meant to be complete and it may not be up-to-date with the GLSL spec.

For people who are interested in more details of how GLSL functions are translated, please refer to [glsl.meta.slang](https://github.com/shader-slang/slang/blob/master/source/slang/glsl.meta.slang).

## How to use GLSL shaders as input
By default, Slang doesn't recognize GLSL syntax. You need to explicitly enable it with an option, `-allow-glsl` or `-lang glsl`.

With these options, Slang will import an extra module for GLSL, and the GLSL-specific intrinsics will be recognized.

It means that all of Slang syntax is still available, and you can use both Slang and GLSL syntax in the same shader file.

For the compilation API, you can use `slang::CompilerOptionName::AllowGLSL` on `slang::CompilerOptionEntry` when you create a session.

Here is an example code snippet for the compilation API:
```cpp
slang::TargetDesc targetDesc = {};
targetDesc.format = SLANG_SPIRV;
targetDesc.profile = globalSession->findProfile("glsl_460");

slang::CompilerOptionEntry compilerOptions[1];
compilerOptions[0].name = slang::CompilerOptionName::AllowGLSL;
compilerOptions[0].value.intValue0 = 1;

slang::SessionDesc sessionDesc = {};
sessionDesc.targets = &targetDesc;
sessionDesc.targetCount = 1;

sessionDesc.compilerOptionEntries = compilerOptions;
sessionDesc.compilerOptionEntryCount = 1;

Slang::ComPtr<slang::ISession> session;
globalSession->createSession(sessionDesc, session.writeRef());
```

## Layout rules
By default, Slang uses `std430` as the layout rule. You can explicitly specify to use `std140` whenever needed.

Some examples are as follows:
```
StructuredBuffer<T, Std140DataLayout> std140Layout;
StructuredBuffer<T, Std430DataLayout> std430Layout;
StructuredBuffer<T, ScalarDataLayout> scalarLayout;
```

The layout rule can also be changed with options like `-force-glsl-scalar-layout` or `-fvk-use-scalar-layout`.

With those options, Slang will align all aggregate types according to their elements' natural alignment as described in `VK_EXT_scalar_block_layout`, aka `ScalarLayout`.

## Matrix
Even though GLSL claims to use "Column-major", it is mostly nomenclature when it comes to the shader-side implementation. For this reason, `matXxY` and `floatXxY` can be used interchangeably in Slang.

Here is an example that shows the difference between GLSL and HLSL.
<table>
<tr><td>GLSL shader</td><td>HLSL shader</td></tr>
<tr><td>
  
```glsl
mat3x4 m; // 3 columns and 4 rows
for (int c = 0; c < 3; ++c)
{
  for (int r = 0; r < 4; ++r)
  {
    m[c][r] = c * 4 + r;
  }
}

vec4 takeFirstColumn = { 1, 0, 0, 0 };
vec3 result;
result.x  = dot(takeFirstColumn, m[0]); // 0
result.y  = dot(takeFirstColumn, m[1]); // 4
result.z  = dot(takeFirstColumn, m[2]); // 8
```
</td><td>
  
```hlsl
float3x4 m; // 3 rows and 4 columns
for (int r = 0; r < 3; ++r)
{
  for (int c = 0; c < 4; ++c)
  {
    m[r][c] = r * 4 + c;
  }
}

float4 takeFirstColumn = { 1, 0, 0, 0 };
float3 result;
result.x  = dot(takeFirstColumn, m[0]); // 0
result.y  = dot(takeFirstColumn, m[1]); // 4
result.z  = dot(takeFirstColumn, m[2]); // 8
```
</td></tr></table>

The real difference is in the data "Layout," where the CPU stores the data in memory in a certain order, and the shader interprets it in the same way.

For a more detailed explanation about the matrix layout, please check another document, [Handling Matrix Layout Differences on Different Platforms](https://shader-slang.com/slang/user-guide/a1-01-matrix-layout.html).

## Precision qualifiers are ignored
Slang doesn't respect the precision qualifiers such as `lowp`, `mediump`, and `highp`. All `float` types will be treated as high-precision floats.

## `double` type may not be supported depending on the target or target profile
While GLSL supports the `double` type with extensions and restrictions, HLSL and WGSL don't support the `double` type.

The precision will be lost when using GLSL shaders with those targets that don't support the `double` type.

## Multiple entry-points are allowed
GLSL requires an entry point to be named `main`. This requirement prevents a shader file from having more than one entry point, unlike other shading languages such as HLSL and Metal.

But this requirement doesn't apply when using Slang with the option `-allow-glsl`. In other words, you can define multiple entry points in the same shader file.

## Texture-combined sampler
GLSL has types called "Texture-combined sampler" such as `sampler2D`, `sampler3D`, and so on. Slang will "legalize" it into two objects: a texture object and a sampler object.

For example, `sampler2D` will be split into `Texture2D` and `SamplerState` when translated to `HLSL`.

## `mod` in GLSL is Modulus not Remainder
It is important to understand that there are two ways to perform the `mod` operation.
 1. **Modulus**: modulus returns `x - y * floor(x / y)`
 2. **Remainder**: remainder is calculated such that x = i * y + f, where i is an integer, f has the same sign as x, and the absolute value of f is less than the absolute value of y.

The `mod` function in GLSL performs Modulus. When translating from GLSL to other targets, the behavior will remain the same. When the target doesn't have a native intrinsic function for Modulus, `x - y * floor(x / y)` will be emitted.

See the table below for what native functions are available for each target:

| Target | Native functions | What it does |
|--------|------------------|--------------|
| CPP    | fmod, remainder  | Remainder    |
| HLSL   | fmod             | Remainder    |
| GLSL   | mod, operator%   | Modulus      |
| Metal  | fmod             | Modulus      |
| WGSL   | operator%        | Remainder    |
| SPIRV  | OpFRem           | Remainder    |
| SPIRV  | OpFMod           | Modulus      |

As an example, when targeting HLSL, Slang will translate `mod` in GLSL to `x - y * floor(x / y)` in HLSL and not `fmod` in HLSL, because the result from `fmod` in HLSL is different from `mod` in GLSL.

As another example, when targeting SPIRV, Slang will emit `OpFMod` not `x - y * floor(x / y)`, because using the native intrinsic is more efficient.

## Requesting support
Please feel free to [report](https://github.com/shader-slang/slang/issues) issues regarding the GLSL support.
