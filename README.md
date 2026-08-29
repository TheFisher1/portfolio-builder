# Portfolio Builder

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

## The required sections

The section set follows the five parts a Bulgarian teaching portfolio must contain:

| Section | Regulation | What goes in it |
|---|---|---|
| General information | Общи данни | Name, education, professional qualification, diplomas, certificates |
| Practical application | Практическо приложение | Work with students, methods used, innovative and competency-based approaches |
| Achievements | Постижения | Student results, competitions, olympiads, projects |
| Institutional policies | Институционални политики | Your part in the school's or kindergarten's policies |
| Career development | Кариерно развитие | Qualification upgrading, ПКС degrees, trainings |

Experience, competencies, documents, classroom photos and references sit alongside them. Every section
is optional — leave one empty and it does not appear.

**Settings → Headings** switches the section titles between English and Bulgarian. Only the headings
change; everything else is the teacher's own text, in whatever language they wrote it.

## What the exported file does

- **Portfolio view** — ruled paper, numbered sections, documents as download cards.
- **Present** (or press `p`) — the same content as slides: `←` `→` to move, `o` for an overview grid,
  `f` for fullscreen, `Esc` to come back.
- **PDF** — the print button. The portfolio prints as a portrait document; the deck prints one
  landscape page per slide. Both go to *Save as PDF* in the print dialog.
- **Theme** — light or the chalkboard dark, remembered per reader.

## The design

Not a developer portfolio: the visual language of a teacher's own materials. Ruled paper with a burgundy
margin line, sections numbered like a syllabus, the portrait taped on at an angle, a highlighter
stroke under the tagline. The deck opens on the same ruled sheet it continues on. Newsreader for text,
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
serve.py                local preview server, run with uv
data/example.json       the worked example behind "Load example"
data/example-files/     placeholder photos and PDFs the example pulls in
```

## Working on it locally

```bash
uv run serve.py
```

Then <http://localhost:8000> (`--port` to change it). [uv](https://docs.astral.sh/uv/) reads the
inline metadata at the top of `serve.py`, picks a Python and runs it — there is nothing to install
and no virtualenv to activate.

The project has no Python dependencies; `serve.py` is stdlib only. It exists because two things are
easy to get wrong with a bare `python3 -m http.server`: `.js` can come back as `text/plain` from the
system MIME registry, and cached files hide your edits. This one pins the content types and sends
`Cache-Control: no-store`.

Opening `index.html` off the disk will not work either way: the builder fetches `viewer.css` and
`viewer.js` to inline them, and browsers block that over `file://`.

## The example

"Load example" fills the form with a fictional teacher — Maria Petrova, at a school that does not
exist — and pulls in the placeholder photos and PDFs from `data/example-files/`. None of it is
anyone's real CV. It is there so the builder has something to show on a first visit; delete it and
the builder still works.

## Licence

MIT — see [LICENSE](LICENSE). The example content is part of it; the design is yours to change.

## Before you share what you make

Photographs of identifiable students need the school's and the parents' consent, and a PDF CV usually
carries a phone number and an address. The file you produce is easy to forward — that is the point,
and the reason to check it before sending.
