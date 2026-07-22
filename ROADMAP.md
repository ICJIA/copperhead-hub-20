# Roadmap — Project Copperhead

Living roadmap for the ICJIA Research Hub 2.0 public frontend. Kept current with every
substantive change: shipped work moves to **Done**, and **Next** / **Deferred** are reconciled
with each planning discussion. For the version-by-version history see [CHANGELOG.md](./CHANGELOG.md);
for the full spec see the [design/spec doc](./docs/ICJIA-Hub-20-rewrite-copperhead.md).

_Last updated: 2026-07-22 · Current version: v0.28.0_

## Done (recent)

- **Annotation review UX** (v0.28.0) — comment-to-highlight number badges plus a leader line on
  select, a persistent header pencil toggle for the review overlay (Clean view is never a dead end),
  and the real ICJIA logo in the top nav.
- **Manager annotations (dev preview)** (v0.27.0) — select-text highlights with public comment
  threads on every page of the private preview: name-required comments, replies, resolve/reopen,
  delete-with-confirm, a right-side drawer that reserves space (pushes content left, never overlaps),
  and Clean view. Stored in Supabase across sessions/devices. A permanent `ANNOTATIONS_ENABLED` kill
  switch tree-shakes the whole feature — and its Supabase credentials — out of the build at go-live
  (grep-verified). Spec: `docs/superpowers/specs/2026-07-21-manager-annotations-design.md`.
- **In-app roadmap page** (v0.26.0) — this roadmap now renders inside the app at `/roadmap`, from this
  same `ROADMAP.md`, so managers can read it alongside the in-app spec and the status bar. Linked from
  the bottom status bar.
- **Header build-chip accessibility fix** (v0.25.1) — the version chip's screen-reader label now
  matches its visible text (WCAG 2.5.3 Label in Name, Level A; the chip is site-wide). Surfaced while
  auditing the rebuilt reader.
- **Reader performance — lazy rendering** (v0.25.0) — the in-app PDF reader is rebuilt on pdf.js's own
  viewer components (`PDFViewer` + `PDFFindController`, the engine behind Firefox's built-in viewer):
  only the pages in (and near) view render, and pdf.js manages its worker. Long reports open to the
  first match in seconds instead of rendering every page up front; search-term highlighting is drawn
  by pdf.js's own highlight layer (no longer dependent on the CSS Custom Highlight API). The v0.24.x
  attempt that was reverted turned out to have been blocked by a background-tab rendering gate in
  testing, not a code defect — verified working in a foreground tab (22-page report, 121 matches,
  lazy render + highlight + match navigation, clean console, all six CI gates green).
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
- **Pre-launch hardening** (2026-07-16) — `/spec` and the reader empty state added to the automated
  accessibility gate (now 34 checks, light + dark); the reader *with a document loaded* was
  audited live and confirmed clean (labeled controls, `aria-live` match count, `aria-hidden`
  canvas, screen-reader text layer).
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
