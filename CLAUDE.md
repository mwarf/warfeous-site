# CLAUDE.md — warfeous.com

> Drop this at the repo root of the Astro project (rename to `CLAUDE.md`). It is the build contract for warfeous.com. The design system it encodes was built and reviewed separately; treat the rules here as settled, not suggestions.

---

## What this is

**warfeous.com** is the personal editorial journal of Michael Warf — documentary filmmaker and photographer in Pincher Creek, Southern Alberta. Long-form essays, short notes, and photo essays. It is the canonical home for his writing; LinkedIn is a distribution channel, not the source of record.

It is **not** the studio site (that's coalbanks.com). It is not a marketplace, not a membership product, has no comments, no newsletter in v1.

**The brand thesis: the absence of trend signals is itself the brand.** When in doubt, remove. Set bigger type, add more whitespace, draw fewer boxes. Never reach for a gradient, a shadow, an emoji, or an animation to "liven it up."

---

## Stack

- **Astro** (latest stable), MDX integration. Astro components only — no React/Vue/Svelte unless a specific island genuinely demands it (the lightbox is the one likely candidate; see Interactions).
- **Content Collections** with zod schemas (see Content model).
- **Cloudflare Workers** via Wrangler (`pnpm run deploy`). Static output served from Workers with KV session binding.
- **Cloudflare Images** — all editorial stills, referenced by Image ID in frontmatter.
- **Cloudflare Stream** — all video, HLS, referenced by Stream UID.
- **Cloudflare Web Analytics** — cookieless, no banner. No GA4, no third-party scripts.
- `@astrojs/sitemap`, `@astrojs/rss`, `satori` + `@resvg/resvg-js` for OG generation. `pagefind` deferred to v2.
- **pnpm** for package management. No npm, no yarn.

**Zero JS by default.** Any client-side script must be justified against the performance budget below.

---

## Performance budget (hard)

- LCP < 2.0s on 4G throttling. CLS < 0.05. INP < 200ms.
- JS shipped < 30KB/page average, 100KB ceiling.
- Page weight < 500KB text pages, < 1.5MB photo essays (excl. video).
- Font payload < 260KB combined preloaded weights. (The two preloaded variable fonts, Latin-subset with the WONK axis dropped, bottom out at ~250KB; the full opsz/wght/SOFT axes are part of the design and are worth the weight. Subset with HarfBuzz, never fontTools' subsetter, and never range-limit axes — both inflate gvar.)
- On entries with video: the **poster image is the LCP element**; the Stream player loads after.

If a change blows the budget, stop and flag it rather than shipping it.

---

## Design tokens

Port `colors_and_type.css` from the design system verbatim into `src/styles/`. Do not invent values. The palette is **closed** — six roles, one accent.

### Palette — "Winter Coulee"
```
--w-frost:        #EAE6D5   /* page background — frost-on-grass, never pure white */
--w-frost-deep:   #DAD4BD   /* secondary surfaces, hover fills, caption blocks */
--w-rule:         #BFB89E   /* hairline dividers — never a fill */
--w-ink:          #1B201F   /* body text — cool charcoal */
--w-ink-soft:     #2A2F2D   /* headings */
--w-sage:         #6B7268   /* metadata, captions, tertiary chrome */
--w-slate:        #3F5D6B   /* THE accent — links, selection, marks (Oldman River silt) */
--w-slate-hover:  #2C4753   /* accent press/hover */
```
One accent. If you find yourself wanting a second colour, you want better hierarchy instead.

### Type
- **Display — Fraunces** (variable, opsz + wght + SOFT axes). Titles, masthead wordmark, pull quotes. At large sizes push `opsz` to 144, `wght` ~420, `SOFT` ~50. Tracking is tight: −0.032em to −0.038em on headlines.
- **Body — Newsreader** (variable). All running text. 17px mobile / 19px desktop, line-height **1.55**, measure capped at **66ch**. Oldstyle figures (`onum`) on by default in body.
- **Mono — iA Writer Mono S** (self-hosted, 400/700, roman + italic). Metadata, dates, captions, code. UPPERCASE + 0.06em tracking for meta labels; tabular lining figures (`tnum`, `lnum`) so dates align.

Fonts: WOFF2 only, `font-display: swap`, preload the body + display weights used above the fold. All three are self-hosted in `public/fonts/` — files exist in the design system's `fonts/` folder, copy them over. Variable fonts ship one file per family.

### The non-negotiables
- **Sharp corners.** `border-radius: 0` is the default. 4px is the absolute max, reserved for the rare form input.
- **No shadows.** None. Depth comes from hairline rules and whitespace, full stop.
- **No gradients on UI surfaces.** (The film-grain texture on hero/photo images is the only overlay.)
- **No emoji. No icon font. No unicode-as-icon.** Iconography is hairline SVG (1.25 stroke, 24×24, `currentColor`), and there are only three: RSS, arrow, external. Copy them from the design system's `assets/icons/`.
- **Selection** is oxblood→slate fill: `::selection { background: var(--w-slate); color: var(--w-frost); }`.

---

## Voice & copy rules

These apply to UI microcopy, error pages, and any string you generate — match the editorial register.

- **First person singular.** "I", not "we". Second person sparingly, never for sales.
- **Contractions are the default.** "It's", "don't", "I've", "that's". Spelling out "it is" and "do not" reads like a press release. Save the uncontracted form for genuine emphasis, and ration it to about one per essay.
- **Write like you talk.** The register is a colleague explaining something over coffee, not a keynote. Asides and rhetorical questions are welcome. Aphoristic closers ("You cannot automate trust.") are rationed, not stacked.
- **No third-person bio taglines** on entries. Never end an essay with "*Michael Warf is the founder of...*". The footer already says who I am, in first person.
- **Canadian spelling.** colour, harbour, centre, behaviour.
- **No em dashes.** Use commas, periods, or sentence breaks. Hyphens for compound modifiers only.
- **Specific over abstract.** Name the place, the gear, the date. Never "stay tuned", "excited to share", "welcome to my journal", "in today's fast-paced world".
- **Friendly is not peppy.** No exclamation marks doing enthusiasm's job, no hype vocabulary. Warmth comes from plain sentences and honest detail.
- **Sentence case** for titles and UI. UPPERCASE only for mono meta labels. Wordmark is always lowercase: `warfeous`.
- **Mid-dot `·`** is the one accepted decorative separator (used in meta strings).

---

## Information architecture

```
/                       Home — masthead, latest essay teaser, dense list, latest photo tile
/journal                Combined chronological feed (essays + notes + photo essays)
/journal/[slug]         Individual entry — type is metadata, NOT a URL prefix
/photographs            Photo essay index (chronological grid)
/photographs/[slug]     — canonical URL stays /journal/[slug]; this is a dedicated index view
/about                  Short bio, not a CV
/now                    What I'm on this month (nownownow.com convention)
/colophon               Build, fonts, tools, camera gear
/rss.xml                Full feed
/sitemap.xml            Generated
/404                    Custom — display-scale headline, brief line, mono back-link
```

All written entries AND photo essays live under `/journal/[slug]` with **no date in the URL**. Type is frontmatter, not a route. Photo essays are duplicated into `/photographs` as an index but keep their `/journal/[slug]` canonical URL.

---

## Content model

Two collections. Keep the zod schemas exactly as below (`src/content/config.ts`).

```ts
const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['essay', 'note', 'photo-essay']),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    hero: z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }).optional(),
    video: z.object({ streamId: z.string(), poster: z.string(), caption: z.string().optional() }).optional(),
    gallery: z.string().optional(),          // references a galleries slug
    draft: z.boolean().default(false),
    dropcap: z.boolean().default(true),      // set false when opening sentence is too short to wrap
    canonicalUrl: z.string().url().optional(),
    location: z.string().optional(),
  }),
});

const galleries = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.date(),
    location: z.string().optional(),
    images: z.array(z.object({
      src: z.string(), alt: z.string(), caption: z.string().optional(),
      width: z.number(), height: z.number(),
    })),
  }),
});
```

### Presentation by type
- **Essay** — full typographic treatment. Centred single column, 66–68ch measure. Generous lead paragraph (larger Newsreader, wght 380). Reading time shown. **Drop cap on first body paragraph** (opt out with `dropcap: false` when the opening sentence is too short to wrap around the cap; short fragments under ~10 words look wrong with a drop cap). Footnotes supported. Hero image/video optional. **Mid-article pull quotes** use `<blockquote class="w-pullquote">` for a centred, ruled treatment distinct from regular blockquotes.
- **Note** — short-form, denser, narrower column (~620px), less chrome, no hero unless useful. Date prominent.
- **Photo essay** — image-led. Full-bleed allowed for individual images. Captions are primary text, not decoration. Written intro optional.

### Title length
Keep titles under ~50 characters. The h1 type scale (`clamp(40px, 4.4vw + 16px, 64px)`) wraps awkwardly past ~55 chars. Prefer short, specific titles and let the excerpt do the positioning work.

---

## Components

Build these as `.astro` components. **High-fidelity visual recreations already exist** in the design system project at `ui_kits/warfeous-site/` (React/JSX). Use them as the visual + interaction source of truth — port the markup and CSS, drop the React. Component class names (`.w-mast`, `.w-row`, `.w-meta`, `.w-pe__fig`, etc.) are already styled in the kit's `styles.css`; carry them over.

| Astro component | Recreates | Notes |
|---|---|---|
| `Masthead.astro` | kit `Masthead` | Wordmark + nav + tagline. **In document flow, NOT sticky.** Nav: hairline underline animates in on hover; active link shows slate underline. |
| `Footer.astro` | kit `Footer` | Single-line bio + mono links (rss / now / colophon). Appears once, at the bottom. |
| `EntryRow.astro` | kit `EntryRow` | Journal index row. No fill/border/shadow/radius. On hover: 2px slate bar slides in on the left edge + frost-deep bg. Uniform text rows — **no inline thumbnails.** |
| `EntryMeta.astro` | kit `EntryMeta` | `ESSAY · 12 MIN · 24 MAY 2026 · PINCHER CREEK`. Mono, uppercase, sage `·` separators. Read-dot when read (see Interactions). |
| `Img.astro` | — | Wrapper around Cloudflare Images: takes an Image ID, emits responsive `<img>` with `srcset`/`sizes`. Grain overlay on hero/figure images only, ~10% opacity. |
| `StreamVideo.astro` | kit video-poster card | Poster is LCP. Tap-to-play. Autoplay ONLY when muted + in viewport + `prefers-reduced-motion: no-preference` + not `Save-Data`. Mobile: poster only by default. |
| `Gallery.astro` | kit `PhotoEssayEntry` + `Lightbox` | Image-led layout; lightbox on click (see Interactions). |
| `Footnotes` | kit footnote popover + margin notes | See Interactions. |
| `ShareRow.astro` | kit share row | Copy link, Share to LinkedIn, Reply by email. Slate mono. Tiny inline script for clipboard. |
| `PrevNext.astro` | — | Previous/next essay navigation at article bottom. Hairline rule above. |
| `MonthGroup` | kit month headers | Mono `MAY 2026` headers grouping the dense list / journal index. |

### Month-grouping helper
The home dense list and journal index group entries under mono month headers (`MAY 2026`). Port `groupEntriesByMonth` from the kit's `data.jsx`.

---

## Interactions (already designed — match them)

All motion respects `prefers-reduced-motion`. **No page transitions** (hard cuts are intentional). Hover = opacity or underline shifts only — **no translate, no scale.** Press = colour deepens, never shrinks.

1. **Footnotes** — reference is a mono superscript. On hover/focus, a slate-bordered popover (260px, frost-deep) shows the note. At **≥1280px** viewport the popover is replaced by a permanent **margin note** floated into the right gutter with a slate left rule; the bottom "Notes" section is hidden at that width. Below 1280px, footnotes collect into an end-of-article `.w-footnotes` section with `↩` back-links.

2. **Lightbox** (photo essays) — each photo is a `<button>` (cursor zoom-in). Click opens a fullscreen viewer: ink backdrop at 96%, photo centred, mono caption beneath, "Close" top-right, `NN / NN` counter top-left, ←/→ nav. Keyboard: Esc closes, ←/→ navigate. Outside-click closes. Body scroll locked while open. **This is the one component that likely justifies a client island** (Astro island or a small vanilla script) — keep it under budget.

3. **Read state** — opening an entry marks its slug in `localStorage['warfeous:read']`. Entries already read show a 5×5px sage square at the start of their `EntryMeta` in lists. With Astro's zero-JS model, do this with a tiny inline script that reads localStorage and toggles a class on `[data-slug]` rows after hydration — not a full framework.

4. **Share row** (bottom of essays) — `Copy link` (slate, hairline underline; becomes "Copied ✓" 1.8s via `navigator.clipboard`), then `Share to LinkedIn` and `Reply by email` in sage mono. The LinkedIn link is a plain share URL, **no widget/SDK.**

5. **Photographs grid hover** — **static. No hover loops in v1.** (Reserved for the v2 films index.)

---

## Accessibility (established patterns — keep them)

- Focus rings: `:focus-visible` only, 2px slate, 3px offset (4px on inline links to clear the underline). Never `outline: none` without a replacement.
- Skip-to-content link (`.w-skiplink`) — hidden off-screen, reveals on focus, first in tab order.
- `<main id="main">` as the skip target.
- Mobile nav hit targets ≥ 44px (padding + negative margin trick in the kit).
- Lightbox: keyboard-operable, scroll-locked, returns focus on close.
- Print stylesheet exists in `colors_and_type.css` — strips chrome, blacks type, keeps footnotes/figures. Carry it over.

---

## SEO & metadata

- Per-page `<title>`, meta description, canonical URL.
- Open Graph + Twitter Card on every entry.
- **OG images generated at build via Satori** — title in Fraunces over frost background, wordmark bottom-left, type/date eyebrow. An HTML template exists at the design system's `og-template.html` (1200×630, `data-og` slots for title/type/date) — use it as the Satori layout reference.
- JSON-LD: `Article` on essays/notes, `ImageGallery` on photo essays.
- RSS at `/rss.xml` — full content for essays/notes, summaries + image links for photo essays.

---

## Editorial workflow (no CMS)

1. Write entry in `src/content/journal/[slug].mdx`.
2. Upload images to Cloudflare Images, paste IDs into frontmatter. Video → Stream, paste UID.
3. `pnpm run dev` to preview. `git commit`, push branch.
4. `pnpm run deploy` to build and deploy to Cloudflare Workers via Wrangler.

Markdown in, site out. Do not add an admin UI.

---

## Decisions (settled)

1. **Tagline** under the masthead: **"Notes from Southern Alberta."** Specific over abstract, place-rooted, not a job-title bio line. Use this verbatim.
2. **OG template**: **title + wordmark + date.** Title in Fraunces over frost, wordmark bottom-left as detached-link attribution, type/date eyebrow top. (`og-template.html` already reflects this.)
3. **Repo visibility**: **public.** The writing is the product, there's nothing secret, and it suits the build-in-public posture. No private repo.

---

## Working agreement for the coding agent

- When a visual question arises, **check `ui_kits/warfeous-site/` first** — it's the reviewed source of truth. Don't redesign.
- Prefer removing over adding. Ask before introducing any new section, page, colour, or dependency.
- Keep components small and well-factored. One concern each.
- Every client script is a line-item against the JS budget. Default to zero.
- If you can't do something without breaking a rule here, stop and surface the tradeoff.
