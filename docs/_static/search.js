var txtSearch = document.getElementById("txtSearch");
var resultPanel = document.getElementById("tocSearchResult");
var searchPanelOutline = document.getElementById("tocSearchPanelInner");
var searchPanel = document.getElementById("tocSearchPanel");

let highlightedIndex = -1;

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// This getFullText function is designed to replicate the original GH Pages logic
// for constructing the display string, including stop conditions and popping.
function getFullText(furoATagElement) {
    var sb = [];

    if (furoATagElement && furoATagElement.textContent) {
        sb.push(furoATagElement.textContent.trim());
    }

    var currentDOMNode = furoATagElement ? furoATagElement.parentElement : null;

    while (currentDOMNode != null) {
        if (currentDOMNode.classList &&
            (currentDOMNode.classList.contains('sidebar-tree') ||
             currentDOMNode.classList.contains('sidebar-scroll') ||
             currentDOMNode.classList.contains('sidebar-sticky') ||
             currentDOMNode.tagName === 'NAV'
            )) {
            break;
        }

        if (currentDOMNode.tagName === 'LI' && currentDOMNode.className && currentDOMNode.className.includes('toctree-l')) {
            let liChildren = Array.from(currentDOMNode.children);
            let currentLiATag = null;
            for(let child of liChildren) {
                if (child.tagName === 'A' && child.classList.contains('reference') && child.classList.contains('internal')) {
                    currentLiATag = child;
                    break;
                } else if (child.tagName === 'P') {
                    let pLink = child.querySelector('a.reference.internal');
                    if (pLink) {
                        currentLiATag = pLink;
                        break;
                    }
                }
            }
            
            if (currentLiATag && currentLiATag.textContent) {
                var token = currentLiATag.textContent.trim();
                if (sb.length > 0) {
                    if (token.indexOf(" ") !== -1 || token === "Interfaces" || token === "Types") {
                        break; 
                    }
                }
                if (sb.length === 0 || sb[sb.length -1] !== token) {
                    sb.push(token);
                }
            }
        }
        currentDOMNode = currentDOMNode.parentElement;
    }

    if (sb.length > 2) {
        sb.pop();
        sb.pop();
    }

    sb.reverse();
    return sb.join(".");
}

function txtSearchFocus(event) {
    var searchText = txtSearch.value;
    if (searchText.length > 0 && resultPanel.children.length > 0 && resultPanel.textContent !== "No results found") {
        resultPanel.style.display = "block";
    }
    if (searchPanelOutline) searchPanelOutline.classList.add("search_panel_focused");
    if (searchPanelOutline) searchPanelOutline.classList.remove("search_panel_unfocused");
}

function isChildOf(child, parent) {
    while (child != null) {
        if (child == parent) return true;
        child = child.parentNode;
    }
    return false;
}

function closePanel() {
    if (resultPanel) resultPanel.style.display = "none";
}

function openPanel() {
    if (resultPanel) resultPanel.style.display = "block";
    positDropdown();
}

function txtSearchLostFocus(event) {
    if (searchPanelOutline) searchPanelOutline.classList.add("search_panel_unfocused");
    if (searchPanelOutline) searchPanelOutline.classList.remove("search_panel_focused");
}

function updateItemHighlight() {
    if (!resultPanel) return;
    let items = resultPanel.children;
    Array.from(items).forEach((item, index) => {
        item.classList.toggle('highlighted_search_selection', index === highlightedIndex);
    });
    if (highlightedIndex >= 0 && highlightedIndex < items.length) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function searchResultItemOnClick(event) {
    let target = event.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }
    if (target && target.tagName === 'A') {
        const link = target.getAttribute('href');
        if (link) {
            window.location.href = link;
        }
    }
}

function isPerfectMatch(searchText, title) {
    if (!searchText || !title) return false;
    searchText = searchText.toLowerCase();
    title = title.toLowerCase();
    
    // Split title into words and check if search text matches any word exactly
    const words = title.split(/\s+/);
    return words.some(word => word === searchText);
}

