# Changelog

All notable changes to Project Copperhead (ICJIA Research Hub 2.0 public frontend) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.20.0] - 2026-07-16

Design-parity quick wins from the Figma audit (`docs/figma-design-audit.md`), which compared every
"READY - hub design" frame against the live build.

### Added

- Project detail pages: a **"Major Projects in R&A" mini-nav** rail card listing all projects with
  the current one highlighted (`aria-current="page"`), matching Figma 646:2156
- `/projects` cards now show their ✓ focus-area bullets (the homepage cards already did)
- `/centers` cards: descriptions clamp to six lines with an accessible **Read More / Show Less**
  toggle (`aria-expanded`/`aria-controls`), giving the design's uniform card heights without
  hiding content — centers have no detail pages, so in-place expansion stands in for the mock's
  "View" navigation
- `docs/figma-design-audit.md` — full design-parity audit with Figma node map, gap
  classification (code / content / launch decisions / deliberate deviations), and same-day
  corrections after code review

### Fixed

- Homepage project cards are now actual links (stretched title link + focus ring + the design's
  outlined **Learn More** affordance) — the section's intro copy said "Click the tiles" but the
  tiles weren't clickable, unlike their `/projects` counterparts

### Noted

- The design's "All Centers" articles filter is CMS-blocked: Strapi 5 articles carry no center
  relation (verified via API), and center attribution exists only as corporate author names,
  which the existing Authors filter already covers

## [0.19.4] - 2026-07-11

### Changed

- Header badge now reads **"Copperhead build"** instead of "Preview build"

## [0.19.3] - 2026-07-11

### Changed

- The footnote pop-up now titles itself **"Reference N"** instead of "Footnote N"
- Rewrite plan (`docs/ICJIA-Hub-20-rewrite-copperhead.md` + `.docx`) refreshed with the July 11 reader-experience refinements: table restyling, in-place Load More, smooth TOC, the reference pop-up, the site-wide footnote fix (43 of 52 repaired in the pipeline, 9-article CMS correction package), and the performance-gate catch; docx rebuilt field-free with all 19 anchors verified

## [0.19.2] - 2026-07-11

One more footnote content shape fixed in the pipeline, and a paste-ready fix document for the truly corrupted articles.

### Fixed

- Whitespace-only lines (the CMS uses tab-only "blank" lines) before footnote definitions are now treated as blank by the normalizer — marked saw them as paragraph continuations, which swallowed the definitions that followed. Fixes the R3 grant-program article (all 7 footnotes render); the residual leak set drops to 9 articles

### Added

- `docs/footnote-content-fixes.md` — exact find/replace instructions for the 9 articles whose footnote markers are corrupted in the CMS source itself (verified identical in the legacy Hub 1.0 CMS, so these predate the migration): three mangled numbers (a year, a p-value), two stray empty definition tokens, one mislabeled definition, one glued/duplicated definition pair, one off-by-one renumbering (12 definitions), and two genuinely lost citations to recover from the original PDF

## [0.19.1] - 2026-07-11

Recovered the articles-listing performance budget that 0.18.3's image fix spent (CI caught the listing at 0.64 vs the 0.65 floor).

### Fixed

- Article cards are optimized again where optimization exists: the build-rendered first page keeps NuxtImg's same-origin `/_ipx/` webp (those variants are emitted at build, restoring the listing's LCP path), while client-revealed cards — Load More pages and older articles surfaced by filters — use the direct CMS image, keyed by membership in the build-rendered set so no card can ever request a missing variant. Verified: page 1 = 42/42 `_ipx`, after Load More = +42 direct CMS, filtered 2018 view all direct CMS, zero broken images in every case

## [0.19.0] - 2026-07-11

Footnotes: a site-wide rendering fix and a new in-place reading experience.

### Fixed

