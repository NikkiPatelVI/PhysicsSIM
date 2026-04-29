const sectionLoader = (() => {
  // Resolve src relative to the current page's directory, regardless of
  // whether the URL has a trailing slash. /foo/bar resolves like /foo/bar/.
  function resolveSrc(src) {
    if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('/')) return src;
    const path = window.location.pathname;
    if (path.endsWith('/')) return path + src;
    const lastSegment = path.substring(path.lastIndexOf('/') + 1);
    if (lastSegment.includes('.')) {
      // last segment is a file — use its directory
      return path.substring(0, path.lastIndexOf('/') + 1) + src;
    }
    // directory URL without trailing slash — treat as directory
    return path + '/' + src;
  }

  async function loadPanel(panel) {
    if (!panel || panel.dataset.loaded === 'true') return;
    const src = panel.dataset.src;
    if (!src) return;

    panel.innerHTML = '<div class="loading-state">Loading content…</div>';

    try {
      const url = resolveSrc(src);
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const embedded = doc.querySelector('#embedded-content');
      panel.innerHTML = embedded ? embedded.innerHTML : html;
      panel.dataset.loaded = 'true';
      if (panel.id === 'tab-simulation' && typeof initFluidSims === 'function') {
        initFluidSims();
      }
    } catch (error) {
      console.warn('Section load failed:', error);
      panel.innerHTML = '<div class="loading-state">Unable to load content. Try again later.</div>';
    }
  }

  function loadActiveTab() {
    const panel = document.querySelector('.tab-panel.active');
    if (panel) loadPanel(panel);
  }

  return { loadPanel, loadActiveTab };
})();
