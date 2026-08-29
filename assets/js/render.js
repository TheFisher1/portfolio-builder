/* Pure data -> markup. Nothing here touches the DOM, so the same code makes
   the live preview and the file the teacher downloads. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const has = v => Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2)
    .map(w => w[0] || '').join('').toUpperCase();
  const isData = v => typeof v === 'string' && v.slice(0, 5) === 'data:';

  /* ---------------- portfolio ---------------- */

  function hero(p) {
    const photo = has(p.photo)
      ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}">`
      : `<div class="placeholder">${esc(initials(p.name))}</div>`;

    const chips = [];
    if (has(p.email)) chips.push(`<a class="chip" href="mailto:${esc(p.email)}">${esc(p.email)}</a>`);
    if (has(p.phone)) chips.push(`<a class="chip" href="tel:${esc(String(p.phone).replace(/\s/g, ''))}">${esc(p.phone)}</a>`);
    if (has(p.website)) chips.push(`<a class="chip" href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>`);
    (p.links || []).filter(l => has(l.url)).forEach(l =>
      chips.push(`<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>`));

    const meta = [p.school, p.location].filter(has).map(esc).join(' · ');

    return `<div class="hero-grid">
      <div>
        <h1>${esc(p.name || 'Your name')}</h1>
        ${has(p.title) ? `<div class="role">${esc(p.title)}</div>` : ''}
        ${meta ? `<div class="meta">${meta}</div>` : ''}
        ${has(p.tagline) ? `<p class="tagline"><em>${esc(p.tagline)}</em></p>` : ''}
        ${chips.length ? `<div class="contact">${chips.join('')}</div>` : ''}
      </div>
      <div class="taped">${photo}</div>
    </div>`;
  }

  function timeline(list, kind) {
    if (!has(list)) return '';
    return `<div class="timeline">${list.map(e => {
      const when = kind === 'experience'
        ? [e.start, e.end].filter(has).map(esc).join(' – ')
        : esc(e.year || '');
      const head = kind === 'experience' ? e.role : e.degree;
      const org = kind === 'experience'
        ? [e.org, e.location].filter(has).map(esc).join(' · ')
        : esc(e.institution || '');
      const bullets = has(e.bullets) ? `<ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
      const notes = has(e.notes) ? `<p class="note">${esc(e.notes)}</p>` : '';
      if (!has(head) && !org) return '';
      return `<article class="entry">
        <div class="when">${when}</div>
        <div class="what"><h3>${esc(head)}</h3>${org ? `<div class="org">${org}</div>` : ''}${bullets}${notes}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function docLink(d) {
    const label = `<span class="tag">${esc(d.type || 'File')}</span>
      <h3>${esc(d.title || d.filename || 'Document')}</h3>
      ${has(d.description) ? `<p>${esc(d.description)}</p>` : ''}`;
    if (!has(d.file)) return `<div class="card">${label}</div>`;
    // A data: URI is the file itself, so it downloads rather than navigates.
    const attrs = isData(d.file)
      ? `href="${d.file}" download="${esc(d.filename || (d.title || 'document') + '.pdf')}"`
      : `href="${esc(d.file)}" target="_blank" rel="noopener"`;
    return `<a class="card" ${attrs}>${label}</a>`;
  }

  function portfolio(data) {
    const p = data.profile || {};
    let n = 0;
    const section = (id, title, body) => {
      if (!body) return '';
      n += 1;
      return `<section id="${id}"><div class="wrap">
        <h2 class="sec"><span class="num">${String(n).padStart(2, '0')}</span><span class="lbl">${esc(title)}</span></h2>
        ${body}</div></section>`;
    };

    const stats = has(data.stats)
      ? `<div class="wrap"><div class="stats">${data.stats.filter(s => has(s.value)).map(s =>
          `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div></div>`
      : '';

    const about = [
      has(p.summary) ? `<div class="prose"><p>${esc(p.summary)}</p></div>` : '',
      has(p.languages) ? `<div class="skillgroup" style="margin-top:22px"><h3>Languages</h3>
        <div class="pills">${p.languages.map(l => `<span class="pill">${esc(l)}</span>`).join('')}</div></div>` : ''
    ].join('');

    const certs = has(data.certifications)
      ? `<div class="cards">${data.certifications.filter(c => has(c.name)).map(c => {
          const inner = `<h3>${esc(c.name)}</h3><p>${[c.issuer, c.year].filter(has).map(esc).join(' · ')}</p>`;
          return has(c.url)
            ? `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener">${inner}</a>`
            : `<div class="card">${inner}</div>`;
        }).join('')}</div>` : '';

    const skills = has(data.skills)
      ? data.skills.filter(g => has(g.items)).map(g => `<div class="skillgroup"><h3>${esc(g.group)}</h3>
          <div class="pills">${g.items.map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div></div>`).join('')
      : '';

    const docs = has(data.documents)
      ? `<div class="cards">${data.documents.map(docLink).join('')}</div>` : '';

    const gallery = has(data.gallery)
      ? `<div class="gallery">${data.gallery.filter(g => has(g.src)).map(g =>
          `<figure><img src="${esc(g.src)}" alt="${esc(g.caption || '')}" loading="lazy">
           ${has(g.caption) ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`
      : '';

    const quotes = has(data.testimonials)
      ? data.testimonials.filter(t => has(t.quote)).map(t => `<blockquote><p>${esc(t.quote)}</p>
          <cite>${[t.author, t.role].filter(has).map(esc).join(', ')}</cite></blockquote>`).join('')
      : '';

    const body = [
      section('about', 'About', about),
      section('experience', 'Experience', timeline(data.experience, 'experience')),
      section('education', 'Education', timeline(data.education, 'education')),
      section('certifications', 'Certifications', certs),
      section('skills', 'Skills', skills),
      section('documents', 'Documents', docs),
      section('gallery', 'Classroom', gallery),
      section('testimonials', 'References', quotes)
    ].join('');

    const labels = { about: 'About', experience: 'Experience', education: 'Education',
      certifications: 'Certifications', skills: 'Skills', documents: 'Documents',
      gallery: 'Classroom', testimonials: 'References' };
    const nav = Object.keys(labels)
      .filter(id => body.indexOf(`id="${id}"`) !== -1)
      .map(id => `<a href="#${id}">${labels[id]}</a>`).join('');

    const note = (data.settings && data.settings.footerNote) || '';
    const footer = `<footer><div class="wrap">
      <span>${esc(p.name || '')} · ${new Date().getFullYear()}${note ? ' · ' + esc(note) : ''}</span>
    </div></footer>`;

    return { nav, html: `<div class="hero"><div class="wrap">${hero(p)}</div></div>${stats}${body}${footer}` };
  }

  /* ---------------- deck ---------------- */

  const S = {
    cover: p => `<div class="slide cover">
        <h1>${esc(p.name || 'Your name')}</h1>
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
        <p class="body wide">${esc(text)}</p>${extra || ''}
      </div>`,
    stats: (kicker, list) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div>
        <div class="statrow">${list.map(s =>
          `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
      </div>`,
    groups: (kicker, title, groups) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div><h2>${esc(title)}</h2>
        ${groups.map(g => `<div class="grouprow"><h3>${esc(g.group)}</h3>
          <div class="chipwrap">${(g.items || []).map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div>
        </div>`).join('')}
      </div>`,
    image: (kicker, title, src) => `<div class="slide split">
        <div class="col"><div class="kicker">${esc(kicker)}</div><h2 style="font-size:40px">${esc(title)}</h2></div>
        <div class="col"><img class="shot" src="${esc(src)}" alt="${esc(title)}"></div>
      </div>`,
    quote: (q, who) => `<div class="slide quote">
        <blockquote><p>${esc(q)}</p><cite>${esc(who)}</cite></blockquote>
      </div>`,
    closing: p => `<div class="slide">
        <div class="kicker">Thank you</div><h2>${esc(p.name || '')}</h2>
        <ul>${[p.email, p.phone, p.website].filter(has).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>`
  };

  function slides(data) {
    const p = data.profile || {}, out = [], outline = [];
    const add = (html, title, bullets) => {
      out.push(html);
      outline.push(title + (bullets && bullets.length ? '\n' + bullets.map(b => '\t' + b).join('\n') : ''));
    };

    add(S.cover(p), p.name || 'Portfolio', [p.title, p.school].filter(has));

    if (has(p.summary)) {
      const langs = has(p.languages)
        ? `<div class="grouprow" style="margin-top:26px"><h3>Languages</h3>
           <div class="chipwrap">${p.languages.map(l => `<span class="pill">${esc(l)}</span>`).join('')}</div></div>` : '';
      add(S.prose('About', 'Who I am', p.summary, langs), 'Who I am', [p.summary]);
    }

    const stats = (data.stats || []).filter(s => has(s.value));
    if (stats.length) {
      add(S.stats('At a glance', stats), 'At a glance', stats.map(s => `${s.value} — ${s.label}`));
    }

    (data.experience || []).filter(e => has(e.role)).forEach(e => {
      const sub = [[e.start, e.end].filter(has).join(' – '), e.org, e.location].filter(has).join(' · ');
      const bullets = has(e.bullets) ? e.bullets : (sub ? [sub] : []);
      add(S.bullets('Experience', e.role, sub, bullets), e.role, bullets);
    });

    const edu = (data.education || []).filter(e => has(e.degree))
      .map(e => [e.degree, e.institution, e.year].filter(has).join(' — '));
    if (edu.length) add(S.bullets('Education', 'Education', '', edu), 'Education', edu);

    const certs = (data.certifications || []).filter(c => has(c.name))
      .map(c => [c.name, c.issuer, c.year].filter(has).join(' — '));
    if (certs.length) add(S.bullets('Credentials', 'Certifications', '', certs), 'Certifications', certs);

    const sk = (data.skills || []).filter(g => has(g.items));
    if (sk.length) {
      add(S.groups('Practice', 'Skills', sk), 'Skills', sk.map(g => `${g.group}: ${g.items.join(', ')}`));
    }

    const docs = (data.documents || []).filter(d => has(d.title))
      .map(d => d.title + (has(d.description) ? ` — ${d.description}` : ''));
    if (docs.length) add(S.bullets('Portfolio', 'Documents', '', docs), 'Documents', docs);

    (data.gallery || []).filter(g => has(g.src)).forEach((g, i) => {
      const title = g.caption || `Classroom ${i + 1}`;
      add(S.image('Classroom', title, g.src), title, []);
    });

    (data.testimonials || []).filter(t => has(t.quote)).forEach(t => {
      add(S.quote(t.quote, [t.author, t.role].filter(has).join(', ')), 'Reference', [t.quote]);
    });

    add(S.closing(p), 'Thank you', [p.email, p.phone, p.website].filter(has));

    const name = esc(p.name || '');
    const html = out.map((slide, i) => {
      let body = slide;
      if (i > 0) {
        const at = slide.lastIndexOf('</div>');
        body = slide.slice(0, at)
          + `<div class="foot"><span>${name}</span><span>${i + 1} / ${out.length}</span></div>`
          + slide.slice(at);
      }
      return `<div class="slidebox" data-i="${i}">${body}</div>`;
    }).join('');

    return { html, count: out.length, outline: outline.join('\n\n') };
  }

  /* ---------------- the finished, standalone document ---------------- */

  const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700'
    + '&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..500&display=swap';

  // The source data travels inside the file, so the builder can reopen it.
  function jsonScript(data) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }

  function document_(opts) {
    const { data, css, viewer, theme, view } = opts;
    const p = data.profile || {};
    const page = portfolio(data);
    const deck = slides(data);
    const title = [p.name, p.title].filter(has).map(esc).join(' — ') || 'Teaching portfolio';

    return `<!doctype html>
<html lang="en"${theme ? ` data-theme="${esc(theme)}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<script type="application/json" id="portfolio-data">${jsonScript(data)}</script>
</head>
<body class="${view === 'deck' ? 'view-deck' : 'view-portfolio'}">
<header class="topbar no-print">
  <div class="wrap">
    <span class="brand">${esc(p.name || 'Portfolio')}</span>
    <nav>${page.nav}</nav>
    <button class="iconbtn" data-act="present" type="button">▶ Present</button>
    <button class="iconbtn" data-act="print" type="button">⎙ PDF</button>
    <button class="iconbtn" data-act="theme" type="button" aria-label="Toggle theme">☾</button>
  </div>
</header>

<main id="portfolio">${page.html}</main>

<div id="deck">
  <div id="controls">
    <button class="iconbtn" data-act="exit" type="button">← Portfolio</button>
    <button class="iconbtn" data-act="grid" type="button" title="Overview (o)">▦</button>
    <button class="iconbtn" data-act="print" type="button">⎙ PDF</button>
    <button class="iconbtn" data-act="theme" type="button" aria-label="Toggle theme">☾</button>
    <span id="counter"></span>
  </div>
  <div id="stage">${deck.html}</div>
  <div id="bar"><i></i></div>
  <div id="hint">← → to move · <b>o</b> overview · <b>f</b> fullscreen</div>
</div>

<script>${viewer}</script>
</body>
</html>`;
  }

  window.Render = { esc, has, initials, portfolio, slides, document: document_, FONTS };
})();
