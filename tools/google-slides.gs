/**
 * Builds a Google Slides deck from data/portfolio.json.
 *
 * Setup (once, ~3 minutes):
 *   1. Go to https://script.google.com  ->  New project.
 *   2. Delete the sample code, paste this file in, and press Save.
 *   3. Edit DATA_URL below to point at your published JSON, e.g.
 *      https://USERNAME.github.io/REPO/data/portfolio.json
 *   4. Run -> buildDeck. Approve the permission prompt the first time.
 *   5. The execution log prints the URL of the new deck.
 *
 * Re-running makes a fresh deck; it never edits one you have already styled.
 */

var DATA_URL = 'https://USERNAME.github.io/REPO/data/portfolio.json';

function buildDeck() {
  var data = JSON.parse(UrlFetchApp.fetch(DATA_URL).getContentText());
  var p = data.profile || {};
  var deck = SlidesApp.create((p.name || 'Portfolio') + ' — Teaching Portfolio');

  // Slide 1 is created for us; use it as the title slide.
  var first = deck.getSlides()[0];
  first.getPlaceholder(SlidesApp.PlaceholderType.CENTERED_TITLE)
       .asShape().getText().setText(p.name || 'Teaching Portfolio');
  var sub = first.getPlaceholder(SlidesApp.PlaceholderType.SUBTITLE);
  if (sub) {
    sub.asShape().getText().setText(
      [p.title, p.school, p.location].filter(nonEmpty).join('\n'));
  }

  if (nonEmpty(p.summary)) bulletSlide(deck, 'Who I am', [p.summary]);

  if (any(data.stats)) {
    bulletSlide(deck, 'At a glance', data.stats.map(function (s) {
      return s.value + ' — ' + s.label;
    }));
  }

  (data.experience || []).forEach(function (e) {
    var header = e.role + (nonEmpty(e.org) ? ' · ' + e.org : '');
    var when = [e.start, e.end].filter(nonEmpty).join(' – ');
    var lines = (e.bullets && e.bullets.length) ? e.bullets.slice() : [];
    if (when) lines.unshift(when);
    bulletSlide(deck, header, lines);
  });

  if (any(data.education)) {
    bulletSlide(deck, 'Education', data.education.map(function (e) {
      return [e.degree, e.institution, e.year].filter(nonEmpty).join(' — ');
    }));
  }

  if (any(data.certifications)) {
    bulletSlide(deck, 'Certifications', data.certifications.map(function (c) {
      return [c.name, c.issuer, c.year].filter(nonEmpty).join(' — ');
    }));
  }

  if (any(data.skills)) {
    bulletSlide(deck, 'Skills', data.skills.map(function (g) {
      return g.group + ': ' + (g.items || []).join(', ');
    }));
  }

  if (any(data.documents)) {
    bulletSlide(deck, 'Documents', data.documents.map(function (d) {
      return d.title + (nonEmpty(d.description) ? ' — ' + d.description : '');
    }));
  }

  // Images must be publicly reachable over https for Slides to fetch them.
  (data.gallery || []).forEach(function (g) {
    imageSlide(deck, absolute(g.src), g.caption || '');
  });

  (data.testimonials || []).forEach(function (t) {
    bulletSlide(deck, 'Reference', ['“' + t.quote + '”',
      [t.author, t.role].filter(nonEmpty).join(', ')]);
  });

  bulletSlide(deck, 'Thank you', [p.email, p.phone, p.website].filter(nonEmpty));

  Logger.log('Deck created: ' + deck.getUrl());
  return deck.getUrl();
}

function bulletSlide(deck, title, lines) {
  var slide = deck.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(title);
  var body = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY);
  if (body) body.asShape().getText().setText(lines.join('\n'));
}

function imageSlide(deck, url, caption) {
  var slide = deck.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);
  slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(caption);
  try {
    var img = slide.insertImage(url);
    var maxW = 560, maxH = 300;
    var scale = Math.min(maxW / img.getWidth(), maxH / img.getHeight(), 1);
    img.setWidth(img.getWidth() * scale).setHeight(img.getHeight() * scale);
    img.setLeft((720 - img.getWidth()) / 2).setTop(150);
  } catch (err) {
    Logger.log('Could not insert image ' + url + ': ' + err);
  }
}

function absolute(src) {
  if (/^https?:\/\//.test(src)) return src;
  return DATA_URL.replace(/data\/portfolio\.json$/, '') + src;
}

function nonEmpty(v) { return v != null && String(v).trim() !== ''; }
function any(v) { return Array.isArray(v) && v.length > 0; }
