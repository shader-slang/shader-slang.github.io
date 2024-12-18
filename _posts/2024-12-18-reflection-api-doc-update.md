---
layout: post
title: "Documentation Update: Reflection API"
date: 2024-12-18 18:00:00 +0000
categories: [ "news" ]
tags: [slang]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair, and Theresa Foley, NVIDIA"
image: /images/posts/2024-12-18-reflection-api-doc-update.webp
human_date: "December 18, 2024"
---

The Slang reflection API gives developers the ability to examine shader parameters, types, and their layouts from their application during runtime – a big benefit for things like dynamic shader parameter binding. Based on user feedback, we’ve given the documentation for reflection a major update, making it easier to understand how to interact with and use it to your best advantage.

The [basic reflection API documentation](https://shader-slang.com/slang/user-guide/reflection) provides an overview of best practices for retrieving reflection information from a compiled shader, and how Slang reports out the individual variables and types and their layouts. It also references a [simple example](https://github.com/shader-slang/slang/tree/master/examples/reflection-api) to demonstrate how the code is used in practice, and provides coverage of details like how to calculate offsets into parameter blocks, how Slang handles global parameter declarations, and how to avoid common pitfalls.

For developers targeting multiple API environments, we’ve also put together an overview of one strategy for handling parameter passing in a cross-platform safe way in our [shader cursors documentation](https://shader-slang.com/docs/shader-cursors/). Because the way in which different GPU APIs accept parameters from the caller varies significantly, handing that information off to your shader program is something that many developers wrestle with. Slang’s reflection API was designed with this understanding in mind, to help you manage shader parameters wherever you need to deploy, across the wide range of targets that Slang supports.

We’re continuing to add to our reflection API documentation, so stay tuned for more updates! And if there are areas you’d like to see more detailed documentation, please let us know – you can join us at any time on our [Discord server](https://khr.io/slangdiscord)!

