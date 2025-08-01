---
layout: post
title: "Slang: Using AI coding assistants"
date: 2025-07-17
categories: [ "blog" ]
tags: [slang]
author: "Mukund Keshava, NVIDIA"
image: /images/posts/2025-08-01-slang-ai-assistant.webm
human_date: "August 1, 2025"
---

## Introduction

Large Language Models(LLMs) aid coding by boosting productivity. llms.txt is a proposed standard for websites to offer LLM-friendly content, mainly to assist LLMs during inference.
Slang now supports the llms.txt standard. You can now use LLMs to accelerate your development with help of coding assistants like Cursor by providing relevant context about Slang’s 
documentation, within your projects. We provide 3 different versions of llms.txt:

1. llms.txt - contains links with brief descriptions for agents to navigate. Use this if you’re looking for basic understanding of slang
2. llms-full.txt - contains entire slang docs compressed into the llms.txt format. Use this for more detailed documentation or for detailed explanations of slang.
3. llms-slangpy-full.txt - contains SlangPy related information. Use this for slangpy related topics.

## Usage

You can download these and use them with Cursor, or simply include these as part of the context to get started.The SlangPy version of the file is maintained separately due to its distinct repository and focus on Python interfaces. These files are available for download and can be integrated with Cursor, or alternatively, included as contextual resources to facilitate initial setup.
Integrating llms-full.txt directly into the prompt significantly enhances the quality of the output. 

Below is an illustration of utilizing llms.txt within Cursor for the development of a slang-based application. 
This demonstrates how users can access high-quality documentation concerning generics and gain insight into their implementation. Here we can see the following happen:

1. User provides the llms-full.txt as part of the prompt and posts a query related to how they can use slang features
2. We can see that the LLM goes through the relevant documentation and obtains answers as to how generics and interfaces can help reduce code duplication.
3. The LLM then goes ahead and provides implementation as well on how this can be done.
4. Note: Given the current state of LLM’s output will never be 100% accurate compilable code. However, it serves as a helping guide to implement next steps.

<img src="/images/posts/2025-08-01-slang-ai-assistant.webm" alt="AI coding assistant" class="img-fluid" style="max-width: 100%; width: 800px; height: auto;">

We encourage you to try out this integration and experience firsthand how it can streamline your development workflow, 
and we welcome your feedback to help us further improve this valuable tool. Kindly start discussion on our slang discord or file issues on our github if you have suggestions.
