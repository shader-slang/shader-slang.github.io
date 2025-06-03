import re
from pathlib import Path
from sphinx.util import logging
from sphinx import addnodes
from docutils import nodes
import os

def extract_commented_toctree(content):
    """Extract the toctree content from a commented block."""
    pattern = re.compile(r'<!-- RTD-TOC-START\s*(.*?)\s*RTD-TOC-END -->', re.DOTALL)
    match = pattern.search(content)
    if match:
        # Extract the content and parse the toctree directive
        toctree_content = match.group(1)
        # Find the toctree directive
        toctree_pattern = re.compile(r'```{toctree}\s*(.*?)\s*```', re.DOTALL)
        toctree_match = toctree_pattern.search(toctree_content)
        if toctree_match:
            return toctree_match.group(1)
    return None

def parse_toctree_options(content):
    """Parse toctree options from the content."""
    options = {}
    lines = content.strip().split('\n')
    for line in lines:
        if line.startswith(':'):
            parts = line[1:].split(':', 1)
            if len(parts) == 2:
                key, value = parts
                options[key.strip()] = value.strip()
    return options

def parse_toctree_entries(content):
    """Parse entries from a toctree directive."""
    entries = []
    lines = content.strip().split('\n')
    for line in lines:
        if line.strip() and not line.startswith(':'):
            # Handle both formats:
            # 1. "Title <link>"
            # 2. Just the link
            if '<' in line:
                parts = line.strip().split('<')
                if len(parts) == 2:
                    title = parts[0].strip()
                    link = parts[1].strip().rstrip('>')
                    entries.append((title, link))
            else:
                link = line.strip()
                entries.append((None, link))
    return entries

def get_title(env, docname):
    """Get the title of a document from its doctree."""
    doctree = env.get_doctree(docname)
    for node in doctree.traverse(nodes.title):
        return node.astext()
    return docname

def get_docname_from_link(env, current_doc, link):
    """Get the full docname from a relative link."""
    if link.startswith(('http://', 'https://', 'mailto:')):
        return link
    
    # Get the directory of the current document
    current_dir = os.path.dirname(env.doc2path(current_doc))
    if not current_dir:
        return link
    
    # Resolve the relative path
    full_path = os.path.normpath(os.path.join(current_dir, link))
    # Convert back to docname format
    docname = os.path.relpath(full_path, env.srcdir).replace('\\', '/')
    if docname.endswith('.rst') or docname.endswith('.md'):
        docname = docname.rsplit('.', 1)[0]
    return docname

def process_document(env, docname, parent_maxdepth=1, processed_docs=None):
    """Process a single document for both commented and uncommented toctrees."""
    if processed_docs is None:
        processed_docs = set()
    
    if docname in processed_docs:
        return []
    
    processed_docs.add(docname)
    logger = logging.getLogger(__name__)
    sections = []
    
    # Get the document's doctree
    doctree = env.get_doctree(docname)
    
    # First check for commented toctree
    doc_path = env.doc2path(docname)
    logger.info(f"Checking for commented toctree in {doc_path}")
    with open(doc_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    toctree_content = extract_commented_toctree(content)
    if toctree_content:
        logger.info(f"Found commented toctree in {docname}")
        # Parse toctree options and entries
        options = parse_toctree_options(toctree_content)
        entries = parse_toctree_entries(toctree_content)
        logger.info(f"Parsed {len(entries)} entries from commented toctree")
        
        # Process the entries
        processed_entries = []
        for title, link in entries:
            if link.startswith(('http://', 'https://', 'mailto:')):
                # External link
                processed_entries.append({
                    'title': title or link,
                    'link': link,
                    'children': []
                })
            else:
                # Internal link - resolve the full docname
                ref = get_docname_from_link(env, docname, link)
                if ref in env.found_docs:
                    # Recursively process the referenced document
                    sub_sections = process_document(env, ref, parent_maxdepth, processed_docs)
                    processed_entries.append({
                        'title': title or get_title(env, ref),
                        'link': '../' + env.app.builder.get_target_uri(ref).lstrip('/'),
                        'children': sub_sections
                    })
                else:
                    # Link not found
                    processed_entries.append({
                        'title': title or link,
                        'link': '../' + env.app.builder.get_target_uri(link).lstrip('/'), # Use original link for not found
                        'children': []
                    })
        sections.append((None, processed_entries))
    
    # Then process uncommented toctrees
    uncommented_toctrees = list(doctree.traverse(addnodes.toctree))
    logger.info(f"Found {len(uncommented_toctrees)} uncommented toctrees in {docname}")
    for node in uncommented_toctrees:
        caption = node.get('caption')
        maxdepth = node.get('maxdepth', parent_maxdepth)
        entries = []
        for (title, link) in node['entries']:
            if link.startswith(('http://', 'https://', 'mailto:')):
                # External link
                entries.append({
                    'title': title or link,
                    'link': link,
                    'children': []
                })
            else:
                # Internal link - resolve the full docname
                ref = get_docname_from_link(env, docname, link)
                if ref in env.found_docs:
                    # Recursively process the referenced document
                    sub_sections = process_document(env, ref, maxdepth, processed_docs)
                    entries.append({
                        'title': title or get_title(env, ref),
                        'link': '../' + env.app.builder.get_target_uri(ref).lstrip('/'),
                        'children': sub_sections
                    })
                else:
                    # Link not found
                    entries.append({
                        'title': title or link,
                        'link': '../' + env.app.builder.get_target_uri(link).lstrip('/'), # Use original link for not found
                        'children': []
                    })
        sections.append((caption, entries))
    
    return sections

def render_toc_html_from_doctree(sections):
    """Render the TOC as HTML from doctree sections."""
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

    logger.info(f"Starting TOC generation from master doc: {master_doc}")
    # Process all documents recursively
    sections = process_document(env, master_doc)
    logger.info(f"Found {len(sections)} sections in total")
    html = render_toc_html_from_doctree(sections)

    # Write the TOC to _static/toc.html
    out_path = os.path.join(app.outdir, '_static', 'toc.html')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    logger.info(f"Generated {out_path}")

def setup(app):
    app.connect('build-finished', generate_toc_html) 