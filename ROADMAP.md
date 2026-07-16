# Roadmap — Project Copperhead

Living roadmap for the ICJIA Research Hub 2.0 public frontend. Kept current with every
substantive change: shipped work moves to **Done**, and **Next** / **Deferred** are reconciled
with each planning discussion. For the version-by-version history see [CHANGELOG.md](./CHANGELOG.md);
for the full spec see the [design/spec doc](./docs/ICJIA-Hub-20-rewrite-copperhead.md).

_Last updated: 2026-07-16 · Current version: v0.24.0_

## Done (recent)

- **In-app PDF reader with search-term highlighting** (v0.22.0) — search results that match inside a
  PDF open the document in-app with the term highlighted, match counter, prev/next.
- **Gentle view transitions** (v0.23.0) — page cross-fade, filter/Load-More card fades, centers
  Read-More reveal; all reduced-motion aware. Fixed a real bug where the centers Read-More never
  revealed content (equal-height grid clipped it).
- **Figma design-parity pass** (v0.20.0–v0.21.0) — homepage project cards as links, project bullets,
  project-detail mini-nav, centers Read-More, article "Next Article" + "More from author(s)",
  "View Resources" section, centers accordion first-open. See `docs/figma-design-audit.md`.
- **Manager-facing docs & status bar** (v0.24.0) — bottom status bar (version, repo, changelog,
  spec, roadmap), in-app rendered spec, real ICJIA footer logo, this roadmap.
- Footnote-rendering pipeline hardening + a paste-ready content-fix package for 9 articles
  (v0.19.x, in `docs/footnote-fixes/`).
- **The 9 footnote content fixes are applied to Strapi and live** (2026-07-16, via
  `scripts/apply-footnote-fixes.mjs --apply` with per-article backups in
  `docs/footnote-fixes/backups-2026-07-16/`). Verified live: zero leaked `[^…]` markers, the
  recovered values (opioid 2018, InfoNet 2013, LGBTQ p = .015), the two citations recovered from
  the original PDF (Brody/Ge, Ingoldsby), and the corrected criminal-history renumbering
  (footnote 3 = Holzer, cascading through 15).

## Next (proposed)

- **Author the `hub-home` CMS entry** — unlocks the homepage hero photo, the "Topics in R&A"
  image, and real homepage copy (currently placeholders).
- **Real copy for the five project pages** — they currently share the seeded Justice Counts body.
- **Center → article relation in Strapi** — the only way to add the design's "All Centers" articles
  filter (articles carry no center relation today; attribution lives in author names).

## Deferred (with rationale)

- **Data-page dropdown filters + grid/list toggle** — premature at 5 datasets / 13 apps; search +
  sort covers the catalog. Revisit as it grows.
- **"See Archives" section-nav button** — a launch decision; it shares the nav slot with the build
  badge and theme toggle, which change at cutover.
- **PDF reader highlight geometry on large display type** — slight horizontal drift on very large
  kerned title glyphs (body-text matches align well). Revisit only if it bothers readers.

## Blocked on CMS content (not code)

- Center photos, dataset thumbnails (no media fields yet).
- Related Publications (project detail) and Related Resources (project PDFs) — need CMS
  relations/fields.
- Article free-form "Related Content" external links — need a CMS field (app/dataset relations
  already render when populated).

## Launch coordination

- Cutover content sync (newer articles from the live Hub), live screen-reader session, design
  sign-off, main-site `/researchhub/*` proxy flip, robots / PARITY_STRICT / SEO-budget flips.
- After 2026-07-31: delete the legacy `centerhome` / `projecthome` Strapi types
  (`docs/cms-consolidation.md`).
