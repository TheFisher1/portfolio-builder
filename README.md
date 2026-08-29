# Teaching portfolio — static site for GitHub Pages

One JSON file holds the content. Three pages read it:

| Page | What it is |
|---|---|
| `index.html` | The portfolio: profile, experience, education, skills, documents, photos, references. |
| `slides.html` | The same content as a 16:9 deck — arrow keys, overview, fullscreen, print to PDF. |
| `editor.html` | A form that writes `data/portfolio.json` for you. No code, no backend. |

No build step, no dependencies, no server. It is plain HTML, CSS and JavaScript.

## The design

The look is deliberately not a developer portfolio: it is the visual language of a teacher's own
materials — ruled paper, a red margin line running down the page, section numbers like a syllabus,
photographs taped on, a highlighter stroke under the tagline. Dark mode turns the deck's cover into a
chalkboard. Type is Newsreader (serif) with Inter for labels, loaded from Google Fonts and falling back
to Georgia and the system sans if that is blocked.

The accent colour in the editor's Settings section recolours links in light mode; the dark palette keeps
its own. The red margin line is fixed — it is the thing that makes the page recognisable.

## Deploy

1. Create a repository on GitHub (public, or private on a paid plan) and push these files to `main`.
2. **Settings → Pages → Source: GitHub Actions.** That is the only switch to flip.
3. `.github/workflows/deploy.yml` publishes the repository on every push to `main` — there is no build
   step, the whole repo is the artifact. Watch it under the **Actions** tab.
4. The site appears at `https://USERNAME.github.io/REPO/` a minute or so after the first run.

Editing `data/portfolio.json` through GitHub's web interface counts as a push, so the teacher's own
updates redeploy the site without anyone touching the terminal.

Want `https://yourname.com`? Add a `CNAME` file with the domain and point a DNS `CNAME` record at
`USERNAME.github.io`. GitHub issues the HTTPS certificate.

## How the teacher updates it

**Text and structure** — open `editor.html` on the live site, edit the form, press
*Download portfolio.json*, then in GitHub go to `data/portfolio.json` → **Upload files** (or the pencil
icon and paste). The site rebuilds itself.

**PDFs** — drag them into the `docs/` folder on GitHub (**Add file → Upload files**), then add an entry
in the editor's Documents section pointing at `docs/your-file.pdf`.

**Photos** — same, into `images/`. Resize to about 1600px wide first; GitHub repos should stay under
a gigabyte and each file under 100 MB.

If editing a JSON file ever feels fragile, wire up a visual CMS instead — see *Other approaches* below.

## The presentation

- **In the browser** — open `slides.html`. `←` `→` move, `o` shows an overview grid, `f` is fullscreen,
  the `⎙ PDF` button prints landscape slides you can save as a PDF and email.
- **Google Slides** — run `tools/google-slides.gs` once from [script.google.com](https://script.google.com).
  It reads the published JSON and builds a real Google Slides deck. Instructions are in the file's header.
  A static page cannot create a Google Slides deck by itself: that needs a Google login and the Slides API,
  which is exactly what Apps Script provides for free.
- **Outline** — the `⧉ Outline` button copies a tab-indented outline. Paste it into Google Docs, PowerPoint's
  outline view, or anywhere else that takes text.

## Files

```
index.html            portfolio page
slides.html           presentation view
editor.html           form-based content editor
data/portfolio.json   ← all content lives here
docs/                 PDFs (placeholders included — replace them)
images/               photos (SVG placeholders included)
assets/css/           style.css (site) + slides.css (deck)
assets/js/            data.js (shared) + portfolio.js + slides.js
tools/google-slides.gs  Apps Script that builds a Google Slides deck
```

## Working on it locally

Browsers refuse to `fetch` a local JSON file over `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. On GitHub Pages no server is needed.

## Before publishing

- A public repository makes every file public, including the PDFs — check them for phone numbers,
  addresses and student names.
- Photographs of identifiable students need the school's and parents' consent. Cropped hands, backs of
  heads and student work without names are the usual safe substitutes.
- Everything in git history stays there. Deleting a file in a later commit does not remove it from the
  repository's past.

## Other approaches

| Instead of this | You get | You give up |
|---|---|---|
| **Pages CMS / Decap CMS** on top of these files | A real admin UI with image uploads that commits to the repo | A sign-in step and a bit of config |
| **Google Sheets as the source** (publish a sheet as CSV, fetch it here) | Editing in a familiar spreadsheet | Everything is public, and layout control is thinner |
| **Jekyll/Hugo theme** (`academicpages`, `al-folio`) | Blog, tags, citations, a maintained theme | Markdown files, a build step, someone else's structure |
| **LinkedIn / Notion / Carrd** | Nothing to maintain | No custom domain of substance, no control, no deck generation |

For one teacher who wants a stable, free, permanent home for their materials, the setup in this repo is
the right size. The step up worth taking, if editing JSON becomes a chore, is adding Pages CMS —
it keeps the same files and the same hosting.