- **Footnotes were broken on 52 articles**: CMS footnote definitions are often hand-wrapped (a citation spilling onto flush-left continuation lines) or indented 1–3 spaces — after one such definition, marked-footnote stopped recognizing every later `[^n]:` line, so the reported article rendered only 5 of its 59 footnotes and leaked the rest as literal `[^6]` text. The pipeline now normalizes definitions before parsing (dedent to column 0, blank-line-separate, join continuation lines; fence-aware and unit-tested). 42 of the 52 affected articles now render all footnotes; the remaining 10 have genuinely corrupted markers in the CMS source (e.g. `[^2018]:` fused mid-sentence into a date) — a content-team item, listed in the commit

### Added

- **Footnote toast**: clicking a footnote reference now pops a Nuxt UI toast with the citation instead of jumping to the bottom of the page — the reader stays exactly where they are. Links inside the footnote surface as action buttons (opening in a new tab with `noopener`); the toast persists long enough to read (2 minutes, no progress bar), is replaced when another reference is clicked, and is dismissible via its Close button. The full footnotes list still renders at the end of the article for print, no-JS, and linear screen-reader reading. Verified WCAG 2.1 AA contrast in both color schemes (light ≥8:1, dark ≥6.7:1 on every toast element); toast icons pinned into the client bundle (CSP)

## [0.18.3] - 2026-07-11

Two client-side-rendering bugs surfaced by the now-working in-place Load More.

### Fixed

