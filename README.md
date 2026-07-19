# warfeous.com

The personal editorial journal of Michael Warf. Essays, notes, and photo essays from Southern Alberta. Astro, Cloudflare Workers, git-based CMS. Markdown in, site out.

This README is the operator's manual: how to publish, deploy, and maintain the site. The design and build contract lives in [CLAUDE.md](CLAUDE.md); when the two disagree, CLAUDE.md wins.

---

## One-time setup

Requirements: Node 22.12+, [pnpm](https://pnpm.io), and a Cloudflare account with access to the `warfeous-site` Worker.

```sh
pnpm install          # dependencies
pnpm wrangler login   # authenticate wrangler with Cloudflare (once per machine)
```

Environment variables go in a `.env` file at the repo root (gitignored; see [.env.example](.env.example)):

```
PUBLIC_CF_IMAGES_HASH=<account hash>    # build: turns Image IDs into imagedelivery.net URLs
CLOUDFLARE_ACCOUNT_ID=<account id>      # cf-upload script only
CLOUDFLARE_IMAGES_TOKEN=<api token>     # cf-upload script only, Cloudflare Images:Edit
```

Without `PUBLIC_CF_IMAGES_HASH`, image `src` values that look like paths (`/images/foo.jpg`) pass through unchanged and Image IDs fall back to raw strings. The other two are secrets used only by the upload script; never expose them to the site.

Two more one-time steps live outside the repo:

- **GitHub Actions secrets** for auto-deploy (see Deploying): `CLOUDFLARE_API_TOKEN` (a token with Workers Scripts:Edit) and `CLOUDFLARE_ACCOUNT_ID` under Settings → Secrets, plus `PUBLIC_CF_IMAGES_HASH` as a repository variable.
- **CMS login**: open `https://warfeous.com/admin`, choose "Sign In with Token", and paste a fine-grained GitHub personal access token with `contents: write` on `mwarf/warfeous-site`. It lives in the browser's localStorage.

---

## Publishing an entry

By hand, or in the CMS at `/admin` (Sveltia CMS; [public/admin/config.yml](public/admin/config.yml) mirrors the schema in [src/content.config.ts](src/content.config.ts) and commits straight to `main`).

1. Create `src/content/journal/<slug>.mdx`. The filename is the URL: `/journal/<slug>`.
2. Write frontmatter, then the body in Markdown.
3. Preview with `pnpm dev` (http://localhost:4321).
4. Commit and push — the GitHub Action deploys (see Deploying). `pnpm run deploy` skips the wait.

One CMS caveat: the rich text body editor is fine for plain Markdown, but entries with footnotes (`[^1]`) or pull quotes (`<blockquote class="w-pullquote">`) are safer finished by hand — WYSIWYG editors can mangle raw HTML and footnote syntax on save.

### Frontmatter reference

```yaml
---
title: "Wednesday nights in the darkroom"   # keep under ~50 characters
type: essay                                 # essay | note | photo-essay
publishedAt: 2026-06-01                     # YYYY-MM-DD
excerpt: "One or two sentences. Shown in lists, feeds, and as the lead paragraph."
location: Lethbridge                        # optional, shown in the meta line
tags: [photography, craft]                  # optional
draft: false                                # true keeps it off the site entirely
dropcap: true                               # essays only; see below
hero:                                       # optional, essays only
  src: <cloudflare image id or /path>
  alt: "Required alt text"
  caption: "Optional caption"
gallery: <gallery-slug>                     # photo essays: references a galleries file
updatedAt: 2026-06-04                       # optional, feeds JSON-LD dateModified
canonicalUrl: https://example.com/original  # optional, only when cross-posting
---
```

Rules worth remembering:

- **Titles under ~50 characters.** The display scale wraps badly past ~55.
- **`dropcap: false`** when the opening sentence is under ~10 words; a drop cap needs a sentence long enough to wrap around it.
- **Dates are plain `YYYY-MM-DD`** and format in UTC. Do not add times or timezones; they will shift the displayed date.
- **Voice:** first person, Canadian spelling, no em dashes, sentence case. The full rules are in CLAUDE.md.
- Footnotes use standard syntax: `text[^1]` in the body, `[^1]: the note` at the end.
- Pull quotes: `<blockquote class="w-pullquote">One line that earns the ceremony.</blockquote>`.

### Entry types

| Type | Column | Treatment |
|---|---|---|
| `essay` | 760px | Drop cap, reading time, lead paragraph, optional hero |
| `note` | 620px | Smaller headline, denser, date prominent, no hero |
| `photo-essay` | 1080px | Image-led, gallery with lightbox, captions are primary text |

### Photo essays

A photo essay is an entry with `type: photo-essay` plus a gallery file at `src/content/galleries/<slug>.json`:

```json
{
  "slug": "columbia-icefields",
  "title": "A line on the toe",
  "date": "2026-05-09",
  "location": "Columbia Icefields",
  "images": [
    {
      "src": "<cloudflare image id>",
      "alt": "First light on the toe of the Athabasca Glacier",
      "caption": "06:14, first light on the toe of the glacier",
      "width": 1600,
      "height": 1067
    }
  ]
}
```

Reference it from the entry with `gallery: columbia-icefields`. The first image becomes the tile on the home page and `/photographs`. `width`/`height` are required; they prevent layout shift.

### Images

1. Run `pnpm cf-upload <file> [file...]`. It uploads each still to **Cloudflare Images** and prints ready-to-paste gallery rows — Image ID plus real pixel dimensions. (Needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_IMAGES_TOKEN` in `.env`; see setup.)
2. Paste the rows into the gallery JSON `images` list (or just the `src` value into `hero.src`), then fill in `alt` and `caption`.
3. Make sure `PUBLIC_CF_IMAGES_HASH` is set in `.env` (see setup), then build.

`Img.astro` turns an ID into responsive `imagedelivery.net` URLs with `srcset`. Anything starting with `/` or `http` passes through untouched. Video goes to Cloudflare Stream and the UID into `video.streamId` (the player component is not built yet; poster-first playback is specced in CLAUDE.md).

### The /now page

Edit the `log` array at the top of [src/pages/now.astro](src/pages/now.astro) and the `updated` date in the eyebrow line. Newest item first.

---

## Deploying

Deploys are automatic: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs `astro build && wrangler deploy` on every push to `main` — including commits from the CMS. It needs two repository secrets (`CLOUDFLARE_API_TOKEN` with Workers Scripts:Edit, and `CLOUDFLARE_ACCOUNT_ID`) and one repository variable (`PUBLIC_CF_IMAGES_HASH`).

Manual deploys still work:

```sh
pnpm run deploy
```

Either way, the build writes static files to `dist/`, and wrangler uploads them as an assets-only Worker (config in [wrangler.jsonc](wrangler.jsonc)). Only changed files upload, so deploys take seconds.

After a deploy, spot-check:

- the home page renders and the new entry appears;
- the entry page itself: `/journal/<slug>`;
- `/rss.xml` includes the entry;
- the OG image exists: `/og/<slug>.png`.

Currently live at **https://warfeous.com**. The Vercel site is retired; DNS is fully on Cloudflare. `warfeous.com`, `michaelwarf.com`, and both `www` subdomains resolve to the site — all four are custom domains on the Worker (see [wrangler.jsonc](wrangler.jsonc)). Canonical URLs everywhere point at the `warfeous.com` apex.

### Local preview of the production build

```sh
pnpm preview      # serves dist/ with Astro's preview server
pnpm cf-preview   # serves dist/ through wrangler, closest to production
```

---

## Maintenance

### Updating dependencies

```sh
pnpm up --latest
pnpm build && pnpm preview   # verify before deploying
```

Two constraints to keep in mind:

- **Do not re-add `@astrojs/cloudflare`.** The site is fully static and the adapter's workerd-based prerenderer cannot run the native modules (satori/resvg) that generate OG images at build time. Deploys are plain wrangler asset uploads.
- `@resvg/resvg-js` must stay in `vite.ssr.external` in [astro.config.mjs](astro.config.mjs); it is a native module the bundler cannot process.

### Fonts

The served fonts in `public/fonts/` are Latin subsets of the upstream variable fonts (Fraunces with the unused WONK axis pinned away). Budget: the two preloaded fonts stay under 260KB combined (see CLAUDE.md).

To re-subset (new upstream release, or expanding the character set):

1. Put the full upstream `.woff2` files in `fonts-source/` (gitignored). The originals are recoverable from git history (`git show 501540c~1:public/fonts/<name> > fonts-source/<name>`) or fresh from Google Fonts (Fraunces, Newsreader) and iA (Writer Mono S).
2. Run:

   ```sh
   uv run --with uharfbuzz --with fonttools --with brotli python3 scripts/subset-fonts.py
   ```

3. `pnpm build`, check sizes, deploy.

The script header documents the two traps: fontTools' subsetter inflates variable-font files, and range-limiting axes makes files bigger, not smaller. Pin axes or leave them whole.

### OG images

`/og/<slug>.png` cards (1200×630) generate automatically at build time from [src/pages/og/[slug].png.ts](src/pages/og/[slug].png.ts) using the static font instances in `src/assets/og/`. Nothing to do per entry. If the display face ever changes, regenerate those TTFs from the subset fonts (pin Fraunces at `opsz 144, wght 420, SOFT 50` with fontTools' instancer).

### Performance budgets

From CLAUDE.md, the hard lines: LCP under 2s on 4G, zero bundled JS by default, text pages under 500KB, photo essays under 1.5MB. Quick check after significant changes:

```sh
pnpm build && du -sh dist && find dist/_astro -name '*.js' -exec ls -la {} \;
```

The JS find should come back empty; the only scripts on the site are three small inline ones (read state, share row, lightbox).

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Deploy fails: "deploy configuration at .wrangler/deploy/config.json" | Stale state from the removed Cloudflare adapter. `rm -rf .wrangler/deploy` and redeploy. |
| Deploy fails: "Cannot use assets with a binding" | An `assets.binding` key crept back into wrangler.jsonc. Assets-only Workers declare only `directory` and `html_handling`. |
| A date displays one day early | Something is formatting with local-time getters. All date formatting must go through `formatDate`/`groupEntriesByMonth` in [src/lib/utils.ts](src/lib/utils.ts), which use UTC. |
| Build fails on `.node` file / "Unexpected character" | `@resvg/resvg-js` is being bundled. Restore it in `vite.ssr.external` and keep the `createRequire` import in the OG endpoint. |
| Fonts 404 after touching them | Filenames in `public/fonts/` must match both the `@font-face` rules in [src/styles/colors_and_type.css](src/styles/colors_and_type.css) and the two preload links in [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro). |
| Entry missing from the site | `draft: true`, or the file isn't `.mdx`/`.md`, or frontmatter fails the schema in [src/content.config.ts](src/content.config.ts). The build error names the field. |
| CMS login fails or saves are rejected | The fine-grained PAT needs `contents: write` with repository access set to `mwarf/warfeous-site`. Mint a new one from the link on the CMS login screen. |
| CMS saved but the site didn't change | Check GitHub → Actions for a red run; the build error names the failing field. The CMS config mirrors [src/content.config.ts](src/content.config.ts), so a mismatch means one of them drifted. |
| Deploy fails only in the Action | Missing or wrong repository secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. |

---

## Where things live

```
src/content/journal/       entries (.mdx), one file per URL
src/content/galleries/     photo essay image lists (.json)
src/content.config.ts      frontmatter schemas (zod)
src/pages/                 routes; [slug].astro renders entries, og/ makes cards
src/components/            Masthead, EntryRow, Gallery, Img, ShareRow, ...
src/layouts/BaseLayout.astro   <head>, metadata, font preloads, read-state script
src/lib/                   date/formatting utils, Cloudflare Images URL helpers
src/styles/                colors_and_type.css (design tokens) + kit.css (components)
src/assets/og/             static font instances for OG card generation
public/admin/              Sveltia CMS (index.html + config.yml), served at /admin
public/fonts/              subset woff2 files actually served
scripts/subset-fonts.py    font re-subsetting procedure
scripts/cf-upload.mjs      upload stills to Cloudflare Images, print gallery rows
.github/workflows/deploy.yml   auto-deploy on push to main
wrangler.jsonc             Workers deploy config (assets-only)
CLAUDE.md                  design system + build contract
```
