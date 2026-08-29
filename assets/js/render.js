/* Pure data -> markup. Nothing here touches the DOM, so the same code makes
   the live preview and the file the teacher downloads.

   The section set follows the five parts a Bulgarian teaching portfolio must
   contain: общи данни, практическо приложение, постижения, институционални
   политики, кариерно развитие. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const has = v => Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2)
    .map(w => w[0] || '').join('').toUpperCase();
  const isData = v => typeof v === 'string' && v.slice(0, 5) === 'data:';

  /* Headings in the portfolio's own language. Everything else is the
     teacher's text, so it is already in whatever language they wrote. */
  const LABELS = {
    en: {
      about: 'General information', education: 'Education', certifications: 'Diplomas & certificates',
      experience: 'Experience', practice: 'Practical application', achievements: 'Achievements',
      policies: 'Institutional policies', development: 'Career development',
      skills: 'Competencies', documents: 'Documents', gallery: 'Classroom', testimonials: 'References',
      languages: 'Languages', glance: 'At a glance', who: 'Who I am', thanks: 'Thank you',
      qualification: 'Professional qualification'
    },
    bg: {
      about: 'Общи данни', education: 'Образование', certifications: 'Дипломи и сертификати',
      experience: 'Професионален опит', practice: 'Практическо приложение', achievements: 'Постижения',
      policies: 'Институционални политики', development: 'Кариерно развитие',
      skills: 'Компетентности', documents: 'Документи', gallery: 'В класната стая',
      testimonials: 'Препоръки', languages: 'Езици', glance: 'Накратко', who: 'Общи данни',
      thanks: 'Благодаря', qualification: 'Придобита професионална квалификация'
    }
  };
  const labels = data => LABELS[((data.settings || {}).language === 'bg') ? 'bg' : 'en'];

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

  // One shape for every dated list: a date in the margin, a heading, a
  // subheading, bullets, a note.
  function entryList(list, pick) {
    if (!has(list)) return '';
    const rows = (list || []).map(pick).filter(r => has(r.head));
    if (!rows.length) return '';
    return `<div class="timeline">${rows.map(r => `<article class="entry">
        <div class="when">${esc(r.when || '')}</div>
        <div class="what">
          <h3>${esc(r.head)}</h3>
          ${has(r.sub) ? `<div class="org">${esc(r.sub)}</div>` : ''}
          ${has(r.bullets) ? `<ul>${r.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${has(r.note) ? `<p class="note">${esc(r.note)}</p>` : ''}
        </div>
      </article>`).join('')}</div>`;
  }

  const pick = {
    experience: e => ({ when: [e.start, e.end].filter(has).join(' – '), head: e.role,
      sub: [e.org, e.location].filter(has).join(' · '), bullets: e.bullets }),
    education: e => ({ when: e.year, head: e.degree, sub: e.institution, note: e.notes }),
    practice: e => ({ when: e.year, head: e.title, sub: e.subject, bullets: e.methods, note: e.description }),
    achievements: e => ({ when: e.year, head: e.title, sub: e.event, note: e.result }),
    policies: e => ({ when: e.period, head: e.title, sub: e.role, note: e.description }),
    development: e => ({ when: e.year, head: e.title, sub: [e.kind, e.issuer].filter(has).join(' · '),
      note: e.notes })
  };

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
    const p = data.profile || {}, L = labels(data);
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

    const pills = (title, items) => `<div class="skillgroup"><h3>${esc(title)}</h3>
      <div class="pills">${items.map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div></div>`;

    const about = [
      has(p.summary) ? `<div class="prose"><p>${esc(p.summary)}</p></div>` : '',
      has(p.qualification) ? `<div style="margin-top:18px">${pills(L.qualification, [p.qualification])}</div>` : '',
      has(p.languages) ? `<div style="margin-top:4px">${pills(L.languages, p.languages)}</div>` : ''
    ].join('');

    const certs = has(data.certifications)
      ? `<div class="cards">${data.certifications.filter(c => has(c.name)).map(c => {
          const inner = `<h3>${esc(c.name)}</h3><p>${[c.issuer, c.year].filter(has).map(esc).join(' · ')}</p>`;
          return has(c.url)
            ? `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener">${inner}</a>`
            : `<div class="card">${inner}</div>`;
        }).join('')}</div>` : '';

    const skills = has(data.skills)
      ? data.skills.filter(g => has(g.items)).map(g => pills(g.group, g.items)).join('') : '';

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

    const order = [
      ['about', L.about, about],
      ['education', L.education, entryList(data.education, pick.education)],
      ['certifications', L.certifications, certs],
      ['experience', L.experience, entryList(data.experience, pick.experience)],
      ['practice', L.practice, entryList(data.practice, pick.practice)],
      ['achievements', L.achievements, entryList(data.achievements, pick.achievements)],
      ['policies', L.policies, entryList(data.policies, pick.policies)],
      ['development', L.development, entryList(data.development, pick.development)],
      ['skills', L.skills, skills],
      ['documents', L.documents, docs],
      ['gallery', L.gallery, gallery],
      ['testimonials', L.testimonials, quotes]
    ];

    const body = order.map(([id, title, html]) => section(id, title, html)).join('');
    const nav = order.filter(([id, , html]) => html)
      .map(([id, title]) => `<a href="#${id}">${esc(title)}</a>`).join('');

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
    closing: (kicker, p) => `<div class="slide">
        <div class="kicker">${esc(kicker)}</div><h2>${esc(p.name || '')}</h2>
        <ul>${[p.email, p.phone, p.website].filter(has).map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>`
  };

  /* The deck as data. Both renderers below consume this one model, so the
     HTML deck and the .pptx can never drift apart. */
  function slideModel(data) {
    const p = data.profile || {}, L = labels(data), out = [];

    out.push({ kind: 'cover', name: p.name || 'Your name', role: p.title,
      meta: [p.school, p.location].filter(has).join(' \u00b7 '), tagline: p.tagline });

    if (has(p.summary)) {
      out.push({ kind: 'prose', kicker: L.about, title: L.who, text: p.summary,
        chips: has(p.qualification) ? { label: L.qualification, items: [p.qualification] } : null });
    }

    const stats = (data.stats || []).filter(s => has(s.value));
    if (stats.length) out.push({ kind: 'stats', kicker: L.glance, title: L.glance, items: stats });

    const list = (kicker, title, rows) => {
      if (rows.length) out.push({ kind: 'bullets', kicker, title, sub: '', items: rows });
    };

    list(L.about, L.education, (data.education || []).filter(e => has(e.degree))
      .map(e => [e.degree, e.institution, e.year].filter(has).join(' \u2014 ')));

    list(L.about, L.certifications, (data.certifications || []).filter(c => has(c.name))
      .map(c => [c.name, c.issuer, c.year].filter(has).join(' \u2014 ')));

    (data.experience || []).filter(e => has(e.role)).forEach(e => {
      const sub = [[e.start, e.end].filter(has).join(' \u2013 '), e.org, e.location].filter(has).join(' \u00b7 ');
      out.push({ kind: 'bullets', kicker: L.experience, title: e.role, sub,
        items: has(e.bullets) ? e.bullets : (sub ? [sub] : []) });
    });

    (data.practice || []).filter(e => has(e.title)).forEach(e => {
      const items = has(e.methods) ? e.methods.slice() : [];
      if (has(e.description)) items.unshift(e.description);
      out.push({ kind: 'bullets', kicker: L.practice, title: e.title,
        sub: [e.subject, e.year].filter(has).join(' \u00b7 '), items });
    });

    list(L.achievements, L.achievements, (data.achievements || []).filter(a => has(a.title))
      .map(a => [a.title, a.event, a.result, a.year].filter(has).join(' \u2014 ')));

    list(L.policies, L.policies, (data.policies || []).filter(x => has(x.title))
      .map(x => [x.title, x.role, x.period].filter(has).join(' \u2014 ')));

    list(L.development, L.development, (data.development || []).filter(x => has(x.title))
      .map(x => [x.title, x.kind, x.issuer, x.year].filter(has).join(' \u2014 ')));

    const sk = (data.skills || []).filter(g => has(g.items));
    if (sk.length) out.push({ kind: 'groups', kicker: L.skills, title: L.skills, groups: sk });

    list(L.documents, L.documents, (data.documents || []).filter(d => has(d.title))
      .map(d => d.title + (has(d.description) ? ' \u2014 ' + d.description : '')));

    (data.gallery || []).filter(g => has(g.src)).forEach((g, i) => {
      out.push({ kind: 'image', kicker: L.gallery, title: g.caption || (L.gallery + ' ' + (i + 1)), src: g.src });
    });

    (data.testimonials || []).filter(t => has(t.quote)).forEach(t => {
      out.push({ kind: 'quote', kicker: L.testimonials, text: t.quote,
        who: [t.author, t.role].filter(has).join(', ') });
    });

    out.push({ kind: 'closing', kicker: L.thanks, title: p.name || '',
      items: [p.email, p.phone, p.website].filter(has) });

    return out;
  }

  const toHTML = {
    cover: m => S.cover({ name: m.name, title: m.role, school: m.meta, tagline: m.tagline }),
    prose: m => S.prose(m.kicker, m.title, m.text, m.chips
      ? `<div class="grouprow" style="margin-top:26px"><h3>${esc(m.chips.label)}</h3>
         <div class="chipwrap">${m.chips.items.map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div></div>`
      : ''),
    stats: m => S.stats(m.kicker, m.items),
    bullets: m => S.bullets(m.kicker, m.title, m.sub, m.items),
    groups: m => S.groups(m.kicker, m.title, m.groups),
    image: m => S.image(m.kicker, m.title, m.src),
    quote: m => S.quote(m.text, m.who),
    closing: m => S.closing(m.kicker, { name: m.title, email: m.items[0], phone: m.items[1], website: m.items[2] })
  };

  function slides(data) {
    const model = slideModel(data);
    const name = esc((data.profile || {}).name || '');
    const outline = model.map(m => {
      const head = m.kind === 'cover' ? m.name : (m.title || m.kicker || '');
      const rows = m.kind === 'stats' ? m.items.map(s => s.value + ' \u2014 ' + s.label)
        : m.kind === 'groups' ? m.groups.map(g => g.group + ': ' + (g.items || []).join(', '))
        : m.kind === 'quote' ? [m.text]
        : m.kind === 'prose' ? [m.text]
        : (m.items || []);
      return head + (rows.length ? '\n' + rows.map(b => '\t' + b).join('\n') : '');
    }).join('\n\n');

    const html = model.map((m, i) => {
      const slide = toHTML[m.kind](m);
      let body = slide;
      if (i > 0) {
        const at = slide.lastIndexOf('</div>');
        body = slide.slice(0, at)
          + `<div class="foot"><span>${name}</span><span>${i + 1} / ${model.length}</span></div>`
          + slide.slice(at);
      }
      return `<div class="slidebox" data-i="${i}">${body}</div>`;
    }).join('');

    return { html, count: model.length, outline };
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
    const lang = ((data.settings || {}).language === 'bg') ? 'bg' : 'en';
    const title = [p.name, p.title].filter(has).map(esc).join(' — ') || 'Portfolio';

    return `<!doctype html>
<html lang="${lang}"${theme ? ` data-theme="${esc(theme)}"` : ''}>
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

  window.Render = { esc, has, initials, portfolio, slides, slideModel, document: document_,
    LABELS, FONTS };
})();
