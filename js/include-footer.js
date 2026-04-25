(function () {
  try {
    var script = document.currentScript || document.scripts[document.scripts.length - 1];
    var footerUrl = new URL('../includes/footer.html', script.src).href;
    fetch(footerUrl, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('Network response not ok'); return r.text(); })
      .then(function (html) {
        var placeholder = document.getElementById('site-footer');
        if (placeholder) {
          placeholder.outerHTML = html;
        } else {
          document.body.insertAdjacentHTML('beforeend', html);
        }
      })
      .catch(function (err) { console.warn('Include footer failed:', err); });
  } catch (e) {
    console.warn('Include footer error', e);
  }
})();
