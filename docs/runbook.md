# Copperhead runbook

Operations manual for the ICJIA Research Hub 2.0 public frontend.
Audience: whoever operates or inherits this system.

## System shape

Static site. Netlify builds from `main` (`pnpm generate:full`), publishes
`.output/public`. No runtime servers, no runtime secrets. Content is
build input from Strapi 5 (`v2.hub.icjia-api.cloud`, public reads;
optional read-only `NUXT_STRAPI_TOKEN`). All critical values:
`hub.config.mjs`.

- **Site:** `copperhead-hub-20` (Netlify team icjia), site id in `hub.config.mjs`
- **Preview:** https://copperhead-hub-20.netlify.app/researchhub/
- **CI:** GitHub Actions — lint, typecheck, unit, URL-parity (advisory), axe (13 routes × 2 color schemes), Lighthouse budgets

## Content operations

- Authors write/publish in **Hub Studio** (or Strapi admin). The public
  site picks up changes on the next build.
- **Publish → rebuild webhook:** POST to
  `https://api.netlify.com/build_hooks/6a528115e361bad3e8438bc8`
  (created 2026-07-11, "Hub Studio publish"). Configure Strapi's webhook
  (Settings → Webhooks → entry.publish/unpublish) or Studio's post-publish
  hook to call it. Until wired, trigger deploys from the Netlify UI or by
  pushing to `main`.
- New `pages` entries appear automatically at `/researchhub/<slug>`.
  Landing copy for /centers and /projects lives in `pages` entries
  `centers` / `projects`; the homepage copy entry is `hub-home` (not yet
  authored — placeholders render until it exists).
- Document search: attachments (pdf/docx/pptx/xlsx) are text-extracted at
  build; extraction failures are listed in the build log (search for
  `skipped:`) — fix the file in the CMS and rebuild.

## Build & local dev

| Command | Purpose |
|---|---|
| `pnpm dev` | dev server (http://localhost:3000/researchhub/) |
| `pnpm generate` | static build + sitemap + Pagefind (no doc extraction) |
| `pnpm generate:full` | + document text extraction (what Netlify runs); `DOC_LIMIT=n` for smoke tests |
| `pnpm parity` | URL-parity check vs the archived Hub 1.0 snapshot (`PARITY_STRICT=1` = fatal misses) |
| all six gates | `lint` · `typecheck` · `test` · `generate` · `test:a11y` · `lhci` |

## Launch-day checklist (Phase 6)

1. **Content freeze** (~2–3 business days agreed with R&A). Rehearse once beforehand: freeze for an hour, run steps 2–4, unfreeze.
2. Run the **incremental content sync** (`hub-migration-tools`) so post-migration Hub 1.0 articles land in Strapi 5; confirm `hub-home`, `hub-overview`, `dicra` pages are authored.
3. Flip `public/robots.txt` to allow-all + add `Sitemap: https://icjia.illinois.gov/researchhub/sitemap.xml`.
4. `PARITY_STRICT=1 pnpm parity` after a fresh `generate` — must be 266/266.
5. Restore `'categories:seo': ['error', { minScore: 0.9 }]` in `lighthouserc.cjs` (is-crawlable passes once robots allows).
6. Manual accessibility pass (see below) signed off.
7. **Main-site proxy flip:** in the main website's `netlify.toml`:
   `/researchhub/* → https://copperhead-hub-20.netlify.app/researchhub/:splat (200!)`,
   and remove/disable the main site's own researchhub pages. Deploy main site.
8. Verify live: spot-check 10 URLs from `docs/parity/`, /search, one redirect from `public/_redirects`, Plausible events arriving (loader activates on the production hostname).
9. **Rollback:** revert the main-site proxy commit — one line, instant. Copperhead itself: Netlify → Deploys → publish a previous deploy.

## Manual accessibility pass (before launch; repeat quarterly)

Automated axe runs every PR; a human still verifies, per template
(home, listing grid+list, article, dataset, app, search):

- Keyboard-only walkthrough: reach and operate every control; no traps; visible focus everywhere (skip link is auto-tested).
- Screen reader (VoiceOver + Safari, NVDA + Firefox if available): landmarks, headings outline, link purpose, form labels, live-region announcements on filter/search counts.
- 200% zoom and 320px-width reflow; prefers-reduced-motion respected.
- Color-only meaning check in both themes.

## Secrets & rotation

- This site: **no runtime secrets**. Optional `NUXT_STRAPI_TOKEN` (read-only) in local `.env` / Netlify env.
- **Pre-launch rotation (from the predecessor repo's public history):** rotate the Strapi `JWT_SECRET`/admin credentials and any API tokens that existed while `ICJIA/hub-frontend` was public; revoke tokens named in its README (`API_BEARER_TOKEN`, `NUXT_API_TOKEN`, `NUXT_PREVIEW_SECRET`).
- Netlify build hook URL above is low-privilege (trigger-only) but treat as internal.

## Dependency posture

Production dependency audit: 1 low advisory (2026-07-11). Dev-chain
advisories live in build tooling only (lhci, pdf-search-index→file-type,
esbuild) — no runtime exposure; Dependabot PRs weekly (grouped
minor/patch). Note: `@icjia/pdf-search-index` should bump `file-type`
upstream.

## Known content items (tracked)

- 4 in-body article links point at old slugs (now covered by `public/_redirects`); authors may fix the markdown at leisure.
- Seeded `projects` entries carry test copy ("Sound Insulation" bullets).
- After **2026-07-31**: delete `centerhome`/`projecthome` types + pages component cleanup (`docs/cms-consolidation.md`).
