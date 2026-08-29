/* Renders data/portfolio.json into the page. */
(function () {
  const { esc, has, initials, loadPortfolio, applyAccent, initTheme, failure } = window.Portfolio;

  function heroHTML(p) {
    // Missing photo file falls back to initials (see the error listener below).
    const photo = has(p.photo)
      ? `<img id="avatar" src="${esc(p.photo)}" alt="${esc(p.name)}">`
      : `<div class="placeholder">${esc(initials(p.name))}</div>`;

    const chips = [];
    if (has(p.email)) chips.push(`<a class="chip" href="mailto:${esc(p.email)}">${esc(p.email)}</a>`);
    if (has(p.phone)) chips.push(`<a class="chip" href="tel:${esc(p.phone.replace(/\s/g, ''))}">${esc(p.phone)}</a>`);
    if (has(p.website)) chips.push(`<a class="chip" href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>`);
    (p.links || []).filter(l => has(l.url)).forEach(l =>
      chips.push(`<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`));

    const meta = [p.school, p.location].filter(has).map(esc).join(' · ');

    return `<div class="hero-grid">
      <div>
        <h1>${esc(p.name)}</h1>
        ${has(p.title) ? `<div class="role">${esc(p.title)}</div>` : ''}
        ${meta ? `<div class="meta">${meta}</div>` : ''}
        ${has(p.tagline) ? `<p class="tagline"><em>${esc(p.tagline)}</em></p>` : ''}
        ${chips.length ? `<div class="contact">${chips.join('')}</div>` : ''}
      </div>
      <div class="taped">${photo}</div>
    </div>`;
  }

  let sectionNo = 0;
  function section(id, title, body) {
    if (!body) return '';
    sectionNo += 1;
    const num = String(sectionNo).padStart(2, '0');
    return `<section id="${id}"><div class="wrap">
      <h2 class="sec"><span class="num">${num}</span><span class="lbl">${esc(title)}</span></h2>
      ${body}
    </div></section>`;
  }

  function entries(list, key) {
    if (!has(list)) return '';
    return `<div class="timeline">${list.map(e => {
      const when = key === 'experience'
        ? [e.start, e.end].filter(has).map(esc).join(' – ')
        : esc(e.year || '');
      const head = key === 'experience' ? e.role : e.degree;
      const org = key === 'experience'
        ? [e.org, e.location].filter(has).map(esc).join(' · ')
        : esc(e.institution || '');
      const bullets = has(e.bullets) ? `<ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
      const notes = has(e.notes) ? `<p style="margin:10px 0 0;color:var(--ink-soft)">${esc(e.notes)}</p>` : '';
      return `<article class="entry">
        <div class="when">${when}</div>
        <div class="what">
          <h3>${esc(head)}</h3>
          ${org ? `<div class="org">${org}</div>` : ''}${bullets}${notes}
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function render(data) {
    const p = data.profile || {};
    document.title = `${p.name || 'Portfolio'} — ${p.title || 'Teaching Portfolio'}`;

    document.getElementById('brand').textContent = p.name || 'Portfolio';
    document.getElementById('hero').innerHTML = `<div class="wrap">${heroHTML(p)}</div>`;

    const avatar = document.getElementById('avatar');
    if (avatar) avatar.addEventListener('error', () => {
      const div = document.createElement('div');
      div.className = 'placeholder';
      div.textContent = initials(p.name);
      avatar.replaceWith(div);
    });

    const stats = has(data.stats)
      ? `<div class="wrap"><div class="stats">${data.stats.map(s =>
          `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div></div>`
      : '';

    const about = [
      has(p.summary) ? `<div class="prose"><p>${esc(p.summary)}</p></div>` : '',
      has(p.languages) ? `<div class="skillgroup" style="margin-top:22px"><h3>Languages</h3>
        <div class="pills">${p.languages.map(l => `<span class="pill">${esc(l)}</span>`).join('')}</div></div>` : ''
    ].join('');

    const certs = has(data.certifications)
      ? `<div class="cards">${data.certifications.map(c => {
          const inner = `<h3>${esc(c.name)}</h3><p>${[c.issuer, c.year].filter(has).map(esc).join(' · ')}</p>`;
          return has(c.url)
            ? `<a class="card" href="${esc(c.url)}" target="_blank" rel="noopener">${inner}</a>`
            : `<div class="card">${inner}</div>`;
        }).join('')}</div>`
      : '';

    const skills = has(data.skills)
      ? data.skills.map(g => `<div class="skillgroup"><h3>${esc(g.group)}</h3>
          <div class="pills">${(g.items || []).map(i => `<span class="pill">${esc(i)}</span>`).join('')}</div></div>`).join('')
      : '';

    const docs = has(data.documents)
      ? `<div class="cards">${data.documents.map(d =>
          `<a class="card" href="${esc(d.file)}" target="_blank" rel="noopener">
             <span class="tag">${esc(d.type || 'File')}</span>
             <h3>${esc(d.title)}</h3>
             ${has(d.description) ? `<p>${esc(d.description)}</p>` : ''}
           </a>`).join('')}</div>`
      : '';

    const gallery = has(data.gallery)
      ? `<div class="gallery">${data.gallery.map(g =>
          `<figure><img src="${esc(g.src)}" alt="${esc(g.caption || '')}" loading="lazy">
           ${has(g.caption) ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`
      : '';

    const quotes = has(data.testimonials)
      ? data.testimonials.map(t => `<blockquote><p>${esc(t.quote)}</p>
          <cite>${[t.author, t.role].filter(has).map(esc).join(', ')}</cite></blockquote>`).join('')
      : '';

    document.getElementById('stats').innerHTML = stats;
    sectionNo = 0;
    document.getElementById('sections').innerHTML = [
      section('about', 'About', about),
      section('experience', 'Experience', entries(data.experience, 'experience')),
      section('education', 'Education', entries(data.education, 'education')),
      section('certifications', 'Certifications', certs),
      section('skills', 'Skills', skills),
      section('documents', 'Documents', docs),
      section('gallery', 'Classroom', gallery),
      section('testimonials', 'References', quotes)
    ].join('');

    // Nav links only for sections that actually rendered.
    const labels = { about: 'About', experience: 'Experience', education: 'Education',
      certifications: 'Certifications', skills: 'Skills', documents: 'Documents',
      gallery: 'Classroom', testimonials: 'References' };
    document.getElementById('nav').innerHTML = Object.keys(labels)
      .filter(id => document.getElementById(id))
      .map(id => `<a href="#${id}">${labels[id]}</a>`).join('');

    const note = (data.settings && data.settings.footerNote) || '';
    document.getElementById('footer-note').textContent =
      `${p.name || ''} · ${new Date().getFullYear()}${note ? ' · ' + note : ''}`;
  }

  initTheme(document.getElementById('theme'));
  document.getElementById('print').addEventListener('click', () => window.print());

  loadPortfolio()
    .then(data => { applyAccent(data); render(data); })
    .catch(err => failure(document.getElementById('main'), err));
})();
