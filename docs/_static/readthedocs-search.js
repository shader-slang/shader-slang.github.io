// Integrate with ReadTheDocs search
document.addEventListener("DOMContentLoaded", function(event) {
    const searchInput = document.querySelector(".sidebar-search");
    if (searchInput) {
        // Override the default search behavior
        searchInput.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const event = new CustomEvent("readthedocs-search-show");
            document.dispatchEvent(event);
        });
    }
}); 