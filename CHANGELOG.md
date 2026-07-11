# Changelog

All notable changes to Project Copperhead (ICJIA Research Hub 2.0 public frontend) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