function txtSearchChange(event) {
    var searchText = txtSearch.value.trim();
    if (!resultPanel || !txtSearch) return;

    resultPanel.innerHTML = "";
    var searchTokens = searchText.toLowerCase().split(/[\\.:,\s]+/).filter(t => t.length > 0);

    if (searchText.length === 0 || searchTokens.length === 0) {
        resultPanel.style.display = "none";
        highlightedIndex = -1;
        return;
    }

    var matchedResults = [];
    let hasPerfectMatch = false;

    // -------- PHASE 1: TOC-based hierarchical search (existing logic) --------
    const allTocLinks = document.querySelectorAll('.sidebar-tree a.reference.internal');
    allTocLinks.forEach(innermostATag => {
        let currentTokenIndex = searchTokens.length - 1;
        let currentMatchCandidateLI = innermostATag.parentElement;
        let successfullyMatchedTocTokens = 0;
        let tempSearchTokens = [...searchTokens];

        while (currentMatchCandidateLI && currentTokenIndex >= 0) {
            if (currentMatchCandidateLI.tagName === 'LI' && currentMatchCandidateLI.className.includes('toctree-l')) {
                let liTextElement = currentMatchCandidateLI.querySelector('a.reference.internal');
                let textToMatch = (currentMatchCandidateLI === innermostATag.parentElement) ? 
                                  innermostATag.textContent.trim().toLowerCase() :
                                  (liTextElement ? liTextElement.textContent.trim().toLowerCase() : "");

                if (textToMatch.includes(tempSearchTokens[currentTokenIndex])) {
                    successfullyMatchedTocTokens++;
                    currentTokenIndex--; 
                    if (currentTokenIndex >=0) {
                        let parentUL = currentMatchCandidateLI.parentElement;
                        if (parentUL && parentUL.tagName === 'UL') {
                            currentMatchCandidateLI = parentUL.parentElement;
                            if(currentMatchCandidateLI && currentMatchCandidateLI.tagName !== 'LI') {
                                currentMatchCandidateLI = null;
                            }
                        } else {
                           currentMatchCandidateLI = null;
                        }
                    }
                } else {
                    break; 
                }
            } else {
                 currentMatchCandidateLI = currentMatchCandidateLI.parentElement;
            }
        }

        if (successfullyMatchedTocTokens === tempSearchTokens.length) {
            let displayString = getFullText(innermostATag); 
            let score = 2000 - displayString.length;
            let displayStringLower = displayString.toLowerCase();
            let allQueryTokensInDisplayString = true;
            for(let token of tempSearchTokens){
                if(!displayStringLower.includes(token)){
                    allQueryTokensInDisplayString = false;
                    break;
                }
            }
            if(allQueryTokensInDisplayString){
                const existing = matchedResults.find(r => r.display === displayString && r.href === innermostATag.getAttribute("href"));
                if (!existing) {
                    const isPerfect = isPerfectMatch(searchText, displayString);
                    if (isPerfect) hasPerfectMatch = true;
                    matchedResults.push({
                        display: displayString,
                        href: innermostATag.getAttribute("href"),
                        score: score + (isPerfect ? 1000 : 0),
                        type: 'toc'
                    });
                }
            }
        }
    });

    // -------- PHASE 2: Content search using Search._index --------
    if (typeof Search !== 'undefined' && Search._index && typeof DOCUMENTATION_OPTIONS !== 'undefined') {
        const searchIndex = Search._index;
        let docResults = {}; 
        const stemmer = (typeof Stemmer !== 'undefined' && Stemmer.stemWord) ? Stemmer.stemWord : (word => word.toLowerCase());
        const queryOriginalTokens = searchText.toLowerCase().split(/[\\.:,\s]+/).filter(t => t.length > 0);

        let stemmedSearchTokens = queryOriginalTokens.map(stemmer);
        
        stemmedSearchTokens.forEach((term, i) => {
            let originalTerm = queryOriginalTokens[i];
            let termDocs = searchIndex.terms[term];
            if(!termDocs && searchIndex.terms[originalTerm]) {
                termDocs = searchIndex.terms[originalTerm];
            }

            if (termDocs) {
                termDocs.forEach(docInfo => {
                    let docIndex = Array.isArray(docInfo) ? docInfo[0] : docInfo;
                    if (!docResults[docIndex]) {
                        docResults[docIndex] = {
                            title: searchIndex.titles[docIndex],
                            filename: searchIndex.filenames[docIndex],
                            docname: searchIndex.docnames[docIndex],
                            matchCount: 0,
                            score: 0
                        };
                    }
                    docResults[docIndex].matchCount++;
                    docResults[docIndex].score += (searchIndex.terms[term] && searchIndex.terms[term].length || 0) > 100 ? 1 : 10;
                    if (searchIndex.titles[docIndex] && searchIndex.titles[docIndex].toLowerCase().includes(originalTerm)) {
                        docResults[docIndex].score += 20;
                    }
                });
            }
        });

        for (const docIndex in docResults) {
            const result = docResults[docIndex];
            if (result.matchCount === stemmedSearchTokens.length) { 
                if (result.docname && !result.docname.startsWith('external/core-module-reference')) {
                    const pageTitle = result.title || "Untitled Page";
                    const urlRoot = DOCUMENTATION_OPTIONS.URL_ROOT || '';
                    let pageUrl = result.filename;
                    if (urlRoot.endsWith('/') && pageUrl.startsWith('/')) {
                        pageUrl = urlRoot + pageUrl.substring(1);
                    } else if (!urlRoot.endsWith('/') && !pageUrl.startsWith('/') && urlRoot !== '') {
                        pageUrl = urlRoot + '/' + pageUrl;
                    } else {
                        pageUrl = urlRoot + pageUrl;
                    }
                    
                    const existing = matchedResults.find(r => r.href === pageUrl);
                    if (!existing) {
                        const isPerfect = isPerfectMatch(searchText, pageTitle);
                        if (isPerfect) hasPerfectMatch = true;
                        matchedResults.push({
                            display: pageTitle,
                            href: pageUrl,
                            score: result.score + 500 + (isPerfect ? 1000 : 0),
                            type: 'content'
                        });
                    }
                }
            }
        }
    }

    matchedResults.sort((a, b) => b.score - a.score);

    // Add the "Search for..." item at the top
    // Get the URL root from the RTD documentation options
    let urlRoot = DOCUMENTATION_OPTIONS.URL_ROOT;

    // If the URL root is not set (e.g. for local development), get the script path and go up one directory
    if (urlRoot) {
        urlRoot = urlRoot + '/';
    } else {
        // If we're already on the search page, use relative path
        if (window.location.pathname.endsWith('/search.html')) {
            urlRoot = '';
        } else {
            try {
                const scriptSrc = document.currentScript ? document.currentScript.src : 
                                (document.scripts[document.scripts.length - 1] ? document.scripts[document.scripts.length - 1].src : '');
                if (scriptSrc) {
                    const url = new URL(scriptSrc);
                    const pathParts = url.pathname.split('/');
                    pathParts.pop(); // Remove the script filename
                    pathParts.pop(); // Go up one directory from _static
                    urlRoot = url.origin + pathParts.join('/') + '/';
                } else {
                    urlRoot = '';
                }
            } catch (e) {
                urlRoot = '';
            }
        }
    }
    
    searchUrl = urlRoot + 'search.html';
    resultPanel.innerHTML = `<div class='search_result_item' data-type='search'><a href="${searchUrl}?q=${encodeURIComponent(searchText)}"><span>Search Documentation for "${escapeHTML(searchText)}"</span></a></div>`;
    
    // Add the rest of the results
    resultPanel.innerHTML += matchedResults.map(r => 
        `<div class='search_result_item' data-type='${r.type}'><a href='${r.href}'><span>${escapeHTML(r.display)}</span></a></div>`
    ).join("");

    Array.from(resultPanel.children).forEach(child => {
        child.addEventListener("click", searchResultItemOnClick);
    });

    if (matchedResults.length > 0 || searchText.length > 0) {
        // If we have a perfect match, highlight the first matching result
        // Otherwise, highlight the "Search for..." item
        highlightedIndex = hasPerfectMatch ? 1 : 0;
        openPanel();
    } else {
        highlightedIndex = 0;
        closePanel();
    }
    updateItemHighlight();
}

const input = txtSearch;

if (input) {
    input.addEventListener('keydown', (e) => {
        if (!resultPanel) return;
        const items = resultPanel.children;
        if (items.length === 0 && e.key !== 'Escape') return;

        if (e.key === 'ArrowDown') {
            highlightedIndex++;
            if (highlightedIndex >= items.length) highlightedIndex = 0;
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            highlightedIndex--;
            if (highlightedIndex < 0) highlightedIndex = items.length - 1;
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (highlightedIndex > -1 && items[highlightedIndex]) {
                let selectedATag = items[highlightedIndex].querySelector('a');
                if (selectedATag && selectedATag.href) {
                    window.location.href = selectedATag.href;
                }
                e.preventDefault();
            }
        } else if (e.key === 'Escape') {
            closePanel();
        }
        updateItemHighlight();
    });

    input.addEventListener("blur", (e) => {
        setTimeout(() => {
            if (searchPanel && !searchPanel.contains(document.activeElement)) {
                 txtSearchLostFocus(e);
                 if(document.activeElement && !document.activeElement.closest('.search_result_item')){
                    closePanel();
                 }
            }
        }, 150);
    });
    input.addEventListener("focus", txtSearchFocus);
    input.addEventListener("input", txtSearchChange);
}

function positDropdown() {
    if (searchPanel && searchPanelOutline && resultPanel) {
        resultPanel.style.top = `${searchPanel.offsetHeight}px`;
        resultPanel.style.width = `${searchPanelOutline.offsetWidth}px`;
    }
}

window.addEventListener('load', positDropdown);
window.addEventListener('resize', positDropdown);

document.addEventListener('click', function(event) {
    if (resultPanel && searchPanel && !resultPanel.contains(event.target) && !searchPanel.contains(event.target) && event.target !== txtSearch) {
        closePanel();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.code === 'Backquote') { 
        event.preventDefault();
        if (txtSearch) txtSearch.focus(); 
    }
});

if (txtSearch && txtSearch.offsetParent !== null) {
    positDropdown();
}
