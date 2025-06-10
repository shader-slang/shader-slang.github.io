document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/external/core-module-reference/')) {
    document.body.classList.add('core-module-reference-page');
  }
});