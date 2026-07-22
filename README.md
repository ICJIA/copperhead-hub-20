# Copperhead — ICJIA Research Hub 2.0 (public frontend)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/build-v0.28.2-1b365d.svg)](CHANGELOG.md)

> **Current build: v0.28.2 · updated 2026-07-22.** Living docs, always current:
> [CHANGELOG](CHANGELOG.md) (what shipped, per version) · [ROADMAP](ROADMAP.md) (next / deferred / done) ·
> the full [spec & status doc](docs/ICJIA-Hub-20-rewrite-copperhead.md). The running preview also
> surfaces these from its bottom status bar, and renders the spec in-app at `/researchhub/spec`.

> **Status: FIRST DRAFT — private preview, not public, not final.** A complete working draft of the new Research Hub exists at **https://copperhead-hub-20.netlify.app/researchhub/** (internal review only; hidden from search engines). All ~540 pages, every page type, and search — including search *inside* published PDF documents with an **in-app reader that highlights the searched term** — work in the draft, and every change passes automated accessibility, performance, and correctness checks before it deploys. Recent work has added the in-PDF search-term reader (v0.22.0), gentle reduced-motion-aware view transitions (v0.23.0), two Figma design-parity passes (v0.20–0.21), a manager-facing docs/status layer (v0.24.0), and a lazily-rendered rebuild of that PDF reader on pdf.js's own viewer engine so long reports open to the first match in seconds (v0.25.0), and an in-app roadmap page so managers read the roadmap in the app alongside the spec (v0.26.0), and a manager review-annotation layer on the private preview so leadership can leave comment threads on any page (v0.27.0). Still ahead: design review, real copy for the placeholder sections, and the launch checklist.

**For non-technical readers:** the rewrite is underway and further along than "started" — think of the preview as a full first-draft manuscript: every chapter written and readable end-to-end, now entering editing. Real today: all current articles, datasets, and dashboards in the new design; working deep search; the same web addresses the Hub uses now. Still to come: the designer's review against the mockups, real content where placeholder text stands in (homepage narrative, project descriptions, publications/staff pages), the ~17 newest Hub articles (they sync over at cutover), a human accessibility walkthrough, and the coordinated public launch. The plan document in [`docs/`](docs/ICJIA-Hub-20-rewrite-copperhead.md) has a plain-English progress section and the remaining asks of leadership.

**Engineering status:** Phases 0–5 of the six-phase roadmap are first-draft built — URL-parity infrastructure (246/266 archived Hub 1.0 URLs resolve; every miss accounted for), document-body search, per-template Lighthouse budgets, hardened CSP + security headers (verified live), 30 automated a11y checks plus an **executed-and-clean manual accessibility walkthrough** ([memo](docs/a11y-walkthrough-2026-07-11.md)), two design-fidelity passes against the Figma frames, a link-integrity sweep of all site chrome against the main site's sitemap, a read-only secret-stored CMS credential, runtime-clean dependency posture, and [`docs/runbook.md`](docs/runbook.md) with the full launch-day checklist. Phase 6 (launch) is coordination: content authoring + cutover sync, a live screen-reader session, freeze rehearsal, design sign-off, main-site proxy flip.

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
| **Copperhead** (this repository) | the public Research Hub website | 🚧 Working first draft (v0.28.2) — this repo |

## What's in this repository today

```
app/                  Nuxt 4 application (baseURL /researchhub/, TypeScript strict)
  layouts/ pages/     accessible shell: skip link, landmarks, error/404 pages
  utils/              first typed utilities (with unit tests)
  pages/reader.vue    in-app PDF reader with search-term highlighting (pdf.js)
  pages/spec.vue      renders the spec doc in-app (bottom status bar → Spec)
  components/         AppHeader, AppFooter (real ICJIA logo), AppStatusBar
docs/
  ICJIA-Hub-20-rewrite-copperhead.md/.docx   the spec/status doc (canonical, running changelog)
  figma-design-audit.md                      Figma parity audit + decisions
  footnote-fixes/                            paste-ready content fixes for 9 articles
  adr/                                       architecture decision records
tests/unit/           Vitest · tests/a11y/  axe-core WCAG 2.1 A/AA (Playwright, light + dark)
scripts/              postgenerate restructure · copy-spec · doc-stubs · sitemap
CHANGELOG.md · ROADMAP.md · netlify.toml · lighthouserc.cjs · LICENSE (MIT) · .nvmrc (Node 22)
```

## Development

```bash
pnpm install        # Node 22 (.nvmrc), pnpm
pnpm dev            # dev server at http://localhost:3000/researchhub/
pnpm lint           # ESLint
pnpm typecheck      # vue-tsc (TypeScript strict)
pnpm test           # unit tests (Vitest)
pnpm generate       # static build → .output/public (subpath-restructured)
pnpm test:a11y      # axe WCAG 2.1 A/AA against the generated site (run generate first)
pnpm lhci           # Lighthouse budgets against the generated site
```

No environment variables are required to build (optional overrides are documented in `.env.example`). All six commands must pass before merging — CI enforces the same gates on every PR.

## Manager annotations (dev preview)

A review layer for the private preview: managers select text on any page and leave
comment threads in a right-side drawer. It is **not** part of the public site — a
build-time kill switch removes it entirely at go-live.

- **Use it:** arm **Highlight** in the review bar (under the header), select text,
  and add a comment — a name or initials is required. Threads are public to every
  viewer of the preview, support replies, resolve/reopen, and delete-with-confirm,
  and persist across sessions and devices in Supabase. **Clean view** shows the
  site exactly as the public will see it. From `lg` up the drawer reserves page
  space (content shifts left) so it never hides the text under review. Each
  highlight and its comment share a number, and selecting a comment draws a line
  to its highlight; a **pencil toggle** in the header (next to the light/dark
  toggle) shows or hides the whole review overlay, so Clean view is never a
  dead end.
- **Storage:** Supabase project `efgevsdftkrancswojcz`, table
  `copperhead_annotations`. The committed key is a *publishable* key (safe in
  client code; Row Level Security is the boundary) — no environment variable is
  required. Optionally point it at another project per environment with
  `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY` (see `.env.example`) —
  a different origin must also be added to `netlify.toml`'s `connect-src`, or
  the browser's CSP blocks the connection.
- **Spec:** [`docs/superpowers/specs/2026-07-21-manager-annotations-design.md`](docs/superpowers/specs/2026-07-21-manager-annotations-design.md).

### Turning annotations off for go-live (permanent)

1. In `hub.config.mjs`, set `const ANNOTATIONS_ENABLED = false`.
2. In `netlify.toml`, remove `https://efgevsdftkrancswojcz.supabase.co` from the
   `connect-src` directive, and remove any `NUXT_PUBLIC_SUPABASE_*` variables from
   the Netlify build environment (a stray one would re-bake the URL into the
   payload even with the switch off — the grep in step 3 catches it).
3. Rebuild and deploy. The layer, its CSS, and every Supabase reference are
   tree-shaken out of the bundle. Verify the strip:

   ```bash
   pnpm generate
   grep -rl "supabase.co" .output/public | wc -l   # expect: 0
   ```

4. Optional cleanup: export anything worth keeping, then drop the
   `copperhead_annotations` table in Supabase.

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
