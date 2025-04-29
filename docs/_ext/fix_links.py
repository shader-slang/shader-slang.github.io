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

    # Specifically focus on stdlib-reference directory
    stdlib_dir = os.path.join(output_dir, 'external', 'stdlib-reference')
    if not os.path.exists(stdlib_dir):
        logger.info(f"[DEBUG] stdlib-reference directory not found: {stdlib_dir}")
        return

    count = 0
    fixed = 0

    # Walk through HTML files
    for root, _, files in os.walk(stdlib_dir):
        for filename in files:
            if filename.endswith('.html'):
                filepath = os.path.join(root, filename)
                count += 1

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Original content for comparison
                    original_content = content

                    # Look for href="#../path/to/file#fragment" pattern
                    # This is the problematic pattern where a relative path is treated as a fragment
                    pattern = r'href=(["\'])#(\.\.\/[^"\']+?)#([^"\']+?)\1'
                    matches = re.findall(pattern, content)

                    if matches:
                        logger.info(f"[DEBUG] Found {len(matches)} problematic links in {filepath}")

                        # Fix each match
                        for quote, path, fragment in matches:
                            # Create the correct path with .html extension
                            if not path.endswith('/') and '.' not in path.split('/')[-1]:
                                path_with_html = path + '.html'
                            else:
                                path_with_html = path

                            # Replace in content
                            old = f'href={quote}#{path}#{fragment}{quote}'
                            new = f'href={quote}{path_with_html}#{fragment}{quote}'
                            content = content.replace(old, new)
                            logger.info(f"[DEBUG] Fixed: {old} -> {new}")

                    # Also fix simpler case: href="#../path/to/file"
                    pattern = r'href=(["\'])#(\.\.\/[^"\'#]+?)\1'
                    matches = re.findall(pattern, content)

                    if matches:
                        logger.info(f"[DEBUG] Found {len(matches)} simple problematic links in {filepath}")

                        # Fix each match
                        for quote, path in matches:
                            # Create the correct path with .html extension
                            if not path.endswith('/') and '.' not in path.split('/')[-1]:
                                path_with_html = path + '.html'
                            else:
                                path_with_html = path

                            # Replace in content
                            old = f'href={quote}#{path}{quote}'
                            new = f'href={quote}{path_with_html}{quote}'
                            content = content.replace(old, new)
                            logger.info(f"[DEBUG] Fixed: {old} -> {new}")

                    # Save the file if changes were made
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