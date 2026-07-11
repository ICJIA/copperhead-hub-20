---
title: "Project Copperhead"
subtitle: "ICJIA Research Hub 2.0 — Assessment of the Unfinished Rewrite and Roadmap to Completion"
date: "July 11, 2026 — Draft v1.0"
---

> **Document purpose.** This document does three things: (1) it explains, in plain English, where the ICJIA Research Hub stands today and why it must be rebuilt; (2) it assesses the unfinished rewrite attempt (`ICJIA/hub-frontend`, March–July 2026) in enough technical detail to justify the path chosen; and (3) it lays out a concrete, phased roadmap for **Copperhead**, the new Research Hub public site, built on Nuxt 4.4.x and Nuxt UI 4.x against the already-completed Strapi 5 content database.
>
> **How to read it.** Part I (Sections 1–7) is written for managers and decision-makers — about ten minutes of reading, no technical background assumed; unfamiliar terms are in the Glossary (Appendix D). Part II (Sections 8–10) and the Appendices are for developers. Web addresses for every system mentioned are collected as plain text in Appendix E. Figma design mockups will be attached in a future revision; this document is the planning and engineering baseline.

**Contents** *(click an entry to jump to that section)*

- [Part I — For Decision-Makers](#part-i--for-decision-makers)
  - [1. TL;DR (the 60-second version)](#1-tldr-the-60-second-version)
  - [2. Why a codename? ("Copperhead")](#2-why-a-codename-copperhead)
  - [3. The Research Hub today (Hub 1.0)](#3-the-research-hub-today-hub-10)
  - [4. What is already done (and de-risks this project)](#4-what-is-already-done-and-de-risks-this-project)
  - [5. The unfinished rewrite: what it is, what it includes, what it doesn't](#5-the-unfinished-rewrite-what-it-is-what-it-includes-what-it-doesnt)
  - [6. What we keep (the ~2%, plus lessons)](#6-what-we-keep-the-2-plus-lessons)
  - [7. The plan at a glance (managers' view)](#7-the-plan-at-a-glance-managers-view)
- [Part II — For Developers](#part-ii--for-developers)
  - [8. Target architecture](#8-target-architecture)
  - [9. Roadmap](#9-roadmap)
  - [10. Risks and mitigations](#10-risks-and-mitigations)
  - [Success criteria (definition of done)](#success-criteria-definition-of-done)
- [Appendix A — Defect inventory of the unfinished rewrite](#appendix-a--defect-inventory-of-the-unfinished-rewrite-hub-frontend)
- [Appendix B — Hub 1.0 URL & feature contract](#appendix-b--hub-10-url--feature-contract)
- [Appendix C — Reuse checklist](#appendix-c--reuse-checklist)
- [Appendix D — Glossary (for non-technical readers)](#appendix-d--glossary-for-non-technical-readers)
- [Appendix E — Referenced resources (plain-text addresses)](#appendix-e--referenced-resources-plain-text-addresses)

---

# Part I — For Decision-Makers

## 1. TL;DR (the 60-second version)

The **Research Hub is ICJIA's most-read web property**. A live analytics query run for this document (Plausible, July 11, 2026) shows about **218,500 pageviews from 36,000 visitors over the last twelve months — roughly half of all pageviews and nearly two-thirds of all visitors** on icjia.illinois.gov (full figures in Section 3). It runs on a content system (Strapi 3) that has been **end-of-life and unpatchable since 2022**, and its code lives tangled inside the main agency website.

A rewrite attempt ran from March to July 2026 and was left unfinished. We audited every line of it. The technology choices were right — the same ones we recommend — but the execution has **36 distinct major defects**: about half the code is a content-editing system that doesn't belong in a public website (and is unsafe as built), the site's addresses don't match the current Hub (every published link and citation would break), and the "static" site doesn't actually render its content statically. Repairing it costs more than rebuilding on its lessons. **We keep roughly 2%** — a handful of well-built utilities and several hard-won design lessons — and rebuild the rest.

The good news: **most of the Hub 2.0 program is already done.** The content database has been fully migrated to Strapi 5 and verified, and Hub Studio 2.0 — the tool staff will use to write and publish — is built and security-audited. Copperhead, the new public site, is the last major component. The plan below reaches launch in **six phases (indicatively 8–11 weeks of focused development)**, ending with a like-for-like replacement of the current Hub: same addresses, same content, dramatically faster, better-looking, accessible by law, and independent of the main website.

**Five things to remember:**

1. The Hub drives most of ICJIA's web traffic; its foundation is unsupported software from 2019.
2. The unfinished rewrite chose the right tools but is not salvageable as a codebase; we keep ~2% and the lessons.
3. The content migration (Strapi 3 → 5) is **already finished and verified** — the riskiest part is behind us.
4. Authoring moves to Hub Studio 2.0 (already built and audited); Copperhead is the public, read-only site.
5. Every existing Research Hub web address keeps working, verified by an automated check before launch.

## 2. Why a codename? ("Copperhead")

Big organizations name projects, not just products, for practical reasons:

- **It separates the effort from the product.** "Research Hub" will mean the *live site* for the entire duration of this project — the current Hub stays up, untouched, while we build. Saying "Copperhead" in a meeting, a ticket, or a repository name is always unambiguous; "the new hub," "hub 2," and "the redesign" are not, especially when a previous rewrite attempt also called itself Hub 2.0.
- **It keeps internal work internal.** The public never sees the codename. At launch, Copperhead simply *becomes* the ICJIA Research Hub — same name, same address. No public rebranding, no confusion for our readers.
- **It gives every artifact one label.** Repository, environments, tickets, meeting notes, and status reports all carry one word. When the project ends, the codename retires, and the paper trail stays coherent for anyone who audits the work later.
- **And the name itself?** The copperhead is a snake native to southern Illinois — an Illinois name for an Illinois project, short and memorable.

Within the broader **Hub 2.0 program**, the components are: **Strapi 5** (the content database — *done*), **Hub Studio 2.0** (the internal writing/publishing tool — *built, in pre-launch*), and **Copperhead** (the public website — *this plan*).

## 3. The Research Hub today (Hub 1.0)

The Research Hub is where ICJIA's Research & Analysis unit publishes its work: research articles and reports, downloadable datasets, and interactive data dashboards ("apps"). It launched in 2019 and currently lives at `icjia.illinois.gov/researchhub/` as a *section inside the main agency website's codebase* — not a separate application.

**How much it is used.** Live Plausible analytics, queried for this document on July 11, 2026 (Research Hub pages only, i.e., every URL under `/researchhub/`):

| Metric (Research Hub pages) | Last 6 months | Last 12 months |
|---|---|---|
| Unique visitors | ≈ 17,200 | ≈ 36,000 |
| Visits (sessions) | ≈ 42,900 | ≈ 91,400 |
| Pageviews | ≈ 100,500 | ≈ 218,500 |
| Share of *all* icjia.illinois.gov pageviews | ≈ 44% | ≈ 49% |
| Share of *all* icjia.illinois.gov visitors | ≈ 55% | ≈ 64% |
| Bounce rate | 64% | 63% |
| Average visit duration | 15m 25s | 15m 17s |

Two things stand out. First, the **average visit lasts over fifteen minutes** — readers are studying these publications, not skimming. Second, the Hub's most-read articles are substantial research products: over the last twelve months the top items were the police officer stress literature review (≈5,800 visitors), the police reform effectiveness review (≈5,800), the victim–offender overlap study (≈5,700), the SAFE-T Act roles and responsibilities explainer (≈5,300), and the mental illness and violence review (≈4,500).

One honest caveat cuts the other way: Hub traffic has **softened year-over-year** (visitors −18%, pageviews −34% versus the prior twelve months) even as overall site traffic grew. A platform this heavily used, aging visibly, is precisely the case for reinvestment rather than neglect.

**What the public gets today** (the parity baseline Copperhead must match):

- **Content.** ~253 published research articles, plus datasets and interactive dashboards, and a handful of standalone pages (hub overview, staff, DICRA reporting page). Sitemap snapshot on July 11, 2026: 266 Research Hub URLs.
- **Article pages** with: a hero image; a table of contents; downloadable report files (PDF and attachments); categories and tags; authors with biographies; publication date; suggested-citation block with DOI link; funding acknowledgment; related content; print support; and scholarly metadata that search engines understand (JSON-LD `ScholarlyArticle`).
- **Listing pages** for articles, apps, and datasets with grid/list view toggle and incremental "load more" paging.
- **Search-engine visibility** — Hub pages are indexed and heavily cited; many external documents link directly to Hub URLs.

**Why it must be replaced:**

- **Unsupported foundation.** Content is served from Strapi 3 (on MongoDB), end-of-life since 2022 — no security patches, no vendor support. The migration *away* from it is already complete (Section 4).
- **Entanglement.** Hub code is woven into the main website's codebase; neither can evolve or deploy independently. Copperhead explicitly separates them: one main website, one standalone Hub, each with its own build and deployment.
- **Legal accessibility obligations.** The U.S. Department of Justice's ADA Title II rule requires state government web content to meet WCAG 2.1 AA (the compliance date for large public entities was April 2026), alongside the Illinois Information Technology Accessibility Act (IITAA 2.1). A 2019-era codebase predates these obligations; Copperhead is designed to meet them and *prove* it with automated checks on every change.
- **Age.** The 2019 frontend stack (Vue 2 / Vuetify era) is itself at end-of-support, slow by modern standards, and increasingly hard to hire for or maintain.

## 4. What is already done (and de-risks this project)

Three substantial pieces of Hub 2.0 exist today. Copperhead does not start from zero.

| Component | Status | What it means for Copperhead |
|---|---|---|
| **Content migration, Strapi 3 → Strapi 5** (`hub-migration-tools`, v4.1) | **Complete and verified** — full API-to-API transfer of all articles, datasets, apps, media, and relationships, with automated field-by-field parity checks; includes an *incremental sync* mode for catching up late content changes at cutover | The hardest, riskiest part of most CMS projects is finished. Copperhead reads from the new Strapi 5 database from day one. |
| **Hub Studio 2.0** (`hub-studio-2026`) | **Built and working in development**; independently red/blue-team security audited four times with 0 critical issues; 677 automated tests | Writing, previewing, and publishing content is Studio's job. Copperhead therefore contains **no editing features at all** — which removes, in one stroke, the largest and most dangerous part of the unfinished rewrite. |
| **Filter/search UX proof-of-concept** (`v2-hub-demo`) | Live demo, built around the three concerns raised in Hub 2.0 meetings (research reports in one click; search highlighting; author names) | The filtering user experience has already been explored with stakeholders; Copperhead implements the chosen variant rather than designing from scratch. |

A fourth asset — **`@icjia/pdf-search-index`**, an in-house package that extracts searchable text from PDF/Word/Excel documents at build time, with a first-party Nuxt 4 integration — replaces the most fragile subsystem of the unfinished rewrite (see Section 5).

## 5. The unfinished rewrite: what it is, what it includes, what it doesn't

**Shape of the effort.** Repository `ICJIA/hub-frontend`, created March 17, 2026; last activity July 8, 2026; ~55 pull requests over about four months. It is a Nuxt 4 + Nuxt UI application — the same stack this plan recommends. We analyzed the complete repository snapshot (~12,000 lines across 98 files) file-by-file; the full defect inventory is Appendix A.

**What it includes (and mostly works in a demo sense):**

- Listing and detail pages for articles, apps, datasets, and projects, plus a centers page — with dark mode, card grids, and filtering.
- A capable client-side search that can find words *inside* published PDF and Excel files, with highlighted excerpts, plus an in-browser PDF viewer that highlights and steps through search matches.
- Netlify deployment configuration and an accessibility-testing harness (good bones, misconfigured — see Appendix A).
- A large embedded content-editing and live-preview system: a hand-built rich-text editor, eight preview page variants, custom buttons injected into the Strapi admin panel, and two proxy services that let the browser write to the CMS.

**What it does *not* include (the parity and operations gaps):**

- **The Hub's actual addresses.** Pages live at `/articles/...`, `/data/`, etc. — not `/researchhub/articles/...`. As built, **every existing Research Hub link, bookmark, search result, and academic citation would break.** No redirect layer exists either. (This is the single most consequential gap, and the user-visible reason "it was never launchable as-is.")
- **A homepage with real content** — the production homepage requests a CMS page whose slug is literally `test` and falls back to hard-coded mock articles and fake statistics with dead links.
- **True static generation** — listing pages fetch their content only in the browser *after* the page loads, so the prerendered "static" pages contain spinners instead of articles (bad for search engines, slow for readers, and contrary to the architecture's own goal).
- **Search-engine plumbing at parity:** no sitemap, no canonical URLs, no scholarly metadata (JSON-LD) anywhere — the current Hub 1.0 has these. The changelog *claims* robots.txt/llms.txt/social-share images that are absent from the repository.
- **Analytics** — no Plausible (or any) traffic measurement; we would go blind on our top KPI at cutover.
- Hub 1.0 pages not ported: publications listing, hub staff page, and the generic CMS-page route that serves hub-overview, DICRA, and similar pages.
- **Working quality gates:** the CI pipeline runs no linting, no type checks, and no tests (the test runner is configured to pass with zero tests); the accessibility suite audits placeholder URLs (literally `[slug]`) instead of real pages; there are no unit tests.
- Current documentation: the README misstates the UI framework version and Node requirement; the changelog stops on day one (all three entries dated March 17, 2026).

**The security posture requires structural removal, not patching.** Four findings drive this (full detail in Appendix A):

1. The preview/editing system gates **write access to the CMS** behind a home-made token whose algorithm is not cryptographic, whose signing secret ships inside public browser code, and which falls back to the publicly visible default `preview-secret` when unconfigured. Its client-side "authorization" is a browser flag anyone can set, and any website that embeds a preview page in a frame is auto-authorized.
2. A realistic secret value (`JWT_SECRET`) was committed to this **public** repository and later blanked — it remains permanently visible in Git history. Every credential that repository ever referenced must be rotated.
3. Security patches were left unapplied: the framework's own security hotfix (Nuxt 4.4.7) sat unmerged since June 16, as did a server-engine security patch since May 8; one build dependency (`xlsx 0.18.5`) is an abandoned release line with known CVEs.
4. CMS-authored content is injected into pages without sanitization in dozens of places, and header policy in one config file allows *any* website to frame the app while another config forbids it — contradictory and unsafe in combination with (1).

**Why rebuild rather than repair — the 98/2 verdict, quantified.** Roughly **half of all code in the repository serves content editing and preview** (62% of the component/composable layer; 43% of page code; 86% of the custom stylesheet) — a function that now belongs to Hub Studio and must be *removed regardless*. The removal touches nearly every remaining file, because read and write logic share the same modules, pages, and styles. What remains after such surgery still lacks the URL layer, static rendering, types, sanitization, SEO plumbing, tests, and analytics — each a structural fix, not a patch. Rebuilding on a clean scaffold, on the *same stack*, porting the few genuinely good pieces (Section 6), is the cheaper and safer path. That is not a criticism of any individual; it is an honest accounting of what the codebase would cost to finish versus replace.

**What happens to the repository:** archive it read-only on GitHub as reference material, extract the salvage list (Section 6), and rotate every secret it ever touched.

## 6. What we keep (the ~2%, plus lessons)

**Code ported with review** (from `hub-frontend`):

- The typed client-side search composables (`usePagefind`, `useSearch`, `useSearchHighlight`) and the `HighlightText` component — the best-written code in the repository.
- The "grouped search results" UX model (file matches nested under their parent article, with "contains match" badges).
- The race-guard pattern on async search, and the URL↔filter synchronization pattern from the articles listing (shareable filtered views).
- The defensive build-script utilities (timeouts, per-file failure isolation, pagination guards).
- The Strapi 5 response-normalization knowledge (single-vs-array media quirks, casing fallbacks) — as documented input to a clean, typed API layer.

**Operational knowledge preserved** (documented, not copied): the Netlify redirect/SPA-shell patterns and their pitfalls, the Netlify secrets-scanner behavior notes, the method+path allowlist proxy design (kept on file; Copperhead's architecture needs no runtime proxy at all), and the Pagefind attachment-stub indexing trick (superseded by `@icjia/pdf-search-index`, which productizes the same idea).

**Reused from the wider program** (the bigger accelerators): the verified Strapi 5 content database and its incremental-sync tooling; Hub Studio 2.0 for all authoring/preview; the `v2-hub-demo` filter components and typed GraphQL composable; `@icjia/pdf-search-index` for document search.

**Explicitly *not* carried forward:** the embedded rich-text editor and all eight preview routes; the browser-resident CMS write client and both proxy implementations; the home-made token scheme; the vendored Strapi admin/server file trees (any still-wanted admin customizations belong in the Strapi repository — most are made obsolete by Studio); the in-app PDF.js viewer page (default recommendation: open PDFs natively in the browser; revisit only if in-page match navigation is judged worth its weight); the unused dependencies (`@nuxt/content`, `@vuepic/vue-datepicker`, Quill/Turndown editor stack).

## 7. The plan at a glance (managers' view)

Copperhead is a **read-only, statically generated public website**: at build time it pulls published content from Strapi 5 and renders every page to plain, fast files served from a CDN. There is **no server and no secret at runtime** — nothing to hack, nothing to patch at 2 a.m., and page loads are as fast as static files can be. When staff publish in Hub Studio, an automatic signal rebuilds the site within minutes.

- **Same addresses, same content.** `icjia.illinois.gov/researchhub/...` URLs are preserved exactly; the main website passes `/researchhub/*` traffic through to the standalone Copperhead deployment. Before launch, an automated crawler verifies **every one of the 266 live URLs** (snapshot archived today) resolves on Copperhead with equivalent content.
- **Independence.** Copperhead deploys on its own Netlify site with its own build — the separation of Hub from main website that the current architecture lacks.
- **Modern, compliant, measurable.** Nuxt 4.4.x + Nuxt UI 4.x; WCAG 2.1 AA/IITAA checks enforced automatically on every change; Plausible analytics continuity from day one.
- **Six phases** — foundations → content layer → parity pages → search & filtering → SEO/URL verification → hardening & launch — each with public exit criteria (Section 9). Indicatively 8–11 focused weeks; assumptions and risks in Sections 9–10.

---

# Part II — For Developers

## 8. Target architecture

**Stack.** Nuxt **4.4.x** (baseline 4.4.2; ship on the current 4.4 patch release — 4.4.7+ carries a security hotfix the unfinished repo never merged), Nuxt UI **4.x**, Tailwind 4, TypeScript strict everywhere (no `.js` app code), pnpm, ESLint + `vue-tsc` in CI.

**Rendering model.** Full static generation (`nitro` static preset) — every public route prerendered at build time, including all `[slug]` pages enumerated from the CMS. Content fetched **only at build time** from Strapi 5 (`v2.hub.icjia-api.cloud`) via a single typed API module; the only credential anywhere is a **read-only** build-time token in Netlify env vars. No runtime server routes, no proxy, no runtime secrets, no preview routes. Draft preview is Hub Studio's concern entirely.

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

**URL strategy.** `app.baseURL = '/researchhub/'`. The main website's Netlify config proxies `/researchhub/*` to the Copperhead site (`status = 200`, `force = true`); the main site's own hub pages/routes are deleted at cutover. Copperhead emits `/researchhub/sitemap.xml` (referenced from the main site's sitemap index), correct trailing-slash behavior matching today's URLs, and a redirects file for any legacy oddities. Route inventory to implement is Appendix B. Decide during Phase 4 whether externally cited legacy file URLs (`researchhub.icjia-api.cloud/uploads/…`) get redirects or a read-only grace period.

**Content pipeline.** One typed domain model (`Article`, `App`, `Dataset`, `Project`, `Center`, `Page`) with a normalization layer that absorbs Strapi quirks (media single-vs-array, `Title`/`Herotitle` casing) in exactly one place. One markdown-render module (build-time, server-side) with sanitization baked in, one slugger, one TOC extractor, one date formatter — each unit-tested; no `v-html` of unsanitized strings anywhere in the app.

**Search.** Pagefind over the rendered HTML for page content, plus `@icjia/pdf-search-index` for PDF/DOCX/XLSX document bodies (its Nuxt 4 integration), emitting static JSON consumed client-side. Netlify build cache for downloaded documents so builds don't re-fetch the whole media library. No `unsafe-eval` (fix the dynamic-import hack noted in Appendix A when porting `usePagefind`).

**Quality gates (CI on every PR):** ESLint, `vue-tsc`, Vitest unit tests, axe-core WCAG 2.1 A/AA suite against a prerendered fixture build with *real* slugs, Lighthouse budgets on the five key templates, and a link-integrity pass. The URL-parity crawler (all archived Hub 1.0 URLs → 200 + title/content equivalence on Copperhead) runs in Phase 4+ and as the launch gate.

**Analytics & SEO.** Plausible (same site), canonical URLs, OpenGraph/Twitter cards with real static OG images, JSON-LD (`ScholarlyArticle` on articles, `Dataset` on datasets, `WebSite` on home), plain-text meta descriptions derived from abstracts (never raw HTML), `robots.txt`/`llms.txt` actually committed.

## 9. Roadmap

Estimates assume one primary developer, designs (Figma) arriving before Phase 2 page work, and the finished components of Section 4. Each phase ends with a reviewable, deployed artifact.

| Phase | Scope | Exit criteria | Indicative effort |
|---|---|---|---|
| **0 — Foundations** | Repo scaffold (Nuxt 4.4.x/UI 4/TS strict/pnpm), Netlify site with `baseURL /researchhub/`, CI with all gates wired (lint, types, unit, axe, Lighthouse), theme tokens, error/404 pages | CI red/green demonstrably enforces every gate; skeleton deploys to Netlify behind a preview URL | ~1 wk |
| **1 — Content layer** | Typed Strapi 5 client (build-time), domain models + normalization, markdown/TOC/sanitize modules with unit tests, fixture snapshots for offline builds | `pnpm build` renders real CMS content with **no network access at test time** (fixtures); types cover all six content types | 1–1.5 wk |
| **2 — Parity pages** | Hub home, listings (articles/apps/datasets; grid/list + load-more), detail templates (article anatomy: hero, TOC, downloads, categories/tags, authors+bios, citation/DOI, funding, related, print), generic CMS page route (hub-overview, DICRA…), publications, staff | Every Appendix B route renders statically with real content; visual sign-off against Figma; axe suite green on real slugs | 2–3 wk |
| **3 — Search & filtering** | Filter bar per chosen `v2-hub-demo` variant (type/topic/author/year/center/tags + free text), Pagefind + `pdf-search-index` integration, grouped results, highlighting | The three stakeholder concerns demonstrably solved (reports in one click; highlighting; author names); document-body matches return correct parents; no `unsafe-eval` | 1–2 wk |
| **4 — SEO, URLs, analytics** | Sitemap, canonicals, JSON-LD, OG images, robots/llms.txt, redirect map, Plausible, **URL-parity crawler** against the archived 266-URL snapshot + router patterns | Crawler: 100% of archived URLs → 200 with equivalent title/primary content; structured-data validation passes | ~1 wk |
| **5 — Hardening** | Full WCAG 2.1 AA pass (automated + manual keyboard/screen-reader), Lighthouse budgets (mobile ≥90 perf; 100 a11y/SEO on key templates), dependency audit, docs (README, runbook, ADRs), content freeze rehearsal | All budgets met; zero axe violations; independent review sign-off; secrets rotated (everything the old public repo touched) | 1–1.5 wk |
| **6 — Launch** | Content freeze + final `hub-migration-tools` incremental sync, main-site proxy flip for `/researchhub/*`, cache warm, monitoring, rollback plan (proxy revert = instant), then delete hub code from the main site | Cutover completed with rollback tested; post-launch crawl clean; Plausible reporting continuously | 0.5–1 wk |

**Total: indicatively 8–11 weeks.** Centers/Projects pages (Hub 2.0 additions already modeled in Strapi 5 and present in the unfinished app) are a scope decision to confirm before Phase 2; they fit inside the same template system at roughly +1 week if included at launch.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A legacy URL slips through and breaks a citation | Automated parity crawl of the archived URL snapshot is a *launch gate*, not a nice-to-have; redirects file for stragglers; monitor 404s in Plausible post-launch |
| Build-time coupling to CMS uptime (the old repo hard-failed builds without a live CMS) | Fixture-based tests; cached last-good content artifacts; fail-loud-but-retryable builds; scheduled daily rebuild as freshness backstop |
| Design (Figma) arrives late | Phases 0–1 are design-independent; Phase 2 starts with structure/content and applies visual design as it lands |
| Editing features creep back into the public site | Hard boundary, stated here: Copperhead is read-only; all authoring/preview belongs to Hub Studio. Any exception requires a written decision |
| Content changes during the build-out | `hub-migration-tools` incremental sync + short content freeze at cutover (rehearsed in Phase 5) |
| Secrets exposed by the old public repo | Rotate all Strapi tokens/secrets it referenced (including the historical `JWT_SECRET`); Copperhead holds a single read-only build token; secret scanning in CI |
| Externally cited legacy file URLs (`researchhub.icjia-api.cloud/uploads/…`) | Inventory in Phase 4; either redirect at the API host or keep legacy bucket read-only for a defined grace period |
| Strapi 5 schema quirks (field-casing inconsistencies) | Normalization layer + typed models centralize the mess; optionally schedule a schema-cleanup pass in Strapi with Studio team |
| Accessibility regressions after launch | axe suite in CI forever; quarterly manual audit; contrast-safe theme tokens only |
| Single-maintainer continuity | ADRs for every architectural decision; runbook; this document kept current in-repo |

## Success criteria (definition of done)

1. **URL parity:** 100% of the archived Hub 1.0 sitemap URLs (266, snapshot 2026-07-11) and all legacy router patterns resolve on Copperhead with equivalent content; automated proof retained.
2. **Content parity:** article anatomy (TOC, downloads, citation/DOI, funding, authors/bios, related, categories/tags, print) present and populated from Strapi 5.
3. **Performance:** Lighthouse mobile ≥ 90 performance on home/listing/article/dataset/app templates; static HTML contains full content (no client-fetch-only rendering).
4. **Accessibility:** 0 axe violations at WCAG 2.1 A/AA on all templates with real content; manual keyboard/screen-reader pass documented (ADA Title II / IITAA 2.1).
5. **Search:** free-text search covers page content *and* document bodies (PDF/DOCX/XLSX), with highlighting and grouped results; works without `unsafe-eval`.
6. **SEO:** sitemap, canonicals, JSON-LD, OG metadata validated; Plausible continuity demonstrated across cutover.
7. **Security:** zero runtime secrets; read-only build token; all legacy-exposed credentials rotated; no unsanitized HTML injection; CI secret scanning.
8. **Process:** CI enforces lint/types/unit/a11y on every PR; README/runbook/ADRs current; unfinished repo archived; authoring happens exclusively in Hub Studio.

---

# Appendix A — Defect inventory of the unfinished rewrite (`hub-frontend`)

Consolidated from a file-by-file review of the complete repository snapshot (~12,000 lines, 98 files). **36 major defects** and a curated list of **30 minor defects** (of ~55 catalogued) follow, grouped by theme. File references are to repository paths.

## A.1 Security — major

| # | Finding | Evidence |
|---|---|---|
| S1 | Preview/write tokens are cryptographically worthless | Token = `djb2`-style 31-bit hash (`Math.imul(31,h)`), not an HMAC (a comment claims "HMAC"); gates **PUT/upload** access through the bearer-token proxy; algorithm duplicated in ~5 files (`app/utils/previewToken.js`, `netlify/functions/strapi.mjs`, `server/api/strapi/[...path].ts`, both vendored `previewToken.ts` copies) |
| S2 | Signing secret ships to browsers; scheme fails open | `VITE_PREVIEW_SECRET` inlined into public JS; `generateToken()` runs client-side (site and Strapi admin bundle); three independent fallbacks to the literal default `'preview-secret'` (generator, verifier, `nuxt.config.ts runtimeConfig`) |
| S3 | Preview "authorization" is client-side theater | `middleware/preview-access.ts` skips on server, auto-authorizes **any** iframe parent (no origin check), persists a plain `sessionStorage` flag (`preview_authorized=true`) anyone can set in devtools |
| S4 | Secret committed to public repo history | Realistic `JWT_SECRET` value in `strapi5-files/.env.example`, blanked 2026-07-03 (commit `f629d98`) — permanently in Git history; rotation mandatory |
| S5 | Contradictory framing policy | `nuxt.config.ts` routeRules + Vite dev send CSP `frame-ancestors *` on all routes while `netlify.toml` sends `frame-ancestors 'self' https://v2.hub.icjia-api.cloud` plus deprecated `X-Frame-Options: ALLOW-FROM`; combined with S3's iframe auto-auth, any site could frame the editor |
| S6 | Stored-XSS surface throughout | Unsanitized `v-html` of CMS/marked/Pagefind output on all detail, preview, and search pages (`app.citation`, `app.funding`, `fixAssetUrls(article.abstract)`, `result.excerpt`, …); no DOMPurify anywhere; editor paste handler strips only `<script>`/`<style>` (event-handler attrs, `javascript:` URLs survive) |
| S7 | Open PDF proxy | `pdf-viewer.vue` renders and force-downloads **any** `?file=` URL with no allowlist — arbitrary external documents under the agency's domain (phishing vector) |
| S8 | Capability tokens in query strings | All preview/editor iframe URLs carry `?token=…` — leaks into logs, history, Referer |
| S9 | Known-vulnerable dependencies left unpatched | Nuxt 4.4.2 with the 4.4.7 **security hotfix** unmerged (Dependabot PR open since 2026-06-16); nitropack security patch unmerged since 2026-05-08; `xlsx 0.18.5` (abandoned npm line; CVE-2023-30533, CVE-2024-22363) parsing CMS uploads at build time |
| S10 | CMS write client in the public bundle | `updateX`/`publishX`/`POST upload`/media-library listing ship in public site JS behind `getHeadersWithAuth()` |

## A.2 Architecture — major

| # | Finding | Evidence |
|---|---|---|
| A1 | ~Half the codebase is an embedded CMS | Editing/preview accounts for ~62% of component/composable lines, ~43% of page lines, ~86% of the 747-line stylesheet — duplicating Strapi admin and (now) Hub Studio |
| A2 | Eight preview routes are structural clones | `preview`/`appspreview`/`datasetpreview`/`projectspreview` + 4 `…readonly` twins: 43–62% pairwise verbatim overlap; identical iPhone device-frame CSS ×4, identical field-label CSS ×4, identical header chrome ×4 |
| A3 | Readonly previews re-duplicate the public templates | ~51% token-identical with the public detail pages and already drifted (dark-mode classes lost; dead `href="#"` stubs persist in one copy; label bugs in the other) |
| A4 | 26 Strapi server/admin files vendored into the frontend repo — twice | `live-preview-files/` (17) + `strapi5-files/` (9): React/`@strapi/design-system` components, Strapi `config/*.js` — unbuildable/untestable here; 7 of 8 shared files byte-identical, 1 already drifted (`PreviewButton.tsx` projects branches), no marked canonical copy |
| A5 | The Strapi proxy exists twice and drifted | Netlify Function (prod) allows `projects` endpoints; Nitro route (dev) rejects them → 403 in dev, works in prod; different 401 diagnostics; root cause: `NITRO_PRESET=static` discards server routes, forcing the hand-copy |
| A6 | Four near-identical CRUD composables, already diverging | `useApps/useArticles/useDatasets/useProjects` (~490 lines): byte-similar `fetchXPreviewById`/`publishX`/`updateX` with copy-paste drift (missing field selections, divergent publish queries, malformed `?&populate=*` URL) |
| A7 | Hand-rolled data layer reinvents Nuxt's | Bare `fetch()` + `response.ok` throws everywhere; no `useFetch`/payload transfer; missing slug ⇒ generic `Error` (no real 404 status possible); no `AbortController`/timeout; stale-response races in media search and related-search |
| A8 | Configuration via undeclared magic globals | `API_BASE_URL`, `STRAPI_PROXY`, `getHeaders()`, `generateToken()` consumed as bare auto-imports; `import.meta.env` instead of `useRuntimeConfig`; data layer reads `window.location.search` (SSR-unsafe) |
| A9 | 993-line hand-built WYSIWYG on a deprecated API | `RichTextEditor.vue`: `document.execCommand` throughout; media library re-implemented inside; demonstrable bugs (add-row-below duplicates add-row-above; caret-resetting watcher; no-op `resetGrid`) |
| A10 | Mixed JS/TS with zero domain types | 11 of 14 composables untyped `.js`; 1 of 8 components TS; no `Article`/`Dataset`/… interfaces anywhere; Strapi casing chaos (`Herotitle`, `Title`, `Author`) leaks raw into views |

## A.3 Correctness & parity — major

| # | Finding | Evidence |
|---|---|---|
| P1 | URL contract absent | No `/researchhub` baseURL; datasets index at `/data/`; preview↔public links mix `documentId` vs slug (broken cross-links); every live Hub URL would 404; no redirects |
| P2 | Homepage ships mock content | `PAGE_SLUG = 'test'`; ~130 lines of inline `MOCK_ARTICLES`/fake statistics (identical copy-pasted description ×3) with dead links (`/articles/mock-1`); "Key Statistics" section commented out |
| P3 | SSG defeated by client-only fetching | Listings/home/search use `useAsyncData(..., { server: false })` *with* `prerender: true` — prerendered HTML contains spinners, not content |
| P4 | Duplicate `useAsyncData` key `'search-index'` bound to two different loaders | Three pages load the JSON index under the key; `search.vue` loads the Pagefind engine under the same key — cross-page cache collision silently skips one |
| P5 | SEO regression vs Hub 1.0 | No canonical URLs and no JSON-LD anywhere; `projects/[slug]` has no SEO meta at all; HTML injected into meta descriptions; empty-string `og:image` |
| P6 | Lossy markdown↔HTML round-trip corrupts content | Editor save path (Turndown custom table rule using `cell.textContent`) strips links/bold/footnotes inside table cells — saving an *unedited* article can corrupt it |
| P7 | Prev/next nav refetches 100 articles per article view | Immediate watcher outside `useAsyncData` (double fetch, hydration pop-in); silently breaks past 100 articles; errors swallowed |
| P8 | Markdown pipeline duplicated with drift | `fixFootnotes`/`slugify`/TOC exist twice (public article vs readonly preview) with real behavioral differences (fixpoint loop and scroll-offset math in only one copy); three divergent registration strategies for the footnote plugin |
| P9 | Search index is deploy-coupled and non-deterministic | Index only rebuilt on deploy (content changes invisible until manual redeploy); pipeline re-downloads the full PDF/Excel library every build; download failures are swallowed → silently incomplete index |
| P10 | Cannot build without production CMS + full-privilege token | Nitro `compiled` hook hard-throws without `VITE_API_BASE_URL`/`API_BEARER_TOKEN`; CMS outage blocks all deploys; fork PRs always fail |

## A.4 Quality, accessibility, process — major

| # | Finding | Evidence |
|---|---|---|
| Q1 | Accessibility blockers on an IITAA/ADA-covered site | Clickable `<div>`s without keyboard/role (cards, search results); dialogs without `role="dialog"`/focus trap/Escape; icon-only buttons without `aria-label`; right-click-only table menu; CSS strips list semantics (`list-style:none` + flex `::before` counters); link contrast ~3.1:1 (< 4.5:1 AA) |
| Q2 | 747-line global stylesheet fights the design system | Defines `--ui-color-primary-*` tokens then hardcodes `#005EA2` ~15×; three competing blues; two parallel typography systems restyling the same elements; duplicated rule blocks; editor block has no dark-mode styles (why previews force-disable dark mode site-wide — which also permanently overwrites the visitor's stored preference) |
| Q3 | CI enforces nothing | Workflow runs only `build` + `pagefind:build` on every push of every branch — no lint/typecheck/tests — while injecting the production bearer token and hammering the live CMS; output discarded (no artifact/deploy); `passWithNoTests: true` keeps `pnpm test` green with zero unit tests |
| Q4 | A11y suite audits the 404 page | Route auto-discovery visits literal `[slug]`/`[id]` URLs; the standalone audit script covers `/` only |
| Q5 | Documentation drift throughout | README: "Nuxt UI v3" (repo uses v4.5.1), "Node 18+" (code requires 22+); CHANGELOG: three entries, all 2026-03-17, none covering the later flagship features; claims robots.txt/llms.txt/OG image that are absent from the snapshot; `package.json` has no version field |
| Q6 | Dead and inappropriate dependencies | `@nuxt/content 3.12.0` and `@vuepic/vue-datepicker` used nowhere; alpha `@nuxt/a11y` and `@nuxt/test-utils` in production deps; multi-MB `pdfjs-dist` for one page; global `crypto.randomUUID` monkey-patch (Math.random-based) shipped in production HTML |

## A.5 Minor defects (curated, 30)

1. Malformed query URL `?&populate=*` (`useArticles.js`).
2. Two identical computeds (`baseQuery`/`allQuery`) in `CategoryChips.vue`.
3. `fixAssetUrls` regex corrupts protocol-relative URLs; misses `srcset`/`href`.
4. UTC date formatting shifts evening timestamps a day backward (US-Central).
5. Preview layout permanently overwrites the visitor's color-mode preference.
6. `new Function('url', 'return import(url)')` in `usePagefind` requires `unsafe-eval` (breaks under CSP) — fix with `import(/* @vite-ignore */ url)`.
7. Errors swallowed to console or bare `catch` across search/media composables; developer instructions ("Run `pnpm build:full`…") leak into end-user error states.
8. Tailwind class strings and icon names stored in CMS fields (purge/safelist trap).
9. Silent hard caps: `pageSize=100/50` truncation; single-types faked with `pageSize=1` collections.
10. Attachment-hash convention duplicated between `ContentCard` and `usePagefind`.
11. Image-URL prefixing logic triplicated.
12. "No Image" placeholder at ~1.9:1 contrast; inline styles mixed with utilities.
13. Off-palette hovers; carousel arrows misbehave at bounds; fixed 420px card basis breaks small viewports.
14. Nuxt UI v2-era color props (`color="white"`/`"gray"`) invalid in the installed major.
15. Editor timers never cleared on unmount; stale fixed-position overlay on scroll; full-document `innerHTML` serialization per keystroke.
16. CSS-hack placeholder text invisible to assistive tech.
17. Default layout: no skip link, unlabeled `<nav>`, no mobile nav, no footer.
18. `formatDate` reimplemented in three places despite a util existing.
19. Hardcoded CMS media URLs (hero images, og:image) in templates — a re-upload breaks the homepage.
20. `API_BASE_URL` fallback to `http://localhost:1338` can leak into builds.
21. Dead `href="#"` links ("Cite Article", sidebar) kill crawlability and open-in-new-tab.
22. Two data-access idioms (composables vs raw `fetch` + `window.location`) across sibling pages.
23. `'undefined'` string sentinel from CMS special-cased in three render paths instead of fixed at source.
24. Toast colors `'green'`/`'red'` aren't valid semantic tokens in the installed Nuxt UI.
25. Cross-page `useState` navigation globals silently mislabel "Back to …" on refresh.
26. Filter state URL-synced on one listing but not the other; array-valued query params unhandled; duplicate `:key` risks (`:key="pub.Title"`).
27. `slugify` heading-ID collisions (duplicate headings).
28. Two contradictory vendored Strapi middleware configs (one extensionless and unloadable); `postMessage` origin check commented out; `allowedHosts: true` in vendored admin Vite config; Strapi-native preview configured but `enabled: false` while custom buttons re-implement it; dev URL `research-hub-dev.netlify.app` hardcoded in 8+ places.
29. Redirect/noindex lists hand-synchronized ×8 in two files; `projectspreview` redirects point at pages that 403 in the dev proxy (and the readme's page tree lacks them).
30. Duplicated hand-rolled `.env` parser in two scripts; stale "Fuse.js" docblock; `.nuxtrc` contains an unrecognized key; README's "canonical" build command differs from Netlify's; same Strapi token required under two env names, with a warning list of three var names that must *not* exist.

# Appendix B — Hub 1.0 URL & feature contract

**Route inventory Copperhead must serve** (source: legacy hub router + live sitemap, 2026-07-11):

| Route | Today serves | Notes |
|---|---|---|
| `/researchhub/` | Hub home | |
| `/researchhub/articles` (+`/`) | Articles listing | grid/list `?view` toggle; load-more paging (42/page) |
| `/researchhub/articles/:slug` | Article detail | anatomy: hero, TOC (h2), downloads (main + extra files), categories/tags, authors + bios, date, print, citation + DOI, funding, related content, JSON-LD `ScholarlyArticle` |
| `/researchhub/apps`, `/researchhub/apps/:slug` | Dashboards listing/detail | external-app marker |
| `/researchhub/datasets`, `/researchhub/datasets/:slug` | Datasets listing/detail | data files + metadata |
| `/researchhub/publications` | Publications listing | reuses an About-section view today |
| `/researchhub/hub-staff` | Staff page | |
| `/researchhub/:slug` | Generic CMS pages | live today: `hub-home`, `hub-overview`, `dicra` |
| `/researchhub/sitemap.xml` | — (new) | referenced from main-site sitemap index |

**Live sitemap snapshot (2026-07-11): 266 URLs** — 253 articles, 5 apps, 5 datasets, 3 pages. Archive this list in-repo; it is the Phase 4 parity-crawler input. Content counts at migration (March 2026): 236 articles, 26 datasets — deltas handled by incremental sync at cutover.

**Backends:** Hub 1.0 reads Strapi 3 GraphQL at `researchhub.icjia-api.cloud`; Copperhead reads Strapi 5 at `v2.hub.icjia-api.cloud`. Media/upload URL continuity for externally cited files: inventory + decision in Phase 4 (Section 10).

# Appendix C — Reuse checklist

| Asset | Source | Action |
|---|---|---|
| `usePagefind` / `useSearch` / `useSearchHighlight` / `HighlightText` | hub-frontend | Port with review; remove `unsafe-eval` hack |
| Grouped-results search UX; race-guard counters; URL↔filter sync | hub-frontend | Port pattern |
| Build-script hygiene (`download-utils.mjs`) | hub-frontend | Port |
| Strapi 5 normalization quirks (media single-vs-array, casing) | hub-frontend | Encode in typed normalization layer |
| Netlify redirect/SPA-shell/secrets-scanner notes; proxy-allowlist design | hub-frontend | Document in runbook (no runtime proxy needed) |
| Pagefind attachment-stub concept | hub-frontend | Superseded by `@icjia/pdf-search-index` |
| axe + Playwright harness bones | hub-frontend | Rebuild with real fixture slugs |
| Filter components + typed GraphQL composable | v2-hub-demo | Primary Phase 3 input |
| Document search (PDF/DOCX/XLSX) | @icjia/pdf-search-index | Adopt (Nuxt 4 integration) |
| Incremental content sync | hub-migration-tools | Cutover tool |
| Authoring/preview/publishing | hub-studio-2026 | Owns all write paths |
| Strapi admin customizations (`strapi5-files/`) | hub-frontend | Do **not** carry in frontend; relocate anything still wanted to the Strapi repo (mostly obsoleted by Studio) |

# Appendix D — Glossary (for non-technical readers)

- **CMS (Content Management System):** the database-with-an-interface where staff enter articles and upload files. Ours is **Strapi** (version 3 = old, unsupported; version 5 = current).
- **Headless CMS:** a CMS that only stores content; a separate website (Copperhead) presents it.
- **API:** the channel a website uses to ask the CMS for content.
- **Static site generation (SSG):** building every page as a plain file ahead of time, so visitors get instant pages and there is no live server to attack or maintain.
- **CDN:** the network of servers that delivers those static files fast, everywhere.
- **Netlify:** the hosting service that builds and serves the site; a **build** is one run of that process.
- **Repository (repo):** the versioned home of the code (on GitHub). **CI** = the robot that checks every change (tests, accessibility, code standards) before it can ship.
- **WCAG 2.1 AA / IITAA / ADA Title II:** the accessibility standards state web content must meet — federal rule (DOJ, 2024) and Illinois law.
- **JSON-LD / sitemap / canonical URL:** machine-readable signals that tell search engines what a page is, what exists, and which address is official.
- **Pagefind / search index:** the pre-built lookup table that makes site search instant without a search server.
- **Plausible:** the privacy-friendly analytics service that counts our traffic.
- **Token / secret:** a password-like credential; "rotating" one means replacing it everywhere.
- **Codename:** an internal project label (see Section 2); retired at launch.
- **Technical debt:** shortcuts in code that accrue "interest" as future work.
- **ADR (Architecture Decision Record):** a one-page written record of a significant technical decision and why it was made.

# Appendix E — Referenced resources (plain-text addresses)

All addresses below are intentionally **plain text, not clickable links** — copy them into a browser if needed.

**Live sites**

| Resource | Address |
|---|---|
| Research Hub 1.0 (current, live) | `https://icjia.illinois.gov/researchhub/` |
| ICJIA main website | `https://icjia.illinois.gov/` |
| Filter-UX proof of concept (live demo) | `https://v2-hub-demo.netlify.app/` |

**Content APIs**

| Resource | Address |
|---|---|
| Strapi 3 (legacy, end-of-life — being retired) | `https://researchhub.icjia-api.cloud` |
| Strapi 5 (migrated, current — Copperhead's source) | `https://v2.hub.icjia-api.cloud` |

**Code repositories (GitHub, organization `ICJIA`)**

| Repository | Purpose |
|---|---|
| `github.com/ICJIA/copperhead-hub-20` | **Project Copperhead — this project's repository** (home of this document) |
| `github.com/ICJIA/hub-frontend` | The unfinished 2026 rewrite assessed in this document (to be archived) |
| `github.com/ICJIA/hub-studio-2026` | Hub Studio 2.0 — internal authoring/preview/publishing tool |
| `github.com/ICJIA/hub-migration-tools` | Completed, verified Strapi 3 → 5 content migration (with incremental sync) |
| `github.com/ICJIA/v2-hub-demo` | Filter/search UX proof of concept |
| `github.com/ICJIA/pdf-search-index` | `@icjia/pdf-search-index` — build-time document text extraction for search |
| `github.com/ICJIA/icjia-public-client-2021` | Main website codebase (contains Hub 1.0 today; source of the legacy URL contract) |

**Standards & references (for the compliance sections)**

| Reference | Address |
|---|---|
| WCAG 2.1 (W3C accessibility guidelines) | `https://www.w3.org/TR/WCAG21/` |
| DOJ ADA Title II web accessibility rule | `https://www.ada.gov/resources/2024-03-08-web-rule/` |
| IITAA (Illinois accessibility act) | `https://doit.illinois.gov` (Accessibility section) |
