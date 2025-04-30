# SPDX-License-Identifier: Apache-2.0
# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information
import os
import sys
sys.path.insert(0, os.path.abspath('.'))  # For finding _ext
sys.path.insert(0, os.path.abspath('..'))

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
    '_ext.fix_toc',  # Simple extension to set titlesonly=True
]

# Debugging flag for verbose output
verbose = True

intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'sphinx': ('https://www.sphinx-doc.org/en/master/', None),
}
intersphinx_disabled_domains = ['std']

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', 'index.md']

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
html_css_files = ["theme_overrides.css"]
html_theme_options = {
    "light_css_variables": {
        "color-api-background": "#f7f7f7",
    },
    "dark_css_variables": {
        "color-api-background": "#1e1e1e",
    },
}

# Use default Furo sidebar configuration - remove custom sidebar
# html_sidebars = {}  # Let Furo use its defaults