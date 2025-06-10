document.addEventListener('DOMContentLoaded', function() {
    // Highlight current page
    try {
        const parentUrl = window.parent.location.href;
        const links = document.querySelectorAll('.sidebar-tree a.reference');
        
        links.forEach(function(link) {
            const linkUrl = new URL(link.href, window.location.origin);
            const parentUrlObj = new URL(parentUrl);
            
            // Compare the pathname (ignoring hash and query parameters)
            if (linkUrl.pathname === parentUrlObj.pathname) {
                link.parentElement.classList.add('current-page');
            }
        });
    } catch (e) {
        // Log that we can't access parent URL due to cross-origin restrictions
        console.log('Cannot access parent URL:', e);
    }
}); 