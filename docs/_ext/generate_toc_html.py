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
    """Render the TOC as HTML using Sphinx's native toctree structure."""
    html = ['<div class="sidebar-tree">']
    checkbox_counter = {'value': 1}  # Use a mutable container to track counter
    
    for caption, entries in sections:
        if caption:
            html.append(f'  <p class="caption" role="heading"><span class="caption-text">{caption}</span></p>')
            html.append('<ul>')
            for entry in entries:
                html.extend(render_entry(entry, level=1, indent=0, checkbox_counter=checkbox_counter))
            html.append('</ul>')
        else:
            html.append('<ul>')
            for entry in entries:
                html.extend(render_entry(entry, level=1, indent=0, checkbox_counter=checkbox_counter))
            html.append('</ul>')
    html.append('</div>')
    return '\n'.join(html)

def render_entry(entry, level=1, indent=0, checkbox_counter=None):
    """Render a single TOC entry with Sphinx's native CSS classes and structure."""
    # Determine if this entry has children
    has_children = bool(entry['children'])
    
    # Build CSS classes
    classes = [f'toctree-l{level}']
    if has_children:
        classes.append('has-children')
    
    html = []
    
    if has_children:
        # For entries with children, use single-line compact format like example.html
        checkbox_id = f'toctree-checkbox-{checkbox_counter["value"]}'
        checkbox_counter['value'] += 1
        
        # Build the complete line in one go
        if entry['link'].startswith(('http://', 'https://', 'mailto:')):
            # External link
            line = f'<li class="{" ".join(classes)}"><a class="reference external" href="{entry["link"]}" target="_parent">{entry["title"]}</a><input class="toctree-checkbox" id="{checkbox_id}" name="{checkbox_id}" role="switch" type="checkbox"/><label for="{checkbox_id}"><div class="visually-hidden">Toggle navigation of {entry["title"]}</div><i class="icon"><svg><use href="#svg-arrow-right"></use></svg></i></label><ul>'
        else:
            # Internal link
            line = f'<li class="{" ".join(classes)}"><a class="reference internal" href="{entry["link"]}" target="_parent">{entry["title"]}</a><input class="toctree-checkbox" id="{checkbox_id}" name="{checkbox_id}" role="switch" type="checkbox"/><label for="{checkbox_id}"><div class="visually-hidden">Toggle navigation of {entry["title"]}</div><i class="icon"><svg><use href="#svg-arrow-right"></use></svg></i></label><ul>'
        
        html.append(line)
        
        # Add children
        for child_caption, child_entries in entry['children']:
            if child_caption:
                html.append(f'<p class="caption" role="heading"><span class="caption-text">{child_caption}</span></p>')
                for child in child_entries:
                    html.extend(render_entry(child, level=level+1, indent=0, checkbox_counter=checkbox_counter))
            else:
                for child in child_entries:
                    html.extend(render_entry(child, level=level+1, indent=0, checkbox_counter=checkbox_counter))
        html.append('</ul>')
        html.append('</li>')
    else:
        # For simple entries without children, use single-line format like example.html
        if entry['link'].startswith(('http://', 'https://', 'mailto:')):
            # External link
            html.append(f'<li class="{" ".join(classes)}"><a class="reference external" href="{entry["link"]}" target="_parent">{entry["title"]}</a></li>')
        else:
            # Internal link
            html.append(f'<li class="{" ".join(classes)}"><a class="reference internal" href="{entry["link"]}" target="_parent">{entry["title"]}</a></li>')
    
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

    # Write the TOC to _static/toc.html with sphinx toctree styling
    out_path = os.path.join(app.outdir, '_static', 'toc.html')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # Create a complete HTML document with sphinx toctree styling
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Table of Contents</title>
    <link rel="stylesheet" href="styles/furo.css">
    <link rel="stylesheet" href="styles/furo-extensions.css">
    <link rel="stylesheet" href="theme_overrides.css">
    <style>
        /* Make iframe body fill height and be scrollable */
        html, body {{
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden; /* Prevent iframe from being scrollable */
            background: var(--color-sidebar-background);
        }}
        
        /* Keep search panel fixed at top */
        #tocSearchPanel {{
            position: sticky;
            top: 0;
            z-index: 10;
            background: var(--color-sidebar-background, #f8f9fb);
        }}
        
        /* Make only the TOC content scrollable */
        .toc-content {{
            height: calc(100vh - 60px); /* Adjust based on search panel height */
            overflow-y: auto;
            overflow-x: hidden;
        }}
        
        /* Remove container scrolling */
        .content-container {{
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: var(--color-sidebar-background);
        }}
        
        /* Ensure TOC content area has correct background */
        .toc-content {{
            background: var(--color-sidebar-background);
        }}
        
        /* Ensure sidebar tree uses proper styling */
        .sidebar-tree {{
            font-size: var(--sidebar-item-font-size);
        }}
        .sidebar-tree .caption,
        .sidebar-tree .caption-text {{
            font-size: var(--sidebar-caption-font-size);
        }}
        
        /* Style for current page */
        .sidebar-tree .current-page > .reference {{
            font-weight: bold;
            color: var(--color-brand-primary);
        }}
    </style>
    
    <!-- SVG symbol definitions for navigation arrows (matching Sphinx/Furo) -->
    <svg style="display: none;">
      <symbol id="svg-arrow-right" viewBox="0 0 24 24">
        <title>Expand</title>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather-chevron-right">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </symbol>
    </svg>
</head>
<body>
<div class="content-container">
    <div id="tocSearchPanel">
        <div id="tocSearchPanelInner">
            <input type="text" id="txtSearch" placeholder="Search..." autocomplete="off" />
        </div>
        <div id="tocSearchResult" style="display: none;"></div>
    </div>
    <div class="toc-content">
{html}
    </div>
</div>
<script>
// Initialize all expandable sections to be open by default
document.addEventListener('DOMContentLoaded', function() {{
    const checkboxes = document.querySelectorAll('.toctree-checkbox');
    checkboxes.forEach(function(checkbox) {{
        checkbox.checked = true; // Start expanded
    }});
    
    // Highlight current page
    try {{
        const parentUrl = window.parent.location.href;
        const links = document.querySelectorAll('.sidebar-tree a.reference');
        
        links.forEach(function(link) {{
            const linkUrl = new URL(link.href, window.location.origin);
            const parentUrlObj = new URL(parentUrl);
            
            // Compare the pathname (ignoring hash and query parameters)
            if (linkUrl.pathname === parentUrlObj.pathname) {{
                link.parentElement.classList.add('current-page');
            }}
        }});
    }} catch (e) {{
        // If we can't access parent URL due to cross-origin restrictions,
        // try to get it from the referrer or use a different method
        console.log('Cannot access parent URL:', e);
    }}
}});
</script>
<script src="search.js"></script>
</body>
</html>"""
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    logger.info(f"Generated {out_path}")

def setup(app):
    app.connect('build-finished', generate_toc_html) 