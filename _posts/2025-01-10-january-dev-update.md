---
layout: post
title: "Slang Development Update - January 2025"
date: 2025-01-10 19:00:00 +0000
categories: [ "news" ]
tags: [slang]
author: "Yong He, NVIDIA, and Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/2025-01-10-dev-updates.webp
human_date: "January 10, 2025"
---

Happy new year, Slang enthusiasts! As we beckon in 2025, we wanted to take a moment to highlight the many improvements we’ve been able to land in response to the incredible and enthusiastic engagement and feedback from the Slang community! Take a look at what’s new:

**Improvement on specialization constants and push constants**
- Specialization constants are now supported for WGSL and Metal targets.
- Fixed reflection API issues around specialization constants and push constants.
- Added more validation checks on invalid use of specialization/push constant attributes.
**Improvement on SPIRV pointer support**
- Added loadAligned and storeAligned intrinsics for aligned load/stores.
- Now supports pointers to a struct with trailing unsized arrays.
- Dynamic dispatch via interface-typed pointers are now supported.
- Reflection on pointer element type now correctly reports the scalar layout.
**SPIRV/GLSL improvements**
- Added SV_DrawIndex semantic that maps to the DrawIndex builtin
- Added Sampler2DShadow and friends to combined texture comparison-sampler types.
- Explicit GLSL binding locations (as in [vk::binding()] and in layout(binding=...) qualifiers) can now use compile time expressions. (contribution from community)
- -fvk-invert-y option now works for mesh shader position outputs.
- Added nonuniformEXT intrinsics when consuming GLSL code.
**Reflection API and binding improvement**
- Explicit [vk::location(N)] binding is now supported for WGSL and Metal targets.
- IMetadata::isParameterLocationUsed now supports reporting usage info on stage varying inputs/outputs.
- Now support querying both user defined and system builtin attributes on types and functions with the new findAttributeByName API.
- Attribute::getArgumentValueByFloat now correctly returns the value even if the argument in the source code is in the form of a integer literal.
- WGSL backend now respects explicit binding qualifiers.

These improvements are available in Slang v2025.2.

Thank you to everyone in the Slang community for your feedback and your contributions! We’d also like to recognize GitHub users [@juliusikkala](https://github.com/juliusikkala) and [@fairywreath](https://github.com/fairywreath) for landing a number of fixes and improvements.

We’re also happy to share that the video and slides from last month’s Slang Birds of a Feather session are now available! This was a great session, with a full room of developers who brought insightful questions – give it a watch!
