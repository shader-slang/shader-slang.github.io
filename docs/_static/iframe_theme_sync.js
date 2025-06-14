// Theme synchronization for iframe
(function() {
    'use strict';
    
    // Function to notify iframe about theme changes
    function notifyIframeOfThemeChange(theme) {
        const iframe = document.querySelector('.custom-nav iframe');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({
                    type: 'theme-change',
                    theme: theme
                }, '*');
            } catch (e) {
                console.warn('Could not send theme change message to iframe:', e);
            }
        }
    }
    
    // Function to get current theme
    function getCurrentTheme() {
        return document.body.getAttribute('data-theme') || 'auto';
    }
    
    // Monitor theme changes using MutationObserver
    function observeThemeChanges() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = getCurrentTheme();
                    notifyIframeOfThemeChange(newTheme);
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Start observing theme changes
        observeThemeChanges();
        
        // Send initial theme when iframe loads
        const iframe = document.querySelector('.custom-nav iframe');
        if (iframe) {
            iframe.addEventListener('load', function() {
                notifyIframeOfThemeChange(getCurrentTheme());
            });
        }
    });
})(); 