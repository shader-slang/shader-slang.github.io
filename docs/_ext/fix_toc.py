from docutils import nodes
from sphinx.transforms import SphinxTransform
from sphinx.addnodes import toctree

class TocFilter(SphinxTransform):
    """Ensure toctree nodes have titlesonly set to true."""

    default_priority = 700

    def apply(self, **kwargs):
        # Find all toctree nodes
        for toctree_node in self.document.traverse(toctree):
            # Make sure the 'titlesonly' option is set
            toctree_node['titlesonly'] = True

def setup(app):
    app.add_transform(TocFilter)
    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
