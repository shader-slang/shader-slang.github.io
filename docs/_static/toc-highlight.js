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
    // Start from the current page's list item and walk up the ancestry
    let currentLi = element.closest('li');
    
    while (currentLi) {
        // Find the parent ul of this li
        const parentUl = currentLi.parentElement;
        if (!parentUl || parentUl.tagName !== 'UL') {
            break;
        }
        
        // Find the parent li of that ul (this is the section that contains our current path)
        const parentLi = parentUl.parentElement;
        if (!parentLi || parentLi.tagName !== 'LI') {
            break;
        }
        
        // Look for a checkbox specifically in this parent li (not descendants)
        const checkbox = parentLi.querySelector(':scope > .toctree-checkbox');
        if (checkbox) {
            checkbox.checked = true;
        }
        
        // Move up to the next level
        currentLi = parentLi;
    }
} 