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
        
        // If we found the current page, expand the path to it and expand its children
        if (currentPageElement) {
            expandPathToElementAndChildren(currentPageElement);
            
            // After expansion, restore the scroll position
            setTimeout(function() {
                restoreScrollPosition();
            }, 50); // Small delay to ensure expansion is complete
        }
        
    } catch (e) {
        // Log that we can't access parent URL due to cross-origin restrictions
        console.log('Cannot access parent URL:', e);
    }
    
    // Save scroll position when page unloads
    window.addEventListener('beforeunload', saveScrollPosition);
});

function expandPathToElementAndChildren(element) {
    // Start from the current page's list item
    let currentLi = element.closest('li');
    if (!currentLi) return;
    
    // First, expand the current page's own children if it has any
    const currentCheckbox = currentLi.querySelector(':scope > .toctree-checkbox');
    if (currentCheckbox) {
        currentCheckbox.checked = true;
    }
    
    // Then walk up the ancestry to expand the path to this element
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

function saveScrollPosition() {
    try {
        window.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    } catch (e) {
        console.log('Could not save scroll position:', e);
    }
}

function restoreScrollPosition() {
    try {
        if (window.savedScrollPosition === undefined) return;
        
        // Restore the exact scroll position
        window.scrollTo({
            top: window.savedScrollPosition,
            behavior: 'instant'
        });
    } catch (e) {
        console.log('Could not restore scroll position:', e);
    }
} 