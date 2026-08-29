/* Shared data loading + tiny helpers. Used by both the portfolio page and the deck. */
(function () {
  const DATA_URL = 'data/portfolio.json';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // Arrays in the JSON may be absent or empty; treat both as "section off".
  function has(v) { return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()); }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }

  async function loadPortfolio() {
    const res = await fetch(DATA_URL + '?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status + ' loading ' + DATA_URL);
    return res.json();
  }

  function applyAccent(data) {
    const accent = data && data.settings && data.settings.accent;
    // Applied as a light-mode override; the dark palette keeps its own accent.
    if (accent) document.documentElement.style.setProperty('--user-accent', accent);
  }

  // Theme toggle: remembers the choice, otherwise follows the OS.
  function initTheme(btn) {
    const KEY = 'portfolio-theme';
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
    if (!btn) return;
    const paint = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark'
        || (!document.documentElement.hasAttribute('data-theme')
            && window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.textContent = dark ? '☀' : '☾';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    btn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark'
        || (!document.documentElement.hasAttribute('data-theme')
            && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
    });
    paint();
  }

  function failure(el, err) {
    el.innerHTML = '<div class="status"><p><strong>Could not load ' + esc(DATA_URL) + '.</strong></p>'
      + '<p>' + esc(err.message) + '</p>'
      + '<p>If you opened this file directly from disk, browsers block the fetch. '
      + 'Run <code>python3 -m http.server</code> in this folder and open '
      + '<code>http://localhost:8000</code> instead — on GitHub Pages it just works.</p></div>';
  }

  window.Portfolio = { esc, has, initials, loadPortfolio, applyAccent, initTheme, failure };
})();
