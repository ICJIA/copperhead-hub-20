# Copperhead — ICJIA Research Hub 2.0 (public frontend)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Status: planning (pre-development).** This repository currently holds the Copperhead rewrite plan and its reference material. Application code lands here beginning with Phase 0 of the roadmap. Last updated: July 11, 2026.

## TL;DR — the 30-second version

- **What it is:** *Copperhead* is the internal codename for the rebuilt **ICJIA Research Hub** public website — the reading experience for the agency's research articles, datasets, and data dashboards. At launch it simply becomes the Research Hub; the codename retires.
- **Why it matters:** the Hub is ICJIA's most-read web property — roughly **218,500 pageviews from 36,000 visitors** in the twelve months to July 2026, about **half of all pageviews and nearly two-thirds of all visitors** on icjia.illinois.gov (live Plausible query, 2026-07-11). It currently runs inside the main website's codebase on Strapi 3, which has been end-of-life since 2022.
- **What happened before:** a rewrite attempt (`hub-frontend`, March–July 2026) was left unfinished. A file-by-file assessment found the right stack but **36 major defects**; we keep ~2% of the code plus the lessons and rebuild the rest.
- **How we're building it:** a **standalone, statically generated** Nuxt 4.4.x + Nuxt UI 4.x site on its own Netlify build — **read-only, zero runtime servers or secrets** — pulling published content at build time from the already-migrated Strapi 5 CMS.
- **Non-negotiables:** exact URL parity with `icjia.illinois.gov/researchhub/…` (every existing link, bookmark, and citation keeps working — verified by an automated crawl before launch); WCAG 2.1 AA / IITAA 2.1 accessibility enforced in CI; and **no editing features** — authoring, preview, and publishing live in Hub Studio 2.0.

**Read the full plan:** [`docs/ICJIA-Hub-20-rewrite-copperhead.md`](docs/ICJIA-Hub-20-rewrite-copperhead.md) — Part I for managers (~10 minutes), Part II plus appendices for developers. A Word copy for circulation sits alongside it ([`docs/ICJIA-Hub-20-rewrite-copperhead.docx`](docs/ICJIA-Hub-20-rewrite-copperhead.docx)).

## The Hub 2.0 program at a glance

| Component | Role | Status |
|---|---|---|
| **Strapi 5 content database** | stores all Hub content (migrated from Strapi 3 via [`hub-migration-tools`](https://github.com/ICJIA/hub-migration-tools)) | ✅ Complete — full parity verified, March 2026 |
| **Hub Studio 2.0** ([`hub-studio-2026`](https://github.com/ICJIA/hub-studio-2026)) | internal tool where R&A staff write, preview, and publish | ✅ Built and working in development; pre-launch |
| **Copperhead** (this repository) | the public Research Hub website | 🚧 Planned — this repo |

## What's in this repository today

```
docs/
├── ICJIA-Hub-20-rewrite-copperhead.md     the rewrite plan (canonical)
├── ICJIA-Hub-20-rewrite-copperhead.docx   Word copy for circulation (no fields/links → no Word warning)
└── icjia-hub-frontend-8a5edab282632443.txt   snapshot of the unfinished hub-frontend repo (assessment basis)
CHANGELOG.md · LICENSE (MIT) · .nvmrc (Node 22) · .gitignore
```

## Planned architecture (summary)

```
Authors ──▶ Hub Studio 2.0 ──▶ Strapi 5 (v2.hub.icjia-api.cloud)
                                    │  publish webhook
                                    ▼
                          Netlify build (Copperhead)
                   nuxt generate + search index (build-time)
                                    │
                                    ▼
                  Static files on Netlify CDN (baseURL /researchhub/)
                                    ▲
Readers ──▶ icjia.illinois.gov ─────┘  (main site proxies /researchhub/* → Copperhead)
```

- **Stack:** Nuxt 4.4.x · Nuxt UI 4.x · Tailwind 4 · TypeScript (strict) · pnpm · Node 22
- **Rendering:** full static generation; content fetched only at build time with a read-only token — no runtime server, no runtime secrets
- **Search:** Pagefind over rendered pages + [`@icjia/pdf-search-index`](https://github.com/ICJIA/pdf-search-index) for text inside PDF/DOCX/XLSX documents
- **Quality gates in CI:** ESLint, `vue-tsc`, Vitest, axe-core (WCAG 2.1 A/AA), Lighthouse budgets, URL-parity crawl
- **Analytics:** Plausible (continuity with today's Hub reporting)

## Roadmap (summary — details and exit criteria in the plan, §9)

| Phase | Scope | Indicative effort |
|---|---|---|
| 0 — Foundations | scaffold, CI gates, Netlify site, `baseURL /researchhub/` | ~1 wk |
| 1 — Content layer | typed Strapi 5 client, markdown pipeline, fixtures | 1–1.5 wk |
| 2 — Parity pages | home, listings, article/app/dataset detail, CMS pages | 2–3 wk |
| 3 — Search & filtering | filter bar, document search, highlighting | 1–2 wk |
| 4 — SEO, URLs, analytics | sitemap, JSON-LD, redirects, **parity crawler** | ~1 wk |
| 5 — Hardening | WCAG 2.1 AA pass, performance budgets, docs, secrets rotation | 1–1.5 wk |
| 6 — Launch | content freeze + final sync, proxy flip, rollback plan | 0.5–1 wk |

## Related repositories

| Repository | Purpose |
|---|---|
| [`hub-frontend`](https://github.com/ICJIA/hub-frontend) | the unfinished 2026 rewrite assessed in the plan (to be archived) |
| [`hub-studio-2026`](https://github.com/ICJIA/hub-studio-2026) | Hub Studio 2.0 — authoring/preview/publishing |
| [`hub-migration-tools`](https://github.com/ICJIA/hub-migration-tools) | completed Strapi 3 → 5 migration, with incremental sync for cutover |
| [`v2-hub-demo`](https://github.com/ICJIA/v2-hub-demo) | filter/search UX proof of concept |
| [`pdf-search-index`](https://github.com/ICJIA/pdf-search-index) | build-time document text extraction for search |
| [`icjia-public-client-2021`](https://github.com/ICJIA/icjia-public-client-2021) | main website (contains Hub 1.0 today; source of the legacy URL contract) |

## License

[MIT](LICENSE) — Copyright © 2026 Illinois Criminal Justice Information Authority.
