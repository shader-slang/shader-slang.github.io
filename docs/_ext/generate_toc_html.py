from docutils import nodes
from sphinx.util import logging
from sphinx import addnodes  # Import Sphinx addnodes for toctree
import os

def get_title(env, docname):
    """Get the title of a document from its doctree."""
    doctree = env.get_doctree(docname)
    for node in doctree.traverse(nodes.title):
        return node.astext()
    return docname

def walk_toctrees(env, docname, parent_maxdepth=1):
    """Recursively walk toctrees, yielding (caption, entries) tuples."""
    doctree = env.get_doctree(docname)
    for node in doctree.traverse(addnodes.toctree):  # Use addnodes.toctree
        caption = node.get('caption')
        maxdepth = node.get('maxdepth', parent_maxdepth)
        entries = []
        for (title, ref) in node['entries']:
            if ref.endswith('.rst') or ref.endswith('.md'):
                ref = ref.rsplit('.', 1)[0]
            if ref in env.found_docs:
                # Check if this entry has its own toctree (i.e., is a nested section)
                sub_doctree = env.get_doctree(ref)
                sub_toctrees = list(sub_doctree.traverse(addnodes.toctree))  # Use addnodes.toctree
                if sub_toctrees:
                    # Recursively walk nested toctree
                    sub_sections = list(walk_toctrees(env, ref, maxdepth))
                    entries.append({
                        'title': title or get_title(env, ref),
                        'link': '../' + env.app.builder.get_target_uri(ref).lstrip('/'),
                        'children': sub_sections
                    })
                else:
                    entries.append({
                        'title': title or get_title(env, ref),
                        'link': '../' + env.app.builder.get_target_uri(ref).lstrip('/'),
                        'children': []
                    })
            else:
                # External link or not found
                entries.append({
                    'title': title or ref,
                    'link': ref,
                    'children': []
                })
        yield (caption, entries)

def render_toc_html(sections):
    """Render the TOC as HTML."""
    html = []
    for caption, entries in sections:
        if caption:
            html.append(f'<h3>{caption}</h3>')
        html.append('<ul>')
        for entry in entries:
            html.append(render_entry(entry))
        html.append('</ul>')
    return '\n'.join(html)

def render_entry(entry):
    html = f'<li><a href="{entry["link"]}" target="_top">{entry["title"]}</a>'
    if entry['children']:
        html += '<ul>'
        for child_caption, child_entries in entry['children']:
            if child_caption:
                html += f'<li><strong>{child_caption}</strong></li>'
            for child in child_entries:
                html += render_entry(child)
        html += '</ul>'
    html += '</li>'
    return html

def generate_toc_html(app, exception):
    logger = logging.getLogger(__name__)
    env = app.builder.env
    master_doc = app.config.master_doc if hasattr(app.config, 'master_doc') else 'index'
    if master_doc not in env.found_docs:
        logger.warning(f"Master doc '{master_doc}' not found in env.found_docs")
        return
    sections = list(walk_toctrees(env, master_doc))
    html = render_toc_html(sections)
    out_path = os.path.join(app.outdir, '_static', 'toc.html')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    logger.info(f"Generated {out_path}")

def setup(app):
    app.connect('build-finished', generate_toc_html) 