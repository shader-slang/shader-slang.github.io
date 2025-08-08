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
            restoreScrollPosition();
            scrollToElementIfNotVisible(currentPageElement);
            restoreRelativePosition(currentPageElement);
        }
    } catch (e) {
        // Log that we can't access parent URL due to cross-origin restrictions
        console.log('Cannot access parent URL:', e);
    }

    // Save scroll position and relative position when page unloads
    window.addEventListener('beforeunload', saveScrollPosition);
    window.addEventListener('beforeunload', saveRelativePosition);
});

function expandPathToElementAndChildren(element) {
    console.log('Expanding path to element and its children...');
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
    console.log('Expanded path to element and its children');
}

function saveScrollPosition() {
    console.log('Saving scroll position...');
    try {
        // Target the toc-content div which has the scroll attribute
        const scrollableContainer = document.querySelector('.toc-content');
        if (!scrollableContainer) {
            console.log('No scrollable container found!');
            return;
        }

        // Save the container's scroll position
        sessionStorage.setItem('sidebarScrollPosition', scrollableContainer.scrollTop);

        console.log('Saved scroll position to', scrollableContainer.scrollTop);
    } catch (e) {
        console.log('Could not save scroll position:', e);
    }
}

function saveRelativePosition() {
    console.log('Saving relative position of current page...');
    try {
        // Target the toc-content div which has the scroll attribute
        const scrollableContainer = document.querySelector('.toc-content');
        if (!scrollableContainer) {
            console.log('No scrollable container found!');
            return;
        }

        // Save the destination page's relative position within the viewport if it's visible
        const links = document.querySelectorAll('.sidebar-tree a.reference');
        links.forEach(function(link) {
            const linkUrl = new URL(link.href, window.location.origin);
            const rect = link.parentElement.getBoundingClientRect();
            const containerRect = scrollableContainer.getBoundingClientRect();
            const relativePosition = rect.top - containerRect.top;

            // Save the relative position for each visible page using its pathname as key
            const key = 'pageRelativePosition_' + linkUrl.pathname;
            sessionStorage.setItem(key, relativePosition);
        });

        console.log('Saved relative position of current page');
    } catch (e) {
        console.log('Could not save relative position of current page:', e);
    }
}

function restoreScrollPosition() {
    console.log('Restoring scroll position...');
    try {
        const scrollableContainer = document.querySelector('.toc-content');
        if (!scrollableContainer) {
            console.log('No scrollable container found!');
            return;
        }

        const savedScrollPosition = sessionStorage.getItem('sidebarScrollPosition');
        if (savedScrollPosition === null) {
            console.log('No scroll position to restore!');
            return;
        };

        // Restore scroll position to the toc-content container
        scrollableContainer.scrollTop = parseInt(savedScrollPosition, 10);
        console.log('Restored scroll position to', parseInt(savedScrollPosition, 10));
    } catch (e) {
        console.log('Could not restore scroll position:', e);
    }
}

function scrollToElementIfNotVisible(element) {
    console.log('Checking if current page is visible...');
    const rect = element.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight) {
        console.log('Current page is not visible, scrolling to show it...');

        element.scrollIntoView({
            behavior: 'instant',
            block: 'center'
        });

        console.log('Scrolled current page into view');
    } else {
        console.log('Current page is already visible');
    }
}

function restoreRelativePosition(element) {
    console.log('Restoring relative position of current page...');

    // Then try to restore the relative position it had on the previous page
    const parentUrl = window.parent.location.href;
    const parentUrlObj = new URL(parentUrl);
    const key = 'pageRelativePosition_' + parentUrlObj.pathname;
    const savedRelativePosition = sessionStorage.getItem(key);

    if (savedRelativePosition == null) {
        console.log('No relative position to restore!');
        return;
    }

    const scrollableContainer = document.querySelector('.toc-content');
    if (scrollableContainer == null) {
        console.log('No scrollable container found!');
        return;
    }

    const targetRelativePosition = parseInt(savedRelativePosition, 10);
    const currentRect = element.getBoundingClientRect();
    const containerRect = scrollableContainer.getBoundingClientRect();
    const currentRelativePosition = currentRect.top - containerRect.top;

    // Calculate how much we need to scroll to restore the relative position
    const adjustment = currentRelativePosition - targetRelativePosition;
    scrollableContainer.scrollTop += adjustment;

    console.log('Restored relative position of current page to', targetRelativePosition, 'with adjustment of', adjustment);
}
