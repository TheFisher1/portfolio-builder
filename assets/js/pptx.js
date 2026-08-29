/* Export the deck as a .pptx, which is the only format Google Slides will
   import. Reads the same slide model the HTML deck is built from.

   PptxGenJS is vendored in vendor/ and loaded on first use, so the builder
   stays light and works offline. */
(function () {
  const LIB = 'vendor/pptxgen.bundle.js';

  const C = {                       // the palette, without the # PptxGenJS omits
    paper:  'FBF7F2',
    ink:    '211A1E',
    soft:   '6B5F63',
    margin: '7D2F42',
    rule:   'E6DCD2'
  };
  const SERIF = 'Georgia';          // both are present in Google Slides,
  const SANS  = 'Arial';            // PowerPoint and Keynote

  // 16:9 at 10in wide. Text sits right of the margin line, as on paper.
  const M = { line: 1.0, x: 1.3, w: 8.2, right: 0.5 };

  function loadLib() {
    if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = () => window.PptxGenJS ? res(window.PptxGenJS)
        : rej(new Error('the PowerPoint library did not register'));
      s.onerror = () => rej(new Error('could not load ' + LIB));
      document.head.appendChild(s);
    });
  }

  /* PowerPoint has no SVG, and a portrait photo should not be stretched.
     Redraw anything that is not already a JPEG onto a canvas. */
  function raster(src) {
    return new Promise(res => {
      if (/^data:image\/(jpeg|png)/.test(src)) {
        const img = new Image();
        img.onload = () => res({ data: src, w: img.width, h: img.height });
        img.onerror = () => res(null);
        img.src = src;
        return;
      }
      const img = new Image();
      img.onload = () => {
        const w = img.width || 1600, h = img.height || 900;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        res({ data: c.toDataURL('image/jpeg', 0.82), w, h });
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  /* ---------- one slide per model entry ---------- */

  function chrome(slide, m, i, total, name) {
    slide.background = { color: C.paper };
    if (m.kind === 'cover') return;
    slide.addShape('rect', { x: M.line, y: 0, w: 0.012, h: 5.625, fill: { color: C.margin } });
    if (m.kicker) {
      slide.addText(String(m.kicker).toUpperCase(), { x: M.x, y: 0.62, w: M.w, h: 0.3,
        fontFace: SANS, fontSize: 11, bold: true, charSpacing: 2.4, color: C.margin });
    }
    slide.addText(name, { x: M.x, y: 5.02, w: 4, h: 0.25,
      fontFace: SANS, fontSize: 8, charSpacing: 1.4, color: C.soft });
    slide.addText(`${i + 1} / ${total}`, { x: 10 - M.right - 1.2, y: 5.02, w: 1.2, h: 0.25,
      fontFace: SANS, fontSize: 8, charSpacing: 1.4, color: C.soft, align: 'right' });
  }

  function title(slide, text, y) {
    slide.addText(text, { x: M.x, y: y, w: M.w, h: 0.75,
      fontFace: SERIF, fontSize: 30, color: C.ink });
  }

  function bulletList(slide, items, y) {
    if (!items || !items.length) return;
    slide.addText(items.map(t => ({ text: String(t),
      options: { bullet: { characterCode: '2014' }, breakLine: true } })), {
      x: M.x, y: y, w: M.w, h: 5.625 - y - 0.7, valign: 'top',
      fontFace: SERIF, fontSize: 15, color: C.ink, lineSpacingMultiple: 1.3, paraSpaceAfter: 6
    });
  }

  const draw = {
    cover(slide, m) {
      slide.addShape('rect', { x: M.line, y: 0, w: 0.012, h: 5.625, fill: { color: C.margin } });
      slide.addText(m.name, { x: M.x, y: 1.75, w: M.w, h: 1,
        fontFace: SERIF, fontSize: 44, color: C.ink });
      if (m.role) {
        slide.addText(String(m.role).toUpperCase(), { x: M.x, y: 2.72, w: M.w, h: 0.3,
          fontFace: SANS, fontSize: 12, bold: true, charSpacing: 3, color: C.margin });
      }
      if (m.meta) {
        slide.addText(m.meta, { x: M.x, y: 3.04, w: M.w, h: 0.3,
          fontFace: SERIF, fontSize: 13, color: C.soft });
      }
      slide.addShape('rect', { x: M.x, y: 3.55, w: 0.85, h: 0.025, fill: { color: C.margin } });
      if (m.tagline) {
        slide.addText(m.tagline, { x: M.x, y: 3.8, w: 5.2, h: 0.8,
          fontFace: SERIF, fontSize: 16, italic: true, color: C.soft });
      }
    },

    prose(slide, m) {
      title(slide, m.title, 0.95);
      slide.addText(m.text, { x: M.x, y: 1.85, w: 6.6, h: 2.2, valign: 'top',
        fontFace: SERIF, fontSize: 15, color: C.ink, lineSpacingMultiple: 1.35 });
      if (m.chips) {
        slide.addText(String(m.chips.label).toUpperCase(), { x: M.x, y: 4.05, w: M.w, h: 0.25,
          fontFace: SANS, fontSize: 9, bold: true, charSpacing: 2, color: C.soft });
        slide.addText(m.chips.items.join('   ·   '), { x: M.x, y: 4.3, w: M.w, h: 0.35,
          fontFace: SERIF, fontSize: 14, color: C.ink });
      }
    },

    stats(slide, m) {
      const n = Math.max(1, m.items.length);
      const w = M.w / n;
      slide.addShape('rect', { x: M.x, y: 2.05, w: M.w, h: 0.012, fill: { color: C.rule } });
      slide.addShape('rect', { x: M.x, y: 3.55, w: M.w, h: 0.012, fill: { color: C.rule } });
      m.items.forEach((s, i) => {
        slide.addText(String(s.value), { x: M.x + i * w, y: 2.35, w: w, h: 0.7,
          fontFace: SERIF, fontSize: 34, color: C.ink, align: 'center' });
        slide.addText(String(s.label || '').toUpperCase(), { x: M.x + i * w, y: 3.02, w: w, h: 0.4,
          fontFace: SANS, fontSize: 9, bold: true, charSpacing: 1.6, color: C.soft, align: 'center' });
      });
    },

    bullets(slide, m) {
      title(slide, m.title, 0.95);
      let y = 1.75;
      if (m.sub) {
        slide.addText(m.sub, { x: M.x, y: 1.72, w: M.w, h: 0.3,
          fontFace: SERIF, fontSize: 13, italic: true, color: C.soft });
        y = 2.15;
      }
      bulletList(slide, m.items, y);
    },

    groups(slide, m) {
      title(slide, m.title, 0.95);
      let y = 1.8;
      m.groups.forEach(g => {
        slide.addText(String(g.group || '').toUpperCase(), { x: M.x, y: y, w: M.w, h: 0.25,
          fontFace: SANS, fontSize: 9, bold: true, charSpacing: 2, color: C.soft });
        slide.addText((g.items || []).join('   ·   '), { x: M.x, y: y + 0.24, w: M.w, h: 0.4,
          fontFace: SERIF, fontSize: 14, color: C.ink });
        y += 0.82;
      });
    },

    image(slide, m, img) {
      slide.addText(m.title, { x: M.x, y: 1.5, w: 3.3, h: 1.4, valign: 'top',
        fontFace: SERIF, fontSize: 24, color: C.ink });
      if (!img) return;
      // Fit inside the right-hand half without distorting the photograph.
      const box = { x: 5.0, y: 1.0, w: 4.5, h: 3.6 };
      const scale = Math.min(box.w / img.w, box.h / img.h);
      const w = img.w * scale, h = img.h * scale;
      slide.addImage({ data: img.data, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h });
    },

    quote(slide, m) {
      slide.addText('“', { x: M.x - 0.05, y: 1.1, w: 1, h: 1,
        fontFace: SERIF, fontSize: 72, color: C.margin });
      slide.addText(m.text, { x: M.x + 0.55, y: 1.55, w: M.w - 0.55, h: 2.2, valign: 'top',
        fontFace: SERIF, fontSize: 22, italic: true, color: C.ink, lineSpacingMultiple: 1.3 });
      if (m.who) {
        slide.addText(String(m.who).toUpperCase(), { x: M.x + 0.55, y: 3.95, w: M.w, h: 0.3,
          fontFace: SANS, fontSize: 9, bold: true, charSpacing: 2, color: C.soft });
      }
    },

    closing(slide, m) {
      title(slide, m.title, 1.6);
      bulletList(slide, m.items, 2.5);
    }
  };

  /* ---------- assembly ---------- */

  async function build(data) {
    const PptxGenJS = await loadLib();
    const model = window.Render.slideModel(data);
    const p = data.profile || {};
    const name = p.name || '';

    // Rasterise every picture up front; PowerPoint takes no SVG.
    const images = {};
    await Promise.all(model.filter(m => m.kind === 'image')
      .map(m => raster(m.src).then(r => { images[m.src] = r; })));

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = name;
    pptx.title = [name, p.title].filter(Boolean).join(' — ') || 'Portfolio';

    model.forEach((m, i) => {
      const slide = pptx.addSlide();
      chrome(slide, m, i, model.length, name);
      draw[m.kind](slide, m, images[m.src]);
    });

    return pptx.write({ outputType: 'blob' });
  }

  window.Pptx = { build };
})();
