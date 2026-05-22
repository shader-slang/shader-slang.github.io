---
layout: post
title: "Enduring Games at GDC: We're Speaking Your Slang-uage Here: A Proof-of-Concept Console Backend for the Slang Shading Language"
date: 2026-05-22
categories: [ "blog" ]
tags: [slang]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/enduring-games-console-backend.webp
human_date: "May 22, 2026"
featured: true
---

One of the fundamental promises of Slang is portability: write your shaders once, compile them to whatever target you need. At GDC 2026, [Enduring Games](https://enduringgames.com/) put that promise to the test — and then some.

In their talk "We're Speaking Your Slang-uage Here: A Proof-of-Concept Console Backend for the Slang Shading Language," Enduring Games' Adam Creighton (Founder & CEO) and Kevin Nappoly (Rendering & Graphics Lead) walked through their experience adding new compilation targets to Slang for two current-generation console platforms. This represents the first public presentation of results from Slang-compiled shaders running on PS5 and Xbox Series hardware. The PoC showed Slang-generated shaders running at performance parity with the originals across a representative set of render passes.

You can watch the full talk on the NVIDIA Game Developer YouTube channel:

**[▶ Watch the GDC 2026 recording](https://youtu.be/dfRownfn6NY)**
**[🎞️ View the GDC 2026 presentation slides](https://shader-slang.org/docs/enduring-extending-slang/Enduring-Games-slides.pdf)**

Enduring Games has also published an accompanying implementation guide — *"BEACHCOMBER: How to Extend Slang for Your Platform"* — that distills the lessons from this project into a practical, step-by-step blueprint for adding a new backend to Slang. It covers everything from registering new target enums and inheriting an existing emitter, to defining capabilities, writing legalization passes, handling bindless and pointer support, and porting shader idioms like conditional members and union emulation. If you're thinking about targeting Slang output to a platform that isn't yet supported, this guide is your starting point.

**[📄 Read the BEACHCOMBER guide](https://shader-slang.org/docs/enduring-extending-slang/BEACHCOMBER-How-to-extend-Slang.pdf)**

If you are interested in exploring an implementation for your PlayStation or Xbox pipeline or project, approved hardware licensees should contact Enduring Games ([https://enduring.games/contact/](https://enduring.games/contact/))

---

## Additional Resources

- [Slang documentation](https://docs.shader-slang.org/en/latest/index.html)
- [Overview of the Slang Compiler](https://shader-slang.org/slang/design/overview.html)
- [Join the Slang community on Discord](https://khr.io/slangdiscord)
