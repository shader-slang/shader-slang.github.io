---
title: Documentation
layout: docs
description: Documentation
permalink: "/docs/"
---

<div class="container">
    <div id="docs_overview" class="section">
        <div class="row">
            <div class="col-12">
                <h3>Overview
                    <hr>
                </h3>
                {% assign overview_items = site.data.documentation.overview %}
                <div class="grid gridSlang">
                {% for item in overview_items %}
                {% if item.title and item.title != '' %}
                    <div class="g-col-md-4 g-col-sm-6 g-col-12 gridSlang-wrapper">
                        <h4>{{ item.title }}</h4>
                        <p>{{ item.description }}</p>
                        {% if item.link_url and item.link_url != '' %}
                        <p class="gridSlang-link"><a href="{{ item.link_url }}">{{ item.link_label }}</a></p>
                        {% else %}
                        <p class="gridSlang-link">{{ item.link_label }}</p>
                        {% endif %}
                    </div>
                    {% endif %}
                {% endfor %}
                </div>
            </div>
        </div>
    </div>

    <div id="docs_articles" class="section">
        <div class="row">
            <div class="col-12">
                <h3>Articles
                    <hr>
                </h3>
                {% assign articles_items = site.data.documentation.articles %}
                    <div class="grid gridSlang">
                    {% for item in articles_items %}
                    {% if item.title and item.title != '' %}
                        <div class="g-col-md-4 g-col-sm-6 g-col-12 gridSlang-wrapper">
                            <h4>{{ item.title }}</h4>
                            <p>{{ item.description }}</p>
                        {% if item.link_url and item.link_url != '' %}
                        <p class="gridSlang-link"><a href="{{ item.link_url }}">{{ item.link_label }}</a></p>
                        {% else %}
                        <p class="gridSlang-link">{{ item.link_label }}</p>
                        {% endif %}
                        </div>
                    {% endif %}
                    {% endfor %}
                    </div>
            </div>
        </div>
    </div>
    <div id="docs_tutorials" class="section">
        <div class="row">
            <div class="col-12">
                <h3>Tutorials
                    <hr>
                </h3>
                {% assign tutorials_items = site.data.documentation.tutorials %}
                    <div class="grid gridSlang">
                    {% for item in tutorials_items %}
                    {% if item.title and item.title != '' %}
                        <div class="g-col-md-4 g-col-sm-6 g-col-12 gridSlang-wrapper">
                            <h4>{{ item.title }}</h4>
                            <p>{{ item.description }}</p>
                        {% if item.link_url and item.link_url != '' %}
                        <p class="gridSlang-link"><a href="{{ item.link_url }}">{{ item.link_label }}</a></p>
                        {% else %}
                        <p class="gridSlang-link">{{ item.link_label }}</p>
                        {% endif %}
                        </div>
                    {% endif %}
                        {% endfor %}
                    </div>
            </div>
        </div>
    </div>
    
    
    <div class="section">
        <div class="row">
            <div class="col-12">
                <h3>Contributions
                    <hr>
                </h3>
                <p>If you’d like to contribute to the project, we are excited to have your input. Our community pages provides information
                on our structure and our process for accepting contributions.</p>
                <a class="btn btn-primary" href="/community/">Making Community Contributions</a>
            </div>
        </div>
    </div>
</div>