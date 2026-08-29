/* The script that ships inside every exported portfolio. It is inlined as
   text, so it must stand alone: no imports, no build step, no globals from
   the builder. */
(function () {
  const body = document.body;
  const stage = document.getElementById('stage');
  const slides = stage ? Array.prototype.slice.call(stage.querySelectorAll('.slide')) : [];
  const counter = document.getElementById('counter');
  const bar = document.querySelector('#bar i');
  let index = 0;

  /* ---------- theme ---------- */
  const KEY = 'portfolio-view-theme';
  function prefersDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      || (!document.documentElement.hasAttribute('data-theme')
          && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function paintTheme() {
    const glyph = prefersDark() ? '☀' : '☾';
    Array.prototype.forEach.call(document.querySelectorAll('[data-act="theme"]'), b => { b.textContent = glyph; });
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
  } catch (e) { /* storage blocked */ }

  /* ---------- deck ---------- */
  function fit() {
    if (body.classList.contains('overview')) return;
    const s = Math.min(window.innerWidth * 0.94 / 1280, window.innerHeight * 0.9 / 720);
    slides.forEach(el => { el.style.transform = 'scale(' + s + ')'; });
  }

  function go(i) {
    if (!slides.length) return;
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((el, n) => el.classList.toggle('active', n === index));
    if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
    if (bar) bar.style.width = ((index + 1) / slides.length * 100) + '%';
  }

  function overview(on) {
    body.classList.toggle('overview', on);
    if (on) slides.forEach(el => { el.style.transform = ''; el.classList.add('active'); });
    else { slides.forEach(el => el.classList.remove('active')); fit(); go(index); }
  }

  function setView(view) {
    body.classList.toggle('view-deck', view === 'deck');
    body.classList.toggle('view-portfolio', view !== 'deck');
    if (view === 'deck') { fit(); go(index); }
    else overview(false);
  }

  /* Printing the deck wants landscape slide-sized pages; the portfolio does not. */
  let pageStyle = null;
  window.addEventListener('beforeprint', () => {
    if (!body.classList.contains('view-deck')) return;
    pageStyle = document.createElement('style');
    pageStyle.textContent = '@page { size: 1280px 720px; margin: 0; }';
    document.head.appendChild(pageStyle);
  });
  window.addEventListener('afterprint', () => {
    if (pageStyle) { pageStyle.remove(); pageStyle = null; }
  });

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (btn) {
      const act = btn.dataset.act;
      if (act === 'present') setView('deck');
      if (act === 'exit') setView('portfolio');
      if (act === 'grid') overview(!body.classList.contains('overview'));
      if (act === 'print') window.print();
      if (act === 'theme') {
        const next = prefersDark() ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (err) { /* ignore */ }
        paintTheme();
      }
      return;
    }
    if (!body.classList.contains('view-deck')) return;
    const box = e.target.closest('.slidebox');
    if (body.classList.contains('overview')) {
      if (box) { overview(false); go(Number(box.dataset.i)); }
    } else if (stage && stage.contains(e.target)) {
      go(index + (e.clientX > window.innerWidth * 0.35 ? 1 : -1));
    }
  });

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!body.classList.contains('view-deck')) {
      if (e.key === 'p' || e.key === 'P') setView('deck');
      return;
    }
    const ov = body.classList.contains('overview');
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        e.preventDefault(); if (!ov) go(index + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); if (!ov) go(index - 1); break;
      case 'Home': go(0); break;
      case 'End': go(slides.length - 1); break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        break;
      case 'o': case 'O': overview(!ov); break;
      case 'Escape': if (ov) overview(false); else setView('portfolio'); break;
    }
  });

  let touchX = null;
  if (stage) {
    stage.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (touchX == null || body.classList.contains('overview')) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
  }

  window.addEventListener('resize', fit);
  setTimeout(() => { const h = document.getElementById('hint'); if (h) h.style.opacity = '0'; }, 4500);

  paintTheme();
  fit();
  go(0);
})();
