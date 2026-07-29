---
name: publish
description: Publish and deploy content changes to warfeous.com — new journal entries (essays, notes, photo essays), edits to existing entries, /now page updates, gallery images, or any copy change that needs to go live. Use whenever the user wants to write, post, publish, update, fix, or deploy site content, including "fix the typo in X", "add this to /now", "new note about Y", "draft an essay on Z", or "get this live", even if they never say the word "publish".
---

# Publishing to warfeous.com

The pipeline is: make the change, validate it, build, commit, push. A GitHub Action deploys every push to `main`, so pushing IS deploying. Treat the two as one decision, and confirm with the user before pushing anything they haven't seen.

## Before touching anything

```bash
git pull --rebase
```

The Sveltia CMS at /admin commits straight to `main` from the browser, so the remote may be ahead of the local clone even when nobody touched this machine. Pulling first avoids a rejected push at the end.

## Making the change

**New entry** — create `src/content/journal/<slug>.mdx`. The filename is the URL (`/journal/<slug>`), so pick a short, stable, lowercase-hyphenated slug. Frontmatter template:

```yaml
---
title: "Under ~50 characters, sentence case"
type: essay            # essay | note | photo-essay
publishedAt: 2026-07-29  # today, YYYY-MM-DD, nothing else (formats in UTC)
excerpt: "One or two sentences. Lists, feeds, and the lead paragraph all use it."
location: Lethbridge   # optional
tags: [tag-one, tag-two]
dropcap: false         # essays only; false when the opening sentence is under ~10 words
draft: true            # start true; flip to false only when the user says it ships
---
```

**Edit to an existing entry** — make the edit, then consider setting `updatedAt` if the change is substantive (it feeds JSON-LD `dateModified`). Typo fixes don't need it.

**/now update** — edit the `log` array in `src/pages/now.astro` (newest first) and the `updated` date in the eyebrow line.

**Photo essay** — entry with `type: photo-essay` plus a gallery file at `src/content/galleries/<slug>.json` referenced by `gallery: <slug>`. For images: `pnpm cf-upload <files...>` uploads to Cloudflare Images and prints ready-to-paste gallery rows with real dimensions; the model fills in `alt` (required, descriptive) and `caption` (the primary text of a photo essay, not decoration). `width`/`height` are required.

## Voice

The full rules live in CLAUDE.md's "Voice & copy rules"; read them before writing prose from scratch. The ones that get violated most:

- Contractions are the default. "It is" reads like a press release; ration the uncontracted form to about one deliberate emphasis per essay.
- No em dashes, anywhere. Commas, periods, or sentence breaks.
- First person, Canadian spelling, sentence-case titles, no exclamation marks doing enthusiasm's job.
- Never end an entry with a third-person bio ("Michael Warf is..."). The footer handles identity.

## Validating

Run the mechanical checks, then the real build (which enforces the zod schema):

```bash
node .claude/skills/publish/scripts/check-entry.mjs src/content/journal/<slug>.mdx
pnpm build
```

The checker catches the rules the schema can't see: em dashes, title length, bio taglines, malformed dates, dropcap-vs-opening-length mismatches, missing gallery files. Fix failures; use judgment on warnings and tell the user about any you're leaving in place.

If the change is visual (new entry type treatment, gallery layout), preview it: `pnpm dev` serves http://localhost:4321.

## Shipping

Show the user what's about to go live (for prose, the rendered gist; for fixes, the diff) and get a clear go-ahead. `draft: true` entries can ship any time since they don't render; flipping `draft` to false is the publish decision.

```bash
git add <files>
git commit -m "<what changed, imperative, one line>"
git push
```

The Action takes about a minute. `pnpm run deploy` does the same build+deploy immediately from this machine; use it when the user wants to skip the wait or the Action is unavailable.

## Verifying live

Never declare it shipped without checking. For a new or edited entry:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://warfeous.com/journal/<slug>   # 200
curl -s https://warfeous.com/rss.xml | grep -c '<slug>'                        # in the feed
curl -s -o /dev/null -w '%{http_code}\n' https://warfeous.com/og/<slug>.png    # OG card exists
```

For /now or page copy, curl the page and grep for the new text. If the Action deployed, allow ~90 seconds after push before checking; `gh run watch` shows progress. A 404 right after deploy usually means the Action hasn't finished, not that something broke.

## Things that bite

- **Dates shift silently.** `publishedAt: 2026-07-29` is correct; adding a time or timezone makes the site display the previous day in Mountain Time.
- **The CMS races you.** If the push is rejected, `git pull --rebase` and push again; the CMS committed something in the meantime.
- **Don't invent frontmatter fields.** The schema in `src/content.config.ts` is closed; the build fails on unknown or malformed fields and names the culprit.
- **Titles just over the limit look fine in the editor** and wrap badly at the 64px display scale. Trust the checker.
