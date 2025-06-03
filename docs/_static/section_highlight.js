// Add highlight to the target section
const hash = window.location.hash.substring(1);

function highlightHashSection(hashName) {
    if (!hashName) return;
    const elements = document.querySelectorAll('[id="' + hashName + '"]');
    elements.forEach(anchor => {
        let target = null;
        // If the anchor is inside a heading, highlight the heading
        if (anchor.parentElement && /^H[1-6]$/.test(anchor.parentElement.tagName)) {
            target = anchor.parentElement;
        }
        // If the anchor is an empty <a> or <span>, try to find the next visible heading/field sibling
        if (!target && (anchor.tagName === 'A' || anchor.tagName === 'SPAN') && (!anchor.textContent.trim() || anchor.offsetHeight === 0)) {
            let sibling = anchor.nextSibling;
            while (sibling) {
                if (sibling.nodeType === 1 && // ELEMENT_NODE
                    (
                        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DT', 'DD', 'LI', 'PRE', 'TR'].includes(sibling.tagName) ||
                        sibling.classList.contains('field') ||
                        sibling.classList.contains('field-item') ||
                        sibling.classList.contains('highlight') ||
                        sibling.classList.contains('code')
                    )
                ) {
                    target = sibling;
                    break;
                }
                sibling = sibling.nextSibling;
            }
        }
        // Fallback: traverse up to find a field/code/line container, but not a generic div or section
        if (!target) {
            let up = anchor;
            while (up && up.parentElement) {
                if (
                    ['LI', 'DT', 'DD', 'TR', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(up.tagName) ||
                    up.classList.contains('field') ||
                    up.classList.contains('field-item') ||
                    up.classList.contains('highlight') ||
                    up.classList.contains('code')
                ) {
                    target = up;
                    break;
                }
                up = up.parentElement;
            }
        }
        // Only highlight if the target is visible, not whitespace, and not a section/article/div
        if (
            target &&
            target.offsetHeight > 0 &&
            target.textContent.trim() &&
            !['SECTION', 'ARTICLE', 'DIV', 'BODY', 'HTML'].includes(target.tagName)
        ) {
            target.classList.add('goto_highlight');
            setTimeout(() => {
                target.classList.add('goto_highlight_fade_out');
                setTimeout(() => {
                    target.classList.remove('goto_highlight');
                    target.classList.remove('goto_highlight_fade_out');
                }, 2000);
            }, 5000);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash.substring(1);
    highlightHashSection(hash);
    window.onhashchange = function() {
        const newHash = window.location.hash.substring(1);
        highlightHashSection(newHash);
    };
}); 