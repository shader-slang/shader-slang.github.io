// Listen for theme changes from parent window
window.addEventListener('message', function(event) {{
    if (event.data && event.data.type === 'theme-change') {{
        document.body.setAttribute('data-theme', event.data.theme);
    }}
}});