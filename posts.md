---
title: Posts
layout: posts
description: Posts
permalink: "/posts/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---


                {% for post in site.posts %}
                <li>
                    <a href="{{ post.url }}">{{ post.title }}</a>
                </li>
                {% endfor %}