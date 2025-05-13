// Add highlight to the target section
const hash = window.location.hash.substring(1);

// Highlight the currently visiting section.
function highlightHashSection(hashName) {
    const elements = document.querySelectorAll('[id="' + hashName + '"]');
    elements.forEach(anchor => {
        anchor.classList.add('goto_highlight');
        setTimeout(() => {
            anchor.classList.add('goto_highlight_fade_out');
            setTimeout(() => {
                anchor.classList.remove('goto_highlight');
                anchor.classList.remove('goto_highlight_fade_out');
            }, 2000);
        }, 5000);
    });
}

// Initial highlight on page load
highlightHashSection(hash);

// Highlight on hash change
window.onhashchange = function() {
    const newHash = window.location.hash.substring(1);
    highlightHashSection(newHash);
}; 