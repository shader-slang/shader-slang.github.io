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

function txtSearchChange(event) {
    var searchText = txtSearch.value.trim();
    if (!resultPanel || !txtSearch) return;

    resultPanel.innerHTML = "";
    const allLinks = document.querySelectorAll('.sidebar-tree a.reference.internal');
    var searchTokens = searchText.toLowerCase().split(/[\\.:,]+/).filter(t => t.length > 0);

    if (searchText.length === 0 || searchTokens.length === 0) {
        resultPanel.style.display = "none";
        highlightedIndex = -1;
        return;
    }

    var matchedResults = [];

    allLinks.forEach(innermostATag => {
        let currentTokenIndex = searchTokens.length - 1;
        let currentMatchCandidateLI = innermostATag.parentElement;
        let successfullyMatchedTokens = 0;
        let potentialPath = [];

        while (currentMatchCandidateLI && currentTokenIndex >= 0) {
            if (currentMatchCandidateLI.tagName === 'LI' && currentMatchCandidateLI.className.includes('toctree-l')) {
                let liTextElement = currentMatchCandidateLI.querySelector('a.reference.internal');
                let textToMatch = (currentMatchCandidateLI === innermostATag.parentElement) ? 
                                  innermostATag.textContent.trim().toLowerCase() :
                                  (liTextElement ? liTextElement.textContent.trim().toLowerCase() : "");

                if (textToMatch.includes(searchTokens[currentTokenIndex])) {
                    potentialPath.push(liTextElement ? liTextElement.textContent.trim() : innermostATag.textContent.trim());
                    successfullyMatchedTokens++;
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

        if (successfullyMatchedTokens === searchTokens.length) {
            let displayString = getFullText(innermostATag); 
            let score = 1000 - displayString.length;
            
            let displayStringLower = displayString.toLowerCase();
            let allTokensInDisplayString = true;
            for(let token of searchTokens){
                if(!displayStringLower.includes(token)){
                    allTokensInDisplayString = false;
                    break;
                }
            }

            if(allTokensInDisplayString){
                 matchedResults.push({
                    html: `<div class='search_result_item'><a href='${innermostATag.getAttribute("href")}'><span>${escapeHTML(displayString)}</span></a></div>`,
                    score: score
                });
            }
        }
    });

    matchedResults.sort((a, b) => b.score - a.score);
    resultPanel.innerHTML = matchedResults.map(r => r.html).join("");

    Array.from(resultPanel.children).forEach(child => {
        child.addEventListener("click", searchResultItemOnClick);
    });

    if (matchedResults.length > 0) {
        highlightedIndex = 0;
        openPanel();
    } else {
        highlightedIndex = -1;
        if (searchText.length > 0) {
            resultPanel.innerHTML = "<div class='search_result_item'><span>No results found</span></div>";
            openPanel();
        } else {
            closePanel();
        }
    }
    updateItemHighlight();
}

const input = txtSearch;
const dropdown = resultPanel;

if (input) {
    input.addEventListener('keydown', (e) => {
        if (!dropdown) return;
        const items = dropdown.children;
        if (items.length === 0 && !(e.key === 'Escape')) return;

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
            if (!document.activeElement || !searchPanel.contains(document.activeElement)) {
                 txtSearchLostFocus(e);
                 if(document.activeElement && !document.activeElement.closest('.search_result_item')){
                    closePanel();
                 }
            }
        }, 100);
    });
    input.addEventListener("focus", txtSearchFocus);
    input.addEventListener("input", txtSearchChange);
}

function positDropdown() {
    if (searchPanel && searchPanelOutline && dropdown) {
        dropdown.style.top = `${searchPanel.offsetHeight + 2}px`;
        dropdown.style.width = `${searchPanelOutline.offsetWidth}px`;
    }
}

window.addEventListener('load', positDropdown);
window.addEventListener('resize', positDropdown);

document.addEventListener('click', function(event) {
    if (dropdown && searchPanel && !dropdown.contains(event.target) && !searchPanel.contains(event.target) && event.target !== txtSearch) {
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
