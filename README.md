# Teaching Portfolio Builder

Enter your details, drop in your photos and documents, download a finished portfolio.
**One HTML file** holds the portfolio page, a 16:9 slide deck and every image inside it.

Nothing is uploaded. Nothing is stored on a server. There is no account, no database and no
back end — the whole thing is a static page that does its work in the browser.

## How it works

1. **Fill in the form.** Sections for experience, education, skills, references and so on; leave
   anything blank and it simply doesn't appear.
2. **Drop in files.** Photos are resized to 1600px and re-encoded as JPEG in the browser (EXIF
   rotation applied, so phone photos come out upright). PDFs are taken as they are. Both are kept in
   IndexedDB so a half-finished portfolio survives a reload.
3. **Watch the preview.** The panel on the right is not a mock-up: it renders the exact file you are
   about to download, in an iframe. Switch between the portfolio and the deck.
4. **Download.** One self-contained `.html`. Open it offline, email it, print it to PDF, or drop it on
   any web host.

The downloaded file carries its own source data in a `<script type="application/json">` tag, so
**Open a file** in the builder reads it straight back — images included. The file is the save format.

## What the exported file does

- **Portfolio view** — ruled paper, numbered sections, documents as download cards.
- **Present** (or press `p`) — the same content as slides: `←` `→` to move, `o` for an overview grid,
  `f` for fullscreen, `Esc` to come back.
- **PDF** — the print button. The portfolio prints as a portrait document; the deck prints one
  landscape page per slide. Both go to *Save as PDF* in the print dialog.
- **Theme** — light or the chalkboard dark, remembered per reader.

## The design

Not a developer portfolio: the visual language of a teacher's own materials. Ruled paper with a red
margin line, sections numbered like a syllabus, the portrait taped on at an angle, a highlighter
stroke under the tagline. In dark mode the slide cover becomes a chalkboard. Newsreader for text,
Inter for labels, loaded from Google Fonts and falling back to Georgia and the system sans.

## Limits worth knowing

- Everything lives in **one browser profile**. Clearing site data, or moving to another device, starts
  over — which is why the downloaded file is the thing to keep.
- Photos are baked into the file as data URIs, roughly 4/3 of their byte size. Ten photos at 1600px
  land around 2–4 MB, fine to email. A hundred would not be.
- The exported file needs the internet only for its two web fonts, and reads fine without them.

## Hosting the builder

It is a static site, so GitHub Pages serves it as-is. `.github/workflows/deploy.yml` publishes the
repository on every push to `main` — **Settings → Pages → Source: GitHub Actions**, and nothing else.
Teachers then use the published page; they never need a GitHub account.

## Files

```
index.html              the builder
assets/js/app.js        form, preview, download, file round-trip
assets/js/media.js      image resizing + the browser-local file store
assets/js/render.js     data -> portfolio and slide markup, and the standalone document
assets/js/viewer.js     the script that ships inside every exported file
assets/css/app.css      the builder's chrome
assets/css/viewer.css   the portfolio and deck design, inlined into exports
data/example.json       the worked example behind "Load example"
docs/, images/          sample files the example pulls in (placeholders - replace or delete)
```

## Working on it locally

```bash
python3 -m http.server 8000
```

Then <http://localhost:8000>. Opening `index.html` off the disk will not work: the builder fetches
`viewer.css` and `viewer.js` to inline them, and browsers block that over `file://`.

## Before you share what you make

Photographs of identifiable students need the school's and the parents' consent, and a PDF CV usually
carries a phone number and an address. The file you produce is easy to forward — that is the point,
and the reason to check it before sending.
