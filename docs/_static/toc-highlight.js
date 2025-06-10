document.addEventListener('DOMContentLoaded', function() {
    // Highlight current page and expand path to it
    try {
        const parentUrl = window.parent.location.href;
        const links = document.querySelectorAll('.sidebar-tree a.reference');
        let currentPageElement = null;
        
        links.forEach(function(link) {
            const linkUrl = new URL(link.href, window.location.origin);
            const parentUrlObj = new URL(parentUrl);
            
            // Compare the pathname (ignoring hash and query parameters)
            if (linkUrl.pathname === parentUrlObj.pathname) {
                link.parentElement.classList.add('current-page');
                currentPageElement = link.parentElement;
            }
        });
        
        // If we found the current page, expand the path to it
        if (currentPageElement) {
            expandPathToElement(currentPageElement);
            
            // Scroll to make the current page visible
            setTimeout(function() {
                currentPageElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100); // Small delay to ensure expansion is complete
        }
        
    } catch (e) {
        // Log that we can't access parent URL due to cross-origin restrictions
        console.log('Cannot access parent URL:', e);
    }
});

function expandPathToElement(element) {
    // Walk up the DOM tree and expand all parent sections
    let current = element.parentElement;
    
    while (current && current !== document.body) {
        // Look for a toctree-checkbox in this level or parent levels
        const checkbox = current.querySelector('.toctree-checkbox');
        if (checkbox) {
            checkbox.checked = true;
        }
        
        // Also check if current element is a list item with a checkbox as a sibling
        if (current.tagName === 'LI') {
            const prevCheckbox = current.querySelector('.toctree-checkbox');
            if (prevCheckbox) {
                prevCheckbox.checked = true;
            }
        }
        
        // Move up the tree
        current = current.parentElement;
    }
    
    // Also check for any parent ul elements that might have checkboxes
    let parentUl = element.closest('ul');
    while (parentUl) {
        // Find the parent li of this ul
        const parentLi = parentUl.parentElement;
        if (parentLi && parentLi.tagName === 'LI') {
            const checkbox = parentLi.querySelector('.toctree-checkbox');
            if (checkbox) {
                checkbox.checked = true;
            }
        }
        // Move to the next parent ul
        parentUl = parentUl.parentElement ? parentUl.parentElement.closest('ul') : null;
    }
} 