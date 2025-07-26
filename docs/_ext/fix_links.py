"""
Custom Sphinx extension to fix relative links with fragment identifiers.
"""
from sphinx.util import logging
import re
import os
from sphinx.application import Sphinx

logger = logging.getLogger(__name__)

def fix_md_links_post_process(app, exception):
    """
    Post-processing to fix links in the HTML output files.
    This is our main function that runs after the build is complete.
    """
    if exception:
        return

    # Only run in HTML builder
    if app.builder.name != 'html':
        return

    output_dir = app.builder.outdir
    logger.info(f"[DEBUG] Post-processing HTML files in {output_dir}")

    count = 0
    fixed = 0

    # Walk through ALL HTML files in the output directory
    for root, _, files in os.walk(output_dir):
        for filename in files:
            if filename.endswith('.html'):
                filepath = os.path.join(root, filename)
                count += 1
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    original_content = content

                    # Fix any href="#something" where something looks like a path (contains / or .html)
                    pattern = r'href=(["\'])#([^"\']+?)(#[^"\']+)?\1'
                    def repl(match):
                        quote, path, fragment = match.group(1), match.group(2), match.group(3) or ''
                        # Only rewrite if path looks like a file or path, not just a fragment
                        if '/' in path or '.html' in path:
                            return f'href={quote}{path}{fragment}{quote}'
                        else:
                            return match.group(0)  # leave as is for pure fragments

                    content = re.sub(pattern, repl, content)

                    if content != original_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        fixed += 1
                        logger.info(f"[DEBUG] Fixed file: {filepath}")

                except Exception as e:
                    logger.info(f"[DEBUG] Error processing {filepath}: {e}")
    logger.info(f"[DEBUG] Post-processed {count} HTML files, fixed {fixed} files")


def setup(app: Sphinx):
    """Set up the extension."""
    logger.info("[DEBUG] Registering link fixer extension (post-processing only)")

    # Register post-processing function to run after the build is complete
    app.connect('build-finished', fix_md_links_post_process)

    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }