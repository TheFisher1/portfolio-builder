/* Files the teacher picks never leave the browser. Images are resized and
   re-encoded here; everything is kept in IndexedDB so a half-finished
   portfolio survives a reload. Nothing is uploaded anywhere. */
(function () {
  const DB = 'portfolio-media', STORE = 'files', VERSION = 1;
  let dbp = null;

  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }

  function tx(mode, fn) {
    return db().then(d => new Promise((res, rej) => {
      const t = d.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
  }

  const put   = rec => tx('readwrite', s => s.put(rec)).then(() => rec);
  const get   = id  => tx('readonly',  s => s.get(id));
  const del   = id  => tx('readwrite', s => s.delete(id));
  const all   = ()  => tx('readonly',  s => s.getAll());
  const clear = ()  => tx('readwrite', s => s.clear());

  const newId = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- images ---------- */

  // Decode with EXIF orientation applied, so photos off a phone are upright.
  async function decode(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e) { /* older Safari ignores the option - fall through */ }
    }
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Not a readable image')); };
      img.src = url;
    });
  }

  async function shrink(file, maxDim, quality) {
    const src = await decode(file);
    const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
    const w = Math.round(src.width * scale), h = Math.round(src.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    if (src.close) src.close();
    // JPEG keeps photographs small and transparency is not needed here.
    const data = canvas.toDataURL('image/jpeg', quality);
    return { data, w, h, bytes: Math.round((data.length - 22) * 0.75) };
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }

  /* ---------- public API ---------- */

  async function addImage(file, maxDim = 1600, quality = 0.78) {
    const out = await shrink(file, maxDim, quality);
    return put({ id: newId(), kind: 'image', name: file.name, type: 'image/jpeg',
      data: out.data, w: out.w, h: out.h, bytes: out.bytes, added: Date.now() });
  }

  // Documents are stored as they are; there is nothing sensible to re-encode.
  async function addFile(file) {
    const data = await readAsDataURL(file);
    return put({ id: newId(), kind: 'file', name: file.name,
      type: file.type || 'application/octet-stream', data, bytes: file.size, added: Date.now() });
  }

  const isRef = v => typeof v === 'string' && v.slice(0, 6) === 'local:';
  const refId = v => (isRef(v) ? v.slice(6) : null);
  const ref   = rec => 'local:' + rec.id;

  // Swap every local: reference for its data URI, ready to inline into a file.
  async function inline(data) {
    const copy = JSON.parse(JSON.stringify(data));
    const jobs = [];
    const swap = (obj, key) => {
      if (!isRef(obj[key])) return;
      jobs.push(get(refId(obj[key])).then(rec => { obj[key] = rec ? rec.data : ''; }));
    };
    if (copy.profile) swap(copy.profile, 'photo');
    (copy.gallery || []).forEach(g => swap(g, 'src'));
    (copy.documents || []).forEach(d => swap(d, 'file'));
    await Promise.all(jobs);
    return copy;
  }

  async function totalBytes() {
    const rows = await all().catch(() => []);
    return rows.reduce((n, r) => n + (r.bytes || 0), 0);
  }

  function humanBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  window.Media = { addImage, addFile, get, del, all, clear, isRef, refId, ref,
    inline, totalBytes, humanBytes };
})();