- **Thumbnails on Load More pages 404ed**: `ipxStatic` only emits optimized image variants for markup rendered at build time — the first 42 cards. Cards revealed client-side requested `/_ipx/` URLs that don't exist in the static output. Article cards now use a plain `<img>` pointing directly at the CMS (already permitted by the `img-src` CSP, and already preferring Strapi's ~500px `small` format); the always-prerendered detail hero and dataset/app cards keep ipx optimization. Verified: 84 cards, zero broken images, zero `_ipx` requests
- **The loading spinner icon was CSP-blocked**: `lucide:loader-circle` (Nuxt UI's button spinner) only renders in the dynamic loading state, which the build-time icon scan can't see, so the client fell back to the iconify API — blocked by `connect-src`. The icon is now pinned into the client bundle alongside sun/moon; zero iconify network requests after load

## [0.18.2] - 2026-07-11

Load More jump made impossible rather than merely unlikely, after it persisted in one environment through 0.18.1's passive pinning.

### Fixed

- Load More now **actively holds the viewport**: a scroll listener snaps the position back for the entire load window, and for a 2-second grace period afterwards any sudden move toward the top (>1500px) is reverted — normal user scrolling passes through untouched. Whatever the source of a jump (browser quirk, extension, focus side effect, anchoring), it cannot win. Verified by injecting hostile `scrollTo(0, 0)` calls during and after the load: both snapped back within 1ms
- The click is also `preventDefault`ed/stopped and the button is explicitly `type="button"`, ruling out any default-action navigation

## [0.18.1] - 2026-07-11

Hardened the in-place Load More after a report that it can still jump to the top in some environments.

### Fixed

- Load More now pins the scroll position through layout **and the next two paint frames** (a single restore can lose to late scroll-anchoring adjustments in some browser/zoom combinations), and the results lists opt out of native scroll anchoring (`overflow-anchor: none`) so the browser can't fight the pin
- The button reads **"Loading more articles…"** with the spinner while the next page renders, instead of only swapping in a spinner icon

## [0.18.0] - 2026-07-11

Interaction polish on the articles experience: in-place Load More and smooth-scrolling table of contents.

### Changed

- **Load More Articles now appends in place**: the button shows a spinner while the next 42 cards render, scroll position is explicitly pinned (some browsers' scroll anchoring can jump on large list appends), and the new count is announced to screen readers ("Showing 84 of 236 articles"). When the last page lands and the button disappears, keyboard focus moves to the first newly revealed card instead of dropping to the document body
- **Article table of contents links smooth-scroll** to their section (instant for users who prefer reduced motion), landing with the heading clear of the sticky chrome via its scroll-margin. The URL hash still updates for shareable deep links — without a router navigation, which previously double-scrolled via popstate — and focus moves to the target heading for keyboard and screen-reader users

## [0.17.0] - 2026-07-11

Table presentation pass: zebra striping and full-container-width tables across articles and datasets.

### Added

- **Zebra-striped tables** everywhere tabular content renders: CMS markdown tables in article/dataset bodies (token-driven `nth-child` striping that adapts to both color schemes) and the dataset variables table (`even:bg-elevated`), with header rows on the accented background token

### Changed

- **Markdown tables now span the full container width** regardless of column count — small two-column tables no longer shrink to content width. The markdown pipeline wraps every table in a `.table-wrap` scroll container (unit-tested), so wide tables scroll internally instead of overflowing the page, preserving the WCAG 1.4.10 reflow guarantee at 320px; tables are explicitly left-aligned

### Fixed

- Dataset variables table: the Type column's muted text fell below 4.5:1 AA contrast on the new striped rows (12 nodes flagged by axe); switched to the toned text token — the full 30-check axe suite passes again
- Search result excerpts containing long unbreakable tokens (file names, URLs) could overflow the viewport at 320px (surfaced by the regenerated search index during the walkthrough); excerpts now break anywhere (`overflow-wrap: anywhere`)

## [0.16.0] - 2026-07-11

Security review of the CSP + a body-image bug it surfaced; credential rotation; first-draft docs refreshed.

### Fixed

- **151 article pages had broken inline images**: CMS markdown embeds media as relative `/uploads/…` paths, which resolved against this site's origin (404s). The sanitization boundary now absolutizes `src`/`href` uploads paths against the CMS origin (unit-tested); all 151 pages verified fixed in the generated output

### Security

- CSP hardened: `object-src 'none'`, `frame-src 'none'` added; `Strict-Transport-Security` header added; policy re-verified live with zero violations across templates including document search
- **CMS credential rotated**: the exposed full-access token replaced by a read-only token (verified: authenticates 200, write attempts 403); stored in Netlify as a **masked secret** for production/preview contexts only (the previous copy was plaintext-readable via API); local `.env` updated by the operator. Old token deletion in Strapi pending operator action

### Changed

- Rewrite plan + README refreshed: first-draft status now records the executed-and-clean accessibility walkthrough, the design-fidelity passes, the link-integrity sweep, and the security hardening

## [0.15.0] - 2026-07-11

Fidelity pass 2 against the Figma frames + link-integrity sweep of the site chrome.

### Added

- Agency-bar search control (square navy button, far right) per the frames; the section-nav search icon removed to match
- "Filter by:" labels on the articles/datasets/apps filter rows; sort controls on the datasets and apps listings (consistency with the Datahub frame)

### Fixed

- **Every header/footer link verified against the main site's live sitemap** — several pointed at paths that don't exist (`/about/`, `/research/`, `/press/`, `/funding/`, `/contact/`, `/employment/`, `/grant-status-request/`, `/privacy/`, `/accessibility/`, `/about/staff/`). Real targets now: `/about/about-the-authority/`, `/grants/funding/`, `/about/contact/`, `/about/employment/`, `/about/privacy/`, `/about/policies/`, `/about/icjia-staff/`, `/about/publications/`, `/news/`, `/events/`
- Design elements with **no existing page on the main site** are deliberately omitted rather than shipped as dead links, and documented: "Partners" nav item (main-site dropdown, no landing page), "Grant Status Request", "Terms of Use", the "Language Access Request | Translate Site" utility bar (main-site chrome, needs main-site coordination)

## [0.14.0] - 2026-07-11

Design polish pass against the shared Figma frames.

### Added

- `PageHero` — the design's navy hero band on section landings, live on `/centers` and `/projects` (title + intro from their CMS `pages` entries; the projects entry retitled to "Projects" in Strapi to match the frame)
- Centers cards per the frame: branded navy image panel with the center name overlaid, director line, description (the CMS center type has no media field yet — a real-image upgrade is a content-model decision, noted in-file)
- Project tiles: icon chip + white-outline "Learn More" affordance per the frame (visual only; the stretched link keeps the accessible name)
- Icon-chip section headings ("Centers in Research & Analysis", "Major Projects in R&A") on both landings
- Articles listing sort control (`?sort=` Most Recent / Oldest / Title A–Z), URL-synced like every other filter

### Notes

- Remaining design deltas deliberately deferred: "See Archives" button (needs a target decision), working newsletter email form (needs a subscription backend — Phase 4 decision), homepage photo hero (awaits the hub-home CMS entry's image), carousel arrows on the projects band (grid chosen for accessibility), data-page center/author filters (5 datasets / 13 apps don't warrant them yet)

## [0.13.0] - 2026-07-11

Accessibility walkthrough (executed + clean) and live-deploy fixes.

### Added

- **Manual accessibility walkthrough executed** via a repeatable driven-browser script (`scripts/a11y-walkthrough.mjs`): 9 templates × 2 color schemes — keyboard walks with visible-focus assertions and trap detection, landmark/heading structure, 320px reflow with offender attribution, live regions, accordion operability. Findings memo: `docs/a11y-walkthrough-2026-07-11.md`. Final state: **clean**
- Global `prefers-reduced-motion` guard

### Fixed

- **320px reflow (WCAG 1.4.10)** failures found by the walkthrough: header section-nav now wraps/scrolls; detail-page grids gained a base `grid-cols-1` template (wide tables could force the implicit column past the viewport); CMS markdown tables scroll within their own box; the app "Launch" button label no longer overflows (full title moved to `aria-label`)
- **Live deploy: card images 400** — on Netlify, `@nuxt/image` auto-switched to Netlify's runtime Image CDN (unauthorized remote domain); provider pinned to `ipxStatic` so the deployed artifact is byte-identical to the tested one
- **Live deploy: CSP violation from `api.iconify.design`** — icon CDN fallback disabled (`fallbackToApi: false`); the color-mode toggle's dynamically-bound sun/moon icons pinned into the client bundle
- Article/app hero images now served as same-origin optimized assets with high fetch priority — removes live-CMS latency from the LCP path (article detail: deterministic 0.96, was swinging to 0.84 on slow CMS responses)
- Verified in a fresh profile: **light mode is the default** for new visitors; dark is a persisted per-user toggle choice; zero external requests on page load

## [0.12.0] - 2026-07-11

Phase 5 — hardening: template performance budgets, security headers, keyboard tests, dependency posture, and the operations runbook.

### Added

- Lighthouse budgets now cover the five key templates (home, listing, article, dataset, search) with an assertion matrix; scores 0.91–0.96 everywhere except the listing (0.84, floor 0.80 — the 42-card image grid under Lighthouse's lazy-image simulation; tracked for a pagination follow-up)
- Build-time image optimization (`@nuxt/image`): card images are now same-origin optimized webp `/_ipx` assets (~half the bytes, no cross-origin setup on the LCP path); preconnect to the CMS origin for the remaining full-size media
- Security headers (`netlify.toml`): CSP (self + Plausible + `wasm-unsafe-eval` for Pagefind; no other external script origins), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Keyboard accessibility tests (skip-link first-in-tab-order → `#main-content`; section nav reachable and operable) — a11y suite now 30 checks
- `docs/runbook.md` — operations manual: content ops (the Studio publish → Netlify **build hook**, created), build commands, the launch-day checklist (robots flip, `PARITY_STRICT`, SEO budget restore, proxy flip, rollback), manual accessibility pass procedure, secrets rotation list, dependency posture
- `dependabot.yml` (weekly grouped minor/patch; actions monthly)

### Fixed

- **Hydration crash on the articles listing** (`TypeError … 'dispose'` from a reactive second `useHead`) — it silently stripped the meta description at runtime and cost ~0.10 of performance score; removing the ineffective LCP-preload eliminated it (listing 0.74 → 0.84)
- Card images ship explicit dimensions; first-row images load eagerly with `fetchpriority=high`; listing payload slimmed (author names only, clamped abstracts, no unused tags)
- Heading order on listing pages (cards' h3 under an sr-only h2)

### Security

- Production dependency audit: 1 low advisory. Dev-chain advisories (lhci, `file-type` via pdf-search-index, esbuild) have no runtime exposure — the static site ships no dependencies; Dependabot now PRs weekly. Upstream note: `@icjia/pdf-search-index` should bump `file-type`

## [0.11.0] - 2026-07-11

Phase 4 — SEO, URL-parity infrastructure, and analytics.

### Added

- `sitemap.xml` emitted from the generated output every build (269 URLs; attachment stubs and infrastructure excluded); referenced by `llms.txt`
- **URL-parity checker** (`pnpm parity`) — the launch gate: verifies every URL in the archived Hub 1.0 snapshot (`docs/parity/hub-sitemap-2026-07-11.txt`, 266 URLs) against the generated output + redirect map. Runs in CI in advisory mode; `PARITY_STRICT=1` (launch day) makes misses fatal. Current: **246/266 resolve**; all 20 misses accounted for (17 post-migration articles → cutover sync; 3 pages → authoring)
- Redirect map (`public/_redirects`, kept at publish root): four legacy article slugs that circulate in citations 301 to their current articles (fuzzy-matched and verified)
- **Plausible analytics** wired (`plausible.icjia.cloud`, domain `icjia.illinois.gov`) via a conditional loader that activates only when served from the production hostname — preview/branch deploys and local dev never pollute the KPI record
- `llms.txt`; `WebSite` JSON-LD on the home page; canonical URLs on all listing/search pages

## [0.10.0] - 2026-07-11

Phase 3 complete — site search that reaches inside published documents.

### Added

- `/search` — site-wide search over every rendered page **plus the contents of published PDF/Office files**. Document text is extracted at build time (`scripts/build-doc-stubs.mjs`, powered by `@icjia/pdf-search-index`) into lightweight noindex stub pages that join the Pagefind index, so document matches download on demand from Pagefind's chunked index instead of shipping a multi-megabyte JSON to browsers. Extraction is cached in `node_modules/.cache` (persists across Netlify builds); failures are named, never silent
- Grouped results: file hits carry parent metadata and nest under their parent article/dataset ("Match inside PDF document"), with orphan document hits linking to their parent; stale-response guard on queries
- Pagefind engine loads via `import(/* @vite-ignore */ …)` — no `unsafe-eval` (the predecessor needed a `new Function` hack); search shell prerendered, `?q` URL-synced, header search button
- `pnpm generate` now builds the Pagefind index (CI audits a working search page); `pnpm generate:full` (Netlify) adds document extraction; `DOC_LIMIT=n` for local smoke tests
- Rewrite plan document: "Progress update — July 11, 2026" section (phases 0–3 status, decisions, content-side needs); docx rebuilt (19 TOC anchors verified, zero Word fields)

## [0.9.0] - 2026-07-11

CMS consolidation (one type per concept) and Phase 3 milestone 1 — the stakeholder-priority filter experience.

### Added

- **Phase 3 filters on `/articles`** — the three Hub 2.0 stakeholder concerns, solved: one-click publication-type chips ("Show All" + the four most common types, humanized labels), an author filter (with author names now shown on every card), and search-term **highlighting** in titles and abstracts (pure text-segment rendering — no `v-html`; `segmentText` unit-tested)
- Topic filter; every filter URL-synced (`?q`, `?type`, `?topic`, `?author`, `?year`, `?view`) — shareable, back/forward-safe, with a Clear button
- `usePageCopy(slug, fallback)` — one mechanism for author-editable landing copy on any route
- `formatTypeLabel` — humanizes CMS type values ("ProgramEvaluationSummary" → "Program Evaluation Summary")

### Changed

- **CMS consolidation (ADR-0003):** landing copy for `/centers` and `/projects` now lives in `pages` entries (slugs `centers`, `projects` — created and published in Strapi with the copy migrated from the singleton `centerhomes`/`projecthomes` collections; the mistakenly centers-flavored `projecthomes.subtitle` copy was not migrated). Both pages read the entries at build time with baked-in fallbacks. The `*home` content types are now unused; **deletion scheduled after 2026-07-31** per `docs/cms-consolidation.md`
- Article summaries carry authors (`authors` is a JSON scalar field from the migration — selected via `fields[]`; Strapi rejects it as a populate key)

## [0.8.0] - 2026-07-11

Phase 2, milestone 4 — the remaining URL-contract routes, Hub 1.0 parity details, and design-change-resilient article views.

### Added

- Generic CMS page route `/[slug]` — every entry in the Strapi `pages` collection renders automatically (hub-overview, dicra, hub-home when authored); page slugs join the prerender registration
- `/centers` — live centers grid (placeholder fallback, same swap mechanism)
- `/projects` and `/projects/[slug]` — tiles per the design plus detail pages (body markdown, focus areas, project manager + contact); project slugs prerendered
- `/publications` and `/hub-staff` — URL-contract placeholder pages linking current agency sources; content source is a Phase 4 decision (documented in-file)
- "Stay Informed" newsletter band on the articles listing — links to the agency's existing signup (no fake form; a real subscription backend is a Phase 4 integration decision)
- Articles listing grid/list toggle synced to `?view=list` (Hub 1.0 parity; shareable, back/forward-safe)
- Section nav grown to the design's five items (Research Hub, Centers, Articles, Data, Projects); breadcrumbs cover the new sections

### Changed

- **Article views decomposed for design flexibility**: the detail page is now a thin orchestrator over single-purpose components (`app/components/article/` — title band, overview, summary, citation, TOC card, file card) each mapping to one Figma block; grid/list card variants are `ArticleCard`/`ArticleListRow`; `KeywordsSection` and `FundingCard` shared across all detail pages. A Figma revision now means editing one component or reordering sections — not page surgery.
- 538 routes prerendered; a11y suite covers 12 routes × 2 color schemes (24 checks)

## [0.7.0] - 2026-07-11

Phase 2, milestone 3 — the homepage per the Figma design, anchored on live content with author-swappable placeholders.

### Added

- Homepage sections per the design: navy hero, Research & Analysis Unit welcome, Centers accordion, Latest Articles grid (live, 6 newest), Topics/Key Focus Areas band, Latest Resources shortcut cards, Major Projects band (navy/red/green tiles)
- Content strategy: articles/datasets/apps anchor the page from the live CMS; **centers and projects render live from Strapi when their collections have entries** (they do today) and fall back to typed placeholders in `app/content/homepage-placeholders.ts` otherwise; hero/welcome/topics copy comes from the `hub-home` page entry the moment authors create it (placeholder until then) — every placeholder block documents its CMS home
- Stretched-link card pattern: each card is one link named by its title ("Read More" is decorative) — fixes Lighthouse's generic-link-text audit and improves screen-reader link lists; whole card is clickable with a focus ring
- Project tiles use a fixed contrast-safe header palette by position; CMS `headerBg` class strings remain quarantined (never bound)

## [0.6.0] - 2026-07-11

Phase 2, milestone 2 — the datasets and apps sections; every Hub 1.0 content type now renders as static pages.

### Added

- `/datasets/` and `/apps/` listings styled as the design's "Analytics and Data" page — Datasets/Apps pill toggle (links, preserving the URL contract), search, count, card grids with archived markers
- `/datasets/[slug]`: title band with unit + time-period meta, navy Overview band, data-file download button, sources, full Name/Type/Definition variables table, notes, citation, keyword chips, `Dataset` JSON-LD + canonical
- `/apps/[slug]`: title band with prominent Launch button (external dashboards), Overview band with contributors, preview image, summary, launch callout, citation, keyword chips, canonical
- Related Content rail cards live on articles, datasets, and apps — cross-links between all three content types (deferred from M1 until targets existed)
- "Data" added to the section nav; Analytics & Data breadcrumbs
- Prerender registration generalized across all three collections — **518 routes** generated; a11y suite now audits 8 routes × 2 color schemes (16 checks)

### Security

- CMS-sourced URLs (app launch URL, dataset source URLs, media URLs) are scheme-filtered at the normalization boundary (`safeHttpUrl`) — only `http(s)` reaches an `href`/`src` sink; `javascript:`/`data:` values are dropped
- JSON-LD scripts serialize via `serializeJsonLd`, escaping `<` as `<` so CMS strings containing `</script>` cannot break out of the script element (`JSON.stringify` alone does not protect against this)

## [0.5.0] - 2026-07-11

Phase 2, milestone 1 — design tokens from Figma, site chrome, and the articles section as real static pages.

### Added

- ICJIA design tokens from the Figma file ("READY - hub design"): brand navy `#1B365D` as a full `icjia` palette, wired as the primary color with per-scheme AA shade overrides
- Site chrome per the design: three-bar header (agency bar, navy breadcrumb band, Research Hub section nav with the dark-mode toggle) and the navy four-column footer
- `/articles/` listing: server-rendered card grid (thumbnail, AA-safe category chip, date, title, excerpt), client search + type/year filters, Hub-parity "Load More" paging (42), live result count
- `/articles/[slug]` detail: title band with document icon, Last Updated + View PDF / Download PDF / Cite Article action row, navy Overview band with authors, splash hero, Summary section, sanitized markdown body with typographic styles, Table of Contents rail card (numbered anchors), Funding Acknowledgement card, report-file download card, citation section with DOI link, Keywords & Tags chips
- Canonical URLs and JSON-LD `ScholarlyArticle` on article pages (SEO parity plumbing begins)
- **All 236 article routes prerendered** via explicit route registration (`prerender:routes` hook fetching every slug); `failOnError` keeps hollow pages from ever shipping; ~478 routes in ~10s
- `CategoryChip` component with deterministic, WCAG-AA-safe palette pairs (the a11y gate caught Nuxt UI subtle badges failing 4.5:1 in light mode across 35 nodes)
- A11y suite now audits the listing and a real article detail page (slug from fixtures) in both color schemes — 8 checks

### Notes

- Prerender link-crawling is intentionally **off**: article bodies contain legacy links to slugs that no longer exist (4 found; inventory kept for the content team — they 404 correctly at click-time). Routes are registered explicitly instead, which is also deterministic.
- Related-content links on articles are deferred until the datasets/apps routes exist (next milestone) so the site never ships dead internal links.

## [0.4.0] - 2026-07-11

Phase 1 (Content layer) — typed Strapi 5 reads, one normalization boundary, one sanitized markdown pipeline; all gates green.

### Added

- Domain models for all content types (`app/types/content.ts`): Article, Dataset, App, Project, Center, Page, plus MediaFile/Author/LinkedRef
- Normalization boundary (`app/utils/normalize.ts`) — the only place raw CMS responses are touched: relative `/uploads` media URLs absolutized, PascalCase project/center fields (`Title`/`SubTitle`/`Body`/`Author`) mapped, `{title, description}` author components → `{name, bio}`, CMS presentation hints quarantined as `*Raw`
- Typed content service (`app/utils/content.ts`): REST reads with pagination-to-completion (no silent caps), retry, optional `NUXT_STRAPI_TOKEN` bearer (server-only; reads are currently public — no token required), real 404s via `createError`
- Markdown pipeline (`app/utils/markdown.ts`): marked 18 + marked-footnote + isomorphic DOMPurify, heading ids with collision suffixes, h2 TOC extraction, forced `rel="noopener noreferrer"` on `target=_blank`
- Fixtures from the live API (`tests/fixtures/`, refreshed via `scripts/update-fixtures.mjs`) — 23 new unit tests run fully offline
- Home page renders live CMS content (latest three publications) at build time — embedded in the prerendered HTML, with fail-loud prerender on fetch errors
- `.env.example` documenting the optional `NUXT_STRAPI_TOKEN` / `NUXT_PUBLIC_STRAPI_URL`
- ADR 0002 — content-layer decisions and known content gaps

### Notes

- The Strapi 5 `pages` collection currently holds only a `test` entry — the real `hub-home`, `hub-overview`, and `dicra` pages need authoring (Hub Studio) before Phase 2 can reach page parity
- Nuxt context gotcha, documented in the service: `useRuntimeConfig()` must be captured synchronously at function entry — calling it after an `await` fails during prerender with "composable called outside of a plugin"

## [0.3.0] - 2026-07-11

Phase 0 (Foundations) scaffolding — all quality gates green locally and in CI.

### Added

- Nuxt `4.4.8` + Nuxt UI `4.9.0` + Tailwind `4.3.2` application shell, TypeScript strict, pnpm, Node 22; `app.baseURL = '/researchhub/'` from the first commit (URL-parity contract)
- Accessible layout shell (skip link, labeled landmarks, footer), placeholder home page, and error/404 pages with a baked-in default `<title>` for the SPA-fallback shell
- Theme-token layer: semantic primary/neutral aliases with WCAG-AA shade overrides per color scheme (600 on light, 400 on dark) — no hardcoded colors in components
- Quality gates, enforced locally and in GitHub Actions CI (no secrets required to build): ESLint, `nuxt typecheck` (vue-tsc), Vitest unit tests, axe-core WCAG 2.1 A/AA via Playwright against the generated artifact in **both** light and dark mode on real routes, and Lighthouse budgets (performance ≥ 0.9, accessibility = 1.0, best-practices ≥ 0.9, itemized SEO audits until robots flips at launch)
- First typed utility `formatDate` with unit tests — fixes the predecessor's UTC date-shift bug (plan, Appendix A.5 #4)
- `scripts/postgenerate.mjs` — restructures static output for `/researchhub/` subpath hosting (root `robots.txt` + Netlify `404.html`)
- `netlify.toml` (static publish of `.output/public`, Node 22, `/` → `/researchhub/` convenience redirect), preview-blocking `robots.txt` (flips in Phase 4), SVG favicon
- ADR 0001 — Phase 0 architecture baseline (`docs/adr/`)

### Notes

- TypeScript is pinned to `^6.0.3`, the newest line the toolchain accepts: TypeScript 7 (native compiler) currently breaks `typescript-eslint` and `vue-tsc` (`ERR_PACKAGE_PATH_NOT_EXPORTED`), verified during setup
- Netlify site `copperhead-hub-20` (icjia team) created and linked to this repo for continuous deployment; preview at `copperhead-hub-20.netlify.app/researchhub/`. `NITRO_PRESET=static` is required in `netlify.toml` — on Netlify, Nitro otherwise auto-switches to its serverless preset and the static 404.html is never emitted (Phase 0 exit criteria complete)

## [0.2.0] - 2026-07-11

### Added

- Plan document, Section 7: "So, what exactly has to be done?" — the six-phase roadmap retold in plain English for non-technical managers — and "What we need from leadership" (five concrete asks: scope decision, design reviews, content freeze, cutover coordination, launch-gate agreement)

### Changed

- The plan document's Contents is now a clickable table of contents — internal bookmark links, deliberately built without a Word TOC *field* so the .docx still opens with no warning prompt
- All referenced resources in the plan document (Appendix E plus inline mentions in Sections 3–5) are live hyperlinks in both the .md and the .docx; verified 0 Word fields, 18/18 internal anchors resolved, 15 external links (all https)

## [0.1.0] - 2026-07-11

### Added

- Rewrite plan: `docs/ICJIA-Hub-20-rewrite-copperhead.md` (+ `.docx` for circulation) — Hub 1.0 parity/URL inventory, live Plausible traffic snapshot (6/12 months), full assessment of the unfinished `hub-frontend` attempt (36 major / 30 minor defects), reuse checklist, and a six-phase roadmap to launch on Nuxt 4.4.x + Nuxt UI 4.x
- Reference snapshot of the unfinished `hub-frontend` repository (`docs/icjia-hub-frontend-8a5edab282632443.txt`), the basis of the assessment
- Repository scaffolding: MIT `LICENSE`, this changelog, `.gitignore` (Nuxt), `.nvmrc` (Node 22)
- `README.md` — project overview, Hub 2.0 program status, planned architecture, and roadmap summary
