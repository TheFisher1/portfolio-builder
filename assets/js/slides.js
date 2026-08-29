/* Builds a 16:9 deck from the same data/portfolio.json the portfolio page uses. */
(function () {
  const { esc, has, loadPortfolio, applyAccent, initTheme, failure } = window.Portfolio;
  const stage = document.getElementById('stage');
  let slides = [], index = 0, deckOutline = '';

  /* ---------- slide builders ---------- */
  const S = {
    cover: p => `<div class="slide cover">
        <h1>${esc(p.name)}</h1>
        ${has(p.title) ? `<div class="role">${esc(p.title)}</div>` : ''}
        ${has(p.school) || has(p.location)
          ? `<div class="meta">${[p.school, p.location].filter(has).map(esc).join(' · ')}</div>` : ''}
        <div class="rule"></div>
        ${has(p.tagline) ? `<div class="tagline">${esc(p.tagline)}</div>` : ''}
      </div>`,

    bullets: (kicker, title, sub, list) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div>
        <h2>${esc(title)}</h2>
        ${has(sub) ? `<div class="sub">${esc(sub)}</div>` : ''}
        <ul>${list.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,

    prose: (kicker, title, text, extra) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div>
        <h2>${esc(title)}</h2>
        <p class="body wide">${esc(text)}</p>
        ${extra || ''}
      </div>`,

    stats: (kicker, list) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div>
        <div class="statrow">${list.map(s =>
          `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
      </div>`,

    groups: (kicker, title, groups) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div>
        <h2>${esc(title)}</h2>
        ${groups.map(g => `<div class="grouprow"><h3>${esc(g.group)}</h3>
          <div class="chipwrap">${(g.items || []).map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div>
        </div>`).join('')}
      </div>`,

    image: (kicker, title, src, caption) => `<div class="slide split">
        <div class="col">
          <div class="kicker">${esc(kicker)}</div>
          <h2 style="font-size:40px">${esc(title)}</h2>
          ${has(caption) ? `<p class="body">${esc(caption)}</p>` : ''}
        </div>
        <div class="col"><img class="shot" src="${esc(src)}" alt="${esc(caption || title)}"></div>
      </div>`,

    quote: (q, who) => `<div class="slide quote">
        <blockquote><p>${esc(q)}</p><cite>${esc(who)}</cite></blockquote>
      </div>`,

    closing: p => {
      const lines = [p.email, p.phone, p.website].filter(has);
      return `<div class="slide">
        <div class="kicker">Thank you</div>
        <h2>${esc(p.name)}</h2>
        <ul>${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>`;
    }
  };

  /* ---------- deck assembly ---------- */
  function build(data) {
    const p = data.profile || {}, out = [], outline = [];
    const add = (html, title, bullets) => {
      out.push(html);
      outline.push(title + (bullets && bullets.length ? '\n' + bullets.map(b => '\t' + b).join('\n') : ''));
    };

    add(S.cover(p), p.name || 'Portfolio', [p.title, p.school].filter(has));

    if (has(p.summary)) {
      const langs = has(p.languages)
        ? `<div class="grouprow" style="margin-top:26px"><h3>Languages</h3>
           <div class="chipwrap">${p.languages.map(l => `<span class="pill">${esc(l)}</span>`).join('')}</div></div>`
        : '';
      add(S.prose('About', 'Who I am', p.summary, langs), 'Who I am', [p.summary]);
    }

    if (has(data.stats)) {
      add(S.stats('At a glance', data.stats), 'At a glance',
        data.stats.map(s => `${s.value} — ${s.label}`));
    }

    (data.experience || []).forEach(e => {
      const sub = [[e.start, e.end].filter(has).join(' – '), e.org, e.location].filter(has).join(' · ');
      const bullets = has(e.bullets) ? e.bullets : [sub];
      add(S.bullets('Experience', e.role, sub, bullets), e.role, bullets);
    });

    if (has(data.education)) {
      const list = data.education.map(e =>
        [e.degree, e.institution, e.year].filter(has).join(' — '));
      add(S.bullets('Education', 'Education', '', list), 'Education', list);
    }

    if (has(data.certifications)) {
      const list = data.certifications.map(c => [c.name, c.issuer, c.year].filter(has).join(' — '));
      add(S.bullets('Credentials', 'Certifications', '', list), 'Certifications', list);
    }

    if (has(data.skills)) {
      add(S.groups('Practice', 'Skills', data.skills), 'Skills',
        data.skills.map(g => `${g.group}: ${(g.items || []).join(', ')}`));
    }

    if (has(data.documents)) {
      const list = data.documents.map(d => d.title + (has(d.description) ? ` — ${d.description}` : ''));
      add(S.bullets('Portfolio', 'Documents', 'Available in the online portfolio', list), 'Documents', list);
    }

    (data.gallery || []).forEach((g, i) => {
      add(S.image('Classroom', g.caption || `Classroom ${i + 1}`, g.src, ''),
        g.caption || `Classroom ${i + 1}`, []);
    });

    (data.testimonials || []).forEach(t => {
      const who = [t.author, t.role].filter(has).join(', ');
      add(S.quote(t.quote, who), 'Reference — ' + (t.author || ''), [t.quote]);
    });

    add(S.closing(p), 'Thank you', [p.email, p.phone, p.website].filter(has));

    deckOutline = outline.join('\n\n');

    const name = esc(p.name || '');
    // Footer goes just inside the slide's own closing tag (the last one in the string).
    stage.innerHTML = out.map((html, i) => {
      let body = html;
      if (i > 0) {
        const at = html.lastIndexOf('</div>');
        body = html.slice(0, at)
          + `<div class="foot"><span>${name}</span><span>${i + 1} / ${out.length}</span></div>`
          + html.slice(at);
      }
      return `<div class="slidebox" data-i="${i}">${body}</div>`;
    }).join('');

    slides = Array.from(stage.querySelectorAll('.slide'));
    fit();
    go(0);
  }

  /* ---------- navigation ---------- */
  function fit() {
    if (document.body.classList.contains('overview')) return;
    const s = Math.min(window.innerWidth * 0.94 / 1280, window.innerHeight * 0.9 / 720);
    slides.forEach(el => { el.style.transform = `scale(${s})`; });
  }

  function go(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((el, n) => el.classList.toggle('active', n === index));
    document.getElementById('counter').textContent = `${index + 1} / ${slides.length}`;
    document.querySelector('#bar i').style.width = ((index + 1) / slides.length * 100) + '%';
    location.hash = String(index + 1);
  }

  function overview(on) {
    document.body.classList.toggle('overview', on);
    if (on) {
      slides.forEach(el => { el.style.transform = ''; el.classList.add('active'); });
    } else {
      slides.forEach(el => el.classList.remove('active'));
      fit(); go(index);
    }
  }

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const ov = document.body.classList.contains('overview');
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
      case 'o': case 'O': case 'Escape': overview(!ov); break;
    }
  });

  stage.addEventListener('click', e => {
    const box = e.target.closest('.slidebox');
    if (document.body.classList.contains('overview')) {
      if (box) { overview(false); go(Number(box.dataset.i)); }
      return;
    }
    go(index + (e.clientX > window.innerWidth * 0.35 ? 1 : -1));
  });

  let touchX = null;
  stage.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', () => {
    const n = Number(location.hash.slice(1));
    if (n && n - 1 !== index) go(n - 1);
  });

  /* ---------- chrome ---------- */
  initTheme(document.getElementById('theme'));
  document.getElementById('print').addEventListener('click', () => window.print());
  document.getElementById('grid').addEventListener('click', e => {
    e.stopPropagation();
    overview(!document.body.classList.contains('overview'));
  });
  document.getElementById('outline').addEventListener('click', async e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(deckOutline); btn.textContent = '✓ Copied'; }
    catch (err) { window.prompt('Copy the outline:', deckOutline); btn.textContent = '⧉ Outline'; }
    setTimeout(() => { btn.textContent = '⧉ Outline'; }, 1800);
  });

  setTimeout(() => { const h = document.getElementById('hint'); if (h) h.style.opacity = '0'; }, 4000);

  loadPortfolio()
    .then(data => {
      applyAccent(data);
      document.title = ((data.profile || {}).name || 'Portfolio') + ' — Presentation';
      build(data);
      const n = Number(location.hash.slice(1));
      if (n) go(n - 1);
    })
    .catch(err => { document.body.style.overflow = 'auto'; failure(stage, err); });
})();
