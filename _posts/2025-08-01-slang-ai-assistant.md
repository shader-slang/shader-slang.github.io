---
layout: post
title: "Slang: Using AI coding assistants"
date: 2025-08-01
categories: [ "blog" ]
tags: [slang]
author: "Mukund Keshava, NVIDIA"
image: /images/posts/2025-08-01-slang-ai-assistant.webp
human_date: "August 1, 2025"
---

## Introduction

Large Language Models(LLMs) aid coding by boosting productivity. llms.txt is a proposed standard for websites to offer LLM-friendly content, mainly to assist LLMs during inference.
Slang now supports the llms.txt standard. You can now use LLMs to accelerate your development with help of coding assistants like [Cursor](https://cursor.com/agents) or any tool of choice by providing relevant context about Slang’s
documentation, within your projects. We provide 3 different versions of llms.txt:

1. [llms.txt](/docs/llms.txt) - contains links with brief descriptions for agents to navigate. Use this if you’re looking for basic understanding of Slang
2. [llms-full.txt](/docs/llms-full.txt) - contains entire Slang docs compressed into the llms.txt format. Use this for more detailed documentation or for detailed explanations of Slang.
3. [llms-SlangPy-full.txt](/docs/llms-slangpy-full.txt) - contains SlangPy related information. Use this for SlangPy related topics.

## Usage

You can download these and use them with Cursor, or simply include them as part of the context to get started.The SlangPy version of the file is maintained separately due to its distinct repository and focus on Python interfaces. These files are available for download and can be integrated with Cursor, or alternatively, included as contextual resources to facilitate initial setup.
Integrating llms-full.txt directly into the prompt significantly enhances the quality of the output. 

Below is an illustration of utilizing llms.txt within Cursor for the development of a Slang-based application. 
This demonstrates how users can access high-quality documentation concerning generics and gain insight into their implementation. Here we can see the following happen:

1. User provides the llms-full.txt as part of the prompt and posts a query related to how they can use Slang features
2. We can see that the LLM goes through the relevant documentation and obtains answers as to how generics and interfaces can help reduce code duplication.
3. The LLM then goes ahead and provides implementation as well on how this can be done.
4. Note: Given the current state of LLMs, output may not be 100% accurate, compilable code, so you will need to review it closely.

<video width="480" controls>
  <source src="/images/posts/2025-08-01-slang-ai-assistant.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

We encourage you to try out this integration and experience firsthand how it can streamline your development workflow, 
and we welcome your feedback to help us further improve this valuable tool. Kindly start discussion on our Slang Discord or file issues on our GitHub if you have suggestions.
