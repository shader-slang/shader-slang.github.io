# SPDX-License-Identifier: Apache-2.0
# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information
import os
import sys
import re
from pathlib import Path

sys.path.insert(0, os.path.abspath('.'))  # For finding _ext
sys.path.insert(0, os.path.abspath('..'))

def source_read_handler(app, docname, source):
    content = source[0]
    # Regex to find the comment block and extract its content
    pattern = re.compile(r'<!-- RTD-TOC-START\s*(.*?)\s*RTD-TOC-END -->', re.DOTALL)
    
    def uncomment_toc(match):
        return match.group(1) # Return only the content inside the comments

    # Replace the comment block with its uncommented content
    new_content = pattern.sub(uncomment_toc, content)
    source[0] = new_content

def handle_utf16le_files(app, docname, source):
    doc_path = Path(app.env.doc2path(docname))

    with open(doc_path, 'rb') as f:
        content_bytes = f.read()
        
        # Check for UTF-16LE BOM (FF FE)
        if content_bytes.startswith(b'\xff\xfe'):
            # Decode from UTF-16LE
            content = content_bytes.decode('utf-16le')
            # Strip any BOM characters that might be present as text
            content = content.replace('\ufeff', '')
            # Set the source content
            source[0] = content

def setup(app):
    app.connect('source-read', source_read_handler)
    app.connect('source-read', handle_utf16le_files)

project = 'Slang Documentation'
author = 'Chris Cummings, Benedikt Bitterli, Sai Bangaru, Yong Hei, Aidan Foster'
release = '0.1.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

source_suffix = ['.rst', '.md']
source_parsers = {
    '.md': 'myst_parser.sphinx_',
}

# Load extensions - make sure fix_links is early in the list
extensions = [
    '_ext.fix_links',  # Custom extension to fix relative links with fragments
    'sphinx.ext.duration',
    'sphinx.ext.doctest',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.intersphinx',
    'myst_parser',
    '_ext.generate_toc_html',
]

# Debugging flag for verbose output
verbose = True

intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'sphinx': ('https://www.sphinx-doc.org/en/master/', None),
}
intersphinx_disabled_domains = ['std']

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', 'index.md',
                    'external/slang/docs/stdlib-doc.md',
                    'external/slang/external',
]
include_patterns = ['index.rst', '*.md',
                    "external/slang/docs/user-guide/*.md",
                    "external/slang/docs/command-line-slangc-reference.md",
                    "external/core-module-reference/index.md",
                    "external/core-module-reference/attributes/**",
                    "external/core-module-reference/global-decls/**",
                    "external/core-module-reference/interfaces/**",
                    "external/core-module-reference/types/**",
                    "external/slangpy/docs/index.rst",
]

# Configure myst-parser for markdown files
myst_enable_extensions = [
    "colon_fence",
    "linkify",
    "smartquotes",
    "replacements",
    "html_image",
]

myst_url_schemes = ["http", "https", "mailto", "ftp"]
myst_heading_anchors = 3
myst_title_to_header = True

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "furo"
html_title = "Slang Documentation"
html_static_path = ['_static']
html_css_files = ["theme_overrides.css"]
html_js_files = [
    "section_highlight.js",
    "custom_body_classes.js",
]
html_theme_options = {
    "light_css_variables": {
        "color-api-background": "#f7f7f7",
    },
    "dark_css_variables": {
        "color-api-background": "#1e1e1e",
    },
}
