/* The builder. Owns the form, the live preview and the download.
   State lives in localStorage (text) + IndexedDB (files); nothing is sent anywhere. */
(function () {
  const DRAFT = 'portfolio-draft';
  const $ = sel => document.querySelector(sel);

  /* ---------------- schema ----------------
     types: text | textarea | lines | color | image | file | hidden        */
  const SCHEMA = [
    { path: 'profile', label: 'You', kind: 'object', open: true, fields: [
      { k: 'name', label: 'Full name' },
      { k: 'title', label: 'Job title' },
      { k: 'qualification', label: 'Professional qualification', hint: 'придобита проф. квалификация', full: true },
      { k: 'school', label: 'School / institution' },
      { k: 'location', label: 'Location' },
      { k: 'email', label: 'Email' },
      { k: 'phone', label: 'Phone' },
      { k: 'website', label: 'Website', full: true },
      { k: 'photo', label: 'Portrait', type: 'image', full: true },
      { k: 'tagline', label: 'One-line tagline', full: true },
      { k: 'summary', label: 'Summary paragraph', type: 'textarea', full: true },
      { k: 'languages', label: 'Languages', type: 'lines', hint: 'one per line', full: true }
    ]},
    { path: 'profile.links', label: 'Links', kind: 'array', item: 'Link', fields: [
      { k: 'label', label: 'Label' }, { k: 'url', label: 'URL' }
    ]},
    { path: 'stats', label: 'Headline numbers', kind: 'array', item: 'Number', fields: [
      { k: 'value', label: 'Value', hint: 'e.g. 12' }, { k: 'label', label: 'Caption' }
    ]},
    { path: 'experience', label: 'Experience', kind: 'array', item: 'Position', fields: [
      { k: 'role', label: 'Role' }, { k: 'org', label: 'School' },
      { k: 'location', label: 'Location' }, { k: 'start', label: 'From' }, { k: 'end', label: 'To' },
      { k: 'bullets', label: 'What you did there', type: 'lines', hint: 'one per line', full: true }
    ]},
    { path: 'education', label: 'Education', kind: 'array', item: 'Qualification', fields: [
      { k: 'degree', label: 'Degree' }, { k: 'institution', label: 'Institution' },
      { k: 'year', label: 'Year' }, { k: 'notes', label: 'Notes', type: 'textarea', full: true }
    ]},
    { path: 'certifications', label: 'Certifications', kind: 'array', item: 'Certificate', fields: [
      { k: 'name', label: 'Name' }, { k: 'issuer', label: 'Issuer' },
      { k: 'year', label: 'Year' }, { k: 'url', label: 'Link' }
    ]},
    { path: 'practice', label: 'Practical application — практическо приложение',
      kind: 'array', item: 'Entry', fields: [
      { k: 'title', label: 'What you did', hint: 'a unit, a project, a way of working' },
      { k: 'subject', label: 'Subject / year group' },
      { k: 'year', label: 'When' },
      { k: 'description', label: 'Description', type: 'textarea', full: true },
      { k: 'methods', label: 'Methods and approaches', type: 'lines',
        hint: 'one per line — innovative and competency-based approaches', full: true }
    ]},
    { path: 'achievements', label: 'Achievements — постижения',
      kind: 'array', item: 'Achievement', fields: [
      { k: 'title', label: 'Achievement' },
      { k: 'event', label: 'Competition / olympiad / project' },
      { k: 'year', label: 'Year' },
      { k: 'result', label: 'Result', hint: 'places, marks, how many students', full: true }
    ]},
    { path: 'policies', label: 'Institutional policies — институционални политики',
      kind: 'array', item: 'Policy', fields: [
      { k: 'title', label: 'Policy or initiative' },
      { k: 'role', label: 'Your part in it' },
      { k: 'period', label: 'Period' },
      { k: 'description', label: 'What came of it', type: 'textarea', full: true }
    ]},
    { path: 'development', label: 'Career development — кариерно развитие',
      kind: 'array', item: 'Entry', fields: [
      { k: 'title', label: 'Qualification or training' },
      { k: 'kind', label: 'Kind', hint: 'ПКС, course, qualification credits' },
      { k: 'issuer', label: 'Awarded by' },
      { k: 'year', label: 'Year' },
      { k: 'notes', label: 'Notes', type: 'textarea', full: true }
    ]},
    { path: 'skills', label: 'Competencies', kind: 'array', item: 'Group', fields: [
      { k: 'group', label: 'Group name', hint: 'e.g. Teaching' },
      { k: 'items', label: 'Skills', type: 'lines', hint: 'one per line', full: true }
    ]},
    { path: 'documents', label: 'Documents', kind: 'array', item: 'Document', drop: 'file', fields: [
      { k: 'title', label: 'Title' }, { k: 'type', label: 'Kind', hint: 'PDF, DOCX…' },
      { k: 'file', label: 'File', type: 'file', full: true },
      { k: 'filename', type: 'hidden' },
      { k: 'description', label: 'Description', type: 'textarea', full: true }
    ]},
    { path: 'gallery', label: 'Classroom photos', kind: 'array', item: 'Photo', drop: 'image', fields: [
      { k: 'src', label: 'Photo', type: 'image', full: true },
      { k: 'caption', label: 'Caption', full: true }
    ]},
    { path: 'testimonials', label: 'References', kind: 'array', item: 'Quote', fields: [
      { k: 'quote', label: 'Quote', type: 'textarea', full: true },
      { k: 'author', label: 'Author' }, { k: 'role', label: 'Their role' }
    ]},
    { path: 'settings', label: 'Settings', kind: 'object', fields: [
      { k: 'language', label: 'Headings', type: 'select', options: [
        { v: 'en', label: 'English' }, { v: 'bg', label: 'Български' }] },
      { k: 'accent', label: 'Accent colour', type: 'color' },
      { k: 'footerNote', label: 'Footer note', full: true }
    ]}
  ];

  const esc = window.Render.esc;
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  /* ---------------- form markup ---------------- */

  function fieldHTML(f, value) {
    if (f.type === 'hidden') return `<input type="hidden" data-k="${f.k}" value="${esc(value || '')}">`;
    const v = Array.isArray(value) ? value.join('\n') : (value == null ? '' : String(value));
    const label = `<label>${esc(f.label)}${f.hint ? ` <span class="hint">— ${esc(f.hint)}</span>` : ''}</label>`;
    let input;
    if (f.type === 'textarea' || f.type === 'lines') {
      input = `<textarea data-k="${f.k}" data-type="${f.type}">${esc(v)}</textarea>`;
    } else if (f.type === 'color') {
      input = `<input type="color" data-k="${f.k}" value="${esc(v || '#4a5240')}">`;
    } else if (f.type === 'select') {
      input = `<select data-k="${f.k}">${f.options.map(o =>
        `<option value="${esc(o.v)}"${o.v === v ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'image' || f.type === 'file') {
      input = `<div class="filefield" data-kind="${f.type}">
          <div class="thumb" data-thumb>none</div>
          <div class="meta"><b data-name>No file chosen</b><span data-size></span></div>
          <label class="btn ghost" style="margin:0">Choose
            <input type="file" hidden data-pick="${f.k}"
              accept="${f.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,image/*,application/pdf'}">
          </label>
          <button class="mini danger" type="button" data-act="unset" title="Remove">✕</button>
          <input type="hidden" data-k="${f.k}" value="${esc(v)}">
        </div>`;
    } else {
      input = `<input type="text" data-k="${f.k}" value="${esc(v)}">`;
    }
    return `<div class="${f.full ? 'full' : ''}">${label}${input}</div>`;
  }

  function itemHTML(sec, obj, n) {
    return `<div class="item">
      <div class="item-bar">
        <strong>${esc(sec.item)} ${n}</strong>
        <button class="mini" type="button" data-act="up" title="Move up">↑</button>
        <button class="mini" type="button" data-act="down" title="Move down">↓</button>
        <button class="mini danger" type="button" data-act="del" title="Remove">✕</button>
      </div>
      <div class="row2">${sec.fields.map(f => fieldHTML(f, obj[f.k])).join('')}</div>
    </div>`;
  }

  function sectionHTML(sec, data) {
    const val = get(data, sec.path);
    const head = n => `<button class="fs-head" type="button" data-act="toggle">
        <span class="caret">›</span><span class="name">${esc(sec.label)}</span>
        ${n == null ? '' : `<span class="count">${n}</span>`}
      </button>`;

    if (sec.kind === 'object') {
      const o = val || {};
      return `<fieldset data-path="${sec.path}" data-kind="object"${sec.open ? ' open' : ''}>
        ${head(null)}
        <div class="fs-body"><div class="row2">${sec.fields.map(f => fieldHTML(f, o[f.k])).join('')}</div></div>
      </fieldset>`;
    }

    const arr = Array.isArray(val) ? val : [];
    const drop = sec.drop
      ? `<div class="drop" data-drop="${sec.drop}">
           <b>Drop ${sec.drop === 'image' ? 'photos' : 'documents'} here</b>
           or click to choose — ${sec.drop === 'image'
             ? 'resized to 1600px and kept in this browser' : 'kept in this browser'}
         </div>` : '';

    return `<fieldset data-path="${sec.path}" data-kind="array">
      ${head(arr.length)}
      <div class="fs-body">
        <div class="items">${arr.map((o, i) => itemHTML(sec, o || {}, i + 1)).join('')}</div>
        ${drop}
        <button class="btn ghost" type="button" data-act="add" style="margin-top:12px">+ Add ${esc(sec.item.toLowerCase())}</button>
      </div>
    </fieldset>`;
  }

  /* ---------------- state ---------------- */

  function readFields(scope, fields) {
    const o = {};
    fields.forEach(f => {
      const el = scope.querySelector('[data-k="' + f.k + '"]');
      if (!el) return;
      o[f.k] = f.type === 'lines'
        ? el.value.split('\n').map(s => s.trim()).filter(Boolean)
        : el.value.trim();
    });
    return o;
  }

  function serialize() {
    const out = {};
    SCHEMA.forEach(sec => {
      const fs = document.querySelector('fieldset[data-path="' + sec.path + '"]');
      if (!fs) return;
      const value = sec.kind === 'object'
        ? readFields(fs, sec.fields)
        : Array.prototype.map.call(fs.querySelectorAll('.item'), it => readFields(it, sec.fields));
      const keys = sec.path.split('.');
      let node = out;
      keys.slice(0, -1).forEach(k => { node = node[k] = node[k] || {}; });
      node[keys[keys.length - 1]] = value;
    });
    return out;
  }

  let data = null, view = 'portfolio', assets = null, timer = null;

  const form = $('#form'), frame = $('#preview'), toastEl = $('#toast');

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // viewer.css and viewer.js are inlined into every preview and download.
  function loadAssets() {
    if (assets) return assets;
    assets = Promise.all([
      fetch('assets/css/viewer.css').then(r => r.text()),
      fetch('assets/js/viewer.js').then(r => r.text())
    ]).then(([css, viewer]) => ({ css, viewer }));
    return assets;
  }

  async function buildDocument() {
    const [{ css, viewer }, filled] = await Promise.all([loadAssets(), window.Media.inline(data)]);
    return window.Render.document({ data: filled, css, viewer, view });
  }

  async function refresh() {
    try {
      frame.srcdoc = await buildDocument();
    } catch (err) {
      toast('Preview failed: ' + err.message);
    }
    const bytes = await window.Media.totalBytes();
    $('#size').textContent = bytes ? window.Media.humanBytes(bytes) + ' of files' : '';
  }

  function paint() {
    const openPaths = new Set(Array.prototype.map.call(
      document.querySelectorAll('fieldset[open]'), fs => fs.dataset.path));
    form.innerHTML = SCHEMA.map(s => sectionHTML(s, data)).join('');
    if (openPaths.size) {
      Array.prototype.forEach.call(form.querySelectorAll('fieldset'), fs => {
        fs.toggleAttribute('open', openPaths.has(fs.dataset.path));
      });
    }
    hydrateFiles();
    sync();
  }

  function sync(immediate) {
    data = serialize();
    try { localStorage.setItem(DRAFT, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
    Array.prototype.forEach.call(document.querySelectorAll('fieldset[data-kind="array"]'), fs => {
      const c = fs.querySelector('.count');
      if (c) c.textContent = fs.querySelectorAll('.item').length;
    });
    clearTimeout(timer);
    timer = setTimeout(refresh, immediate ? 0 : 400);
  }

  // Fill in thumbnails and file names for every picker holding a local: reference.
  function hydrateFiles() {
    Array.prototype.forEach.call(document.querySelectorAll('.filefield'), field => {
      const hidden = field.querySelector('input[type="hidden"]');
      const thumb = field.querySelector('[data-thumb]');
      const name = field.querySelector('[data-name]');
      const size = field.querySelector('[data-size]');
      const val = hidden.value;
      if (!window.Media.isRef(val)) {
        thumb.textContent = val ? 'link' : 'none';
        thumb.innerHTML = val ? 'link' : 'none';
        name.textContent = val || 'No file chosen';
        size.textContent = '';
        return;
      }
      window.Media.get(window.Media.refId(val)).then(rec => {
        if (!rec) { name.textContent = 'Missing file'; return; }
        thumb.innerHTML = rec.kind === 'image'
          ? `<img src="${rec.data}" alt="" style="width:100%;height:100%;object-fit:cover">`
          : (rec.type.indexOf('pdf') > -1 ? 'PDF' : 'FILE');
        name.textContent = rec.name;
        size.textContent = window.Media.humanBytes(rec.bytes)
          + (rec.kind === 'image' ? ` · ${rec.w}×${rec.h}` : '');
      });
    });
  }

  const kindFromName = n => (n.split('.').pop() || '').toUpperCase().slice(0, 4);

  async function storeInto(field, file) {
    const kind = field.dataset.kind;
    const hidden = field.querySelector('input[type="hidden"]');
    try {
      const rec = kind === 'image' ? await window.Media.addImage(file) : await window.Media.addFile(file);
      hidden.value = window.Media.ref(rec);
      // Fill in the neighbouring title/kind fields if the teacher left them empty.
      const item = field.closest('.item');
      if (item) {
        const t = item.querySelector('[data-k="title"]');
        const ty = item.querySelector('[data-k="type"]');
        const fn = item.querySelector('[data-k="filename"]');
        if (fn) fn.value = rec.name;
        if (t && !t.value) t.value = rec.name.replace(/\.[^.]+$/, '');
        if (ty && !ty.value) ty.value = kindFromName(rec.name);
      }
      hydrateFiles();
      sync(true);
    } catch (err) {
      toast('Could not read that file: ' + err.message);
    }
  }

  /* ---------------- events ---------------- */

  form.addEventListener('input', () => sync());

  form.addEventListener('change', e => {
    const pick = e.target.closest('input[data-pick]');
    if (!pick || !pick.files.length) return;
    storeInto(pick.closest('.filefield'), pick.files[0]);
    pick.value = '';
  });

  form.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act], .drop');
    if (!btn) return;
    const fs = btn.closest('fieldset');
    const sec = fs && SCHEMA.find(s => s.path === fs.dataset.path);

    if (btn.classList.contains('drop')) { pickMany(sec, btn.dataset.drop); return; }

    const act = btn.dataset.act;
    if (act === 'toggle') { fs.toggleAttribute('open'); return; }

    if (act === 'unset') {
      const field = btn.closest('.filefield');
      field.querySelector('input[type="hidden"]').value = '';
      hydrateFiles(); sync(true);
      return;
    }

    const items = fs.querySelector('.items');
    if (act === 'add') {
      const wrap = document.createElement('div');
      wrap.innerHTML = itemHTML(sec, {}, items.children.length + 1);
      items.appendChild(wrap.firstElementChild);
      hydrateFiles();
    } else {
      const item = btn.closest('.item');
      if (!item) return;
      if (act === 'del') item.remove();
      if (act === 'up' && item.previousElementSibling) items.insertBefore(item, item.previousElementSibling);
      if (act === 'down' && item.nextElementSibling) items.insertBefore(item.nextElementSibling, item);
    }
    renumber(sec, items);
    sync(true);
  });

  function renumber(sec, items) {
    Array.prototype.forEach.call(items.children, (el, i) => {
      const s = el.querySelector('strong');
      if (s) s.textContent = sec.item + ' ' + (i + 1);
    });
  }

  // Adding several photos or documents at once creates one row per file.
  function pickMany(sec, kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = kind === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,application/pdf';
    input.addEventListener('change', () => addFiles(sec, kind, input.files));
    input.click();
  }

  async function addFiles(sec, kind, files) {
    const fs = document.querySelector('fieldset[data-path="' + sec.path + '"]');
    const items = fs.querySelector('.items');
    for (const file of Array.prototype.slice.call(files)) {
      const wrap = document.createElement('div');
      wrap.innerHTML = itemHTML(sec, {}, items.children.length + 1);
      const item = wrap.firstElementChild;
      items.appendChild(item);
      await storeInto(item.querySelector('.filefield'), file);
    }
    renumber(sec, items);
    sync(true);
  }

  ['dragenter', 'dragover'].forEach(t => form.addEventListener(t, e => {
    const zone = e.target.closest('.drop');
    if (!zone) return;
    e.preventDefault();
    zone.classList.add('over');
  }));
  form.addEventListener('dragleave', e => {
    const zone = e.target.closest('.drop');
    if (zone) zone.classList.remove('over');
  });
  form.addEventListener('drop', e => {
    const zone = e.target.closest('.drop');
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('over');
    const sec = SCHEMA.find(s => s.path === zone.closest('fieldset').dataset.path);
    addFiles(sec, zone.dataset.drop, e.dataTransfer.files);
  });

  /* ---------------- top bar ---------------- */

  $('#tab-portfolio').addEventListener('click', () => setTab('portfolio'));
  $('#tab-slides').addEventListener('click', () => setTab('deck'));

  function setTab(v) {
    view = v;
    $('#tab-portfolio').setAttribute('aria-selected', String(v !== 'deck'));
    $('#tab-slides').setAttribute('aria-selected', String(v === 'deck'));
    $('#viewnote').textContent = v === 'deck' ? '← → to move · o for overview' : 'live preview';
    refresh();
  }

  const slug = s => (s || 'teaching').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 40) || 'teaching';

  $('#download').addEventListener('click', async () => {
    const btn = $('#download');
    btn.disabled = true; btn.textContent = 'Building…';
    try {
      const html = await buildDocument();
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = slug((data.profile || {}).name) + '-portfolio.html';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Downloaded — ' + window.Media.humanBytes(blob.size) + ', everything inside one file');
    } catch (err) {
      toast('Could not build the file: ' + err.message);
    }
    btn.disabled = false; btn.textContent = '⤓ Download portfolio';
  });

  // Reopening an exported file: its data rides along in a <script type="application/json">.
  $('#open').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const tag = doc.getElementById('portfolio-data');
      if (!tag) throw new Error('no portfolio data found in that file');
      const incoming = JSON.parse(tag.textContent);
      await window.Media.clear().catch(() => {});   // opening a file replaces everything
      data = await importInlined(incoming);
      paint();
      toast('Opened ' + file.name);
    } catch (err) {
      toast('Could not open that file: ' + err.message);
    }
  });

  // Data URIs coming back in go to IndexedDB so they can be edited and re-exported.
  async function importInlined(raw) {
    const keep = async (value, name) => {
      if (typeof value !== 'string' || value.slice(0, 5) !== 'data:') return value;
      const blob = await (await fetch(value)).blob();
      const file = new File([blob], name, { type: blob.type });
      // Already sized and encoded when they were first added - store as they are.
      return window.Media.ref(await window.Media.addFile(file));
    };
    if (raw.profile) raw.profile.photo = await keep(raw.profile.photo, 'portrait.jpg');
    for (const g of raw.gallery || []) g.src = await keep(g.src, g.caption || 'photo.jpg');
    for (const d of raw.documents || []) d.file = await keep(d.file, d.filename || 'document');
    return raw;
  }

  $('#example').addEventListener('click', async () => {
    if (!confirm('Replace what is here with the example portfolio?')) return;
    try {
      const sample = await fetch('data/example.json?v=' + Date.now()).then(r => r.json());
      await window.Media.clear().catch(() => {});
      data = await importPaths(sample);
      paint();
      toast('Example loaded — edit anything you like');
    } catch (err) {
      toast('Could not load the example: ' + err.message);
    }
  });

  // The example points at files in this repo; pull them in so the export stays self-contained.
  async function importPaths(raw) {
    const keep = async (path, kind) => {
      if (!path || /^(https?:|data:|local:)/.test(path)) return path;
      try {
        const blob = await fetch(path).then(r => r.blob());
        const file = new File([blob], path.split('/').pop(), { type: blob.type });
        const rec = kind === 'image' && blob.type.indexOf('svg') === -1
          ? await window.Media.addImage(file)
          : await window.Media.addFile(file);
        return window.Media.ref(rec);
      } catch (e) { return path; }
    };
    if (raw.profile) raw.profile.photo = await keep(raw.profile.photo, 'image');
    for (const g of raw.gallery || []) g.src = await keep(g.src, 'image');
    for (const d of raw.documents || []) {
      d.filename = (d.file || '').split('/').pop();
      d.file = await keep(d.file, 'file');
    }
    return raw;
  }

  $('#reset').addEventListener('click', async () => {
    if (!confirm('Delete everything you have entered, including the files in this browser?')) return;
    try { localStorage.removeItem(DRAFT); } catch (e) { /* ignore */ }
    await window.Media.clear().catch(() => {});
    data = blank();
    paint();
    toast('Cleared');
  });

  function blank() {
    const d = {};
    SCHEMA.forEach(sec => {
      const keys = sec.path.split('.');
      let node = d;
      keys.slice(0, -1).forEach(k => { node = node[k] = node[k] || {}; });
      node[keys[keys.length - 1]] = sec.kind === 'object' ? {} : [];
    });
    d.settings = { accent: '#4a5240', footerNote: '' };
    ['education', 'experience', 'practice', 'achievements', 'policies', 'development', 'skills']
      .forEach(k => { d[k] = [{}]; });
    d.settings.language = 'en';
    return d;
  }

  /* ---------------- start ---------------- */
  (function start() {
    let draft = null;
    try { draft = localStorage.getItem(DRAFT); } catch (e) { /* ignore */ }
    if (draft) { try { data = JSON.parse(draft); } catch (e) { data = null; } }
    if (!data || !Object.keys(data).length) data = blank();
    paint();
  })();
})();
