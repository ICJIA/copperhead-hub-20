# Figma design-parity audit — July 16, 2026

Comparison of the **READY – hub design** Figma file (`8rPKlSDC0lO5RD5sMYgxdp`, page "Working Version")
against the live Copperhead build (`copperhead-hub-20.netlify.app/researchhub/`, v0.19.4).

Scope requested: landing page, centers, articles, data, projects — "is there anything in this app
missing (or can be improved upon visually) from the figma page".

## Figma frame map (646-series = current design; 606-series = older hidden iteration)

| Frame | Node | App route |
|---|---|---|
| Homepage | 646:212 | `/` |
| Centers | 646:1704 | `/centers` |
| Major Projects | 646:1284 | `/projects` |
| Major Program 2 (project detail) | 646:2156 | `/projects/[slug]` |
| Datahub | 646:2399 | `/datasets` + `/apps` |
| Articles-Reports (listing) | 646:2841 | `/articles` |
| Articles-v2 (article detail) | 646:4085 | `/articles/[slug]` |
| Example Dashboard (dashboard detail) | 646:3695 | `/apps/[slug]` |
| Pdf-Dialog (in-page PDF viewer) | 646:4468 | — (no equivalent) |
| DialogInfo (dataset methodology modal) | 646:4074 | — (inlined in Overview instead) |
| TopNavigation (section nav + See Archives) | 646:1267 | `AppHeader.vue` section nav |
| ICJIA-V2-NOTES (designer notes, hidden layer) | 615:167 | — |

Design frames are light-mode only, 1440px reference width.

## Verdict

The build matches the design's core structure page-for-page: agency bar, breadcrumb band,
section nav, navy heroes, card grammar (badge/date/title/authors/excerpt/Read More), the
articles filter bar (chips + search + dropdowns + sort + count + grid/list toggle), Datasets|Apps
toggle pills, Load More, Stay Informed band, variables tables, Launch-dashboard control, and the
four-column footer. The gaps below are mostly secondary components and imagery.

## Gaps — code-only quick wins

> **Corrections after code review (same day):** items first listed from screenshots alone
> over-counted. The article and dataset detail pages **already render** Keywords & Tags pills
> (`KeywordsSection`), Related Content rail cards (`RelatedContentCard`), funding cards, and an
> inline citation section — all conditional, and simply empty for the entries screenshotted.
> The `/projects` cards already had the Learn More affordance. And the "All Centers" articles
> filter is **CMS-blocked, not a code gap**: Strapi 5 articles have no center relation
> (verified against the API) — center attribution only exists by convention inside `authors`,
> which the existing Authors filter already covers. Adding a real center relation is a Studio
> schema decision.

Implemented July 16, 2026 (v0.20.0):

| # | Page | Design shows | Fix shipped |
|---|---|---|---|
| 1 | Homepage projects section | Cards are links with an outlined **Learn More** button | Cards restructured to match `/projects`: stretched title link, focus ring, Learn More affordance (they were previously not links at all, despite intro copy saying "Click the tiles") |
| 2 | `/projects` cards | ✓ focus-area bullet list on each card | Bullets added (data was already in the CMS `bullets` field, and homepage cards already showed them) |
| 3 | Project detail | **"Major Projects in R&A" mini-nav** sidebar card (646:2156) | Nav card added at the top of the rail listing all projects, current page highlighted with `aria-current` |
| 4 | `/centers` cards | Short excerpt + outlined **View** button, uniform card heights | Descriptions clamp to six lines with an accessible Read More / Show Less toggle (centers have no detail pages, so in-place expansion replaces the design's View navigation) |

## Gaps — bigger enhancements (decisions taken July 16, 2026, v0.21.0)

| # | Page | Design shows | Decision |
|---|---|---|---|
| 9 | Article detail | **"Next Article >"** button in the title row | **Shipped.** Ordering rule: the listing order (newest-first), so Next = the next-older article; hidden on the last one. Computed at build from a shared summaries list — payloads carry only the slim ref |
| 10 | Article detail | **"More Articles from Author(s)"** sidebar card | **Shipped.** Up to three most-recent articles sharing at least one author, via the generalized `RelatedContentCard`. Rail reordered to the Figma order (TOC → more-from-authors → related → funding → report file) |
| 11 | Article detail + anywhere PDFs open | **Pdf-Dialog** (646:4468): in-page dark PDF viewer overlay with page nav + in-document search | **Shipped in v0.22.0** (scoped to the search path). The original deferral was wrong on two counts, corrected after the user noted the viewer existed specifically for **highlighting searched terms** inside PDFs (a Hub 1.0 capability): (a) the native browser viewer can't reliably highlight a passed-in term — only Firefox honors `#search=` — so with "all browsers matter", pdf.js is required; (b) a11y is not a blocker — pdf.js renders an accessible text layer, and rendering the reader as a **full route** rather than a modal removes the focus-trap risk entirely. Built as `/reader` (client-only, CMS-PDF-only), highlighting via the CSS Custom Highlight API. Note: highlight geometry drifts slightly on very large kerned display type (title glyphs); body-text matches align well |
| 12 | Homepage hero | Photo (gavel/book) behind the navy overlay | **Deferred — content.** The mock's photo has unknown licensing; shipping a random stand-in would misrepresent the agency. The image should arrive with the pending `hub-home` CMS entry (owned imagery), then wiring it is trivial |
| 13 | Homepage "Topics in R&A" | Photo beside the Key Focus Areas checklist | **Deferred — content.** Same licensing/ownership reasoning as the hero |
| 14 | Homepage resource tiles | Section titled "View Resources", cards with outlined **View** buttons | **Shipped.** Heading renamed, outlined View affordance added (visual only — the tile link keeps the accessible name) |
| 15 | Homepage centers accordion | First entry expanded by default with a "View center →" link visible | **Shipped.** First item opens by default; each expanded entry links to its anchored card on `/centers` (`#center-<documentId>`, `scroll-mt` offset) |
| 16 | `/datasets` `/apps` | Full dropdown filter row + grid/list toggle on the data page too | **Deferred deliberately.** With 5 datasets / 13 apps, five dropdowns add chrome, not findability; search + sort covers the catalog. Revisit when the catalog grows |

## Gaps — blocked on CMS content (not code)

- **Center photos** — design's center cards have photo headers; CMS center entries have no images (app falls back to navy gradient + icon).
- **Dataset thumbnails** — design shows imagery on dataset cards; CMS datasets have none (app shows database icon placeholder).
- **Center→article relation** — would enable the design's "All Centers" articles filter
  (646:2841); today center attribution lives only in the `authors` convention.
- **Related Publications** (project detail sidebar) and **Related Resources** (PDF cards below project body) — need CMS relations/fields.
- **Article "Related Content"** external links (e.g. IDOC data, US Census) — app/dataset
  relations already render in the rail when populated; free-form external links need a field.
- **Real project copy** — all five project pages still share the seeded Justice Counts body (known issue, waiting on content).
- **`hub-home` / `hub-overview` entries** — pending; would carry hero copy/imagery.

## Launch decision needed

- **"See Archives" button** — the design places a navy "> See Archives" button at the right end of the
  section nav on *every* page (SS: TopNavigation 646:1267). The app currently uses that slot for the
  "Copperhead build" badge + dark-mode toggle. At launch the badge goes away; decide where the
  toggle and the archives link (presumably Hub 1.0 archive) live together.

## Deliberate deviations — keep, do not "fix"

- **Language Access Request / Translate Site strip** and **Partners ˅** agency-nav item omitted —
  main-site global chrome is the main site's job at launch (documented in `AppHeader.vue`).
- **Footer link labels** differ from the mock (News vs Press, Publications vs Research, ICJIA Staff vs
  Grant Status Request) — the app's links were verified against the real main-site sitemap; the mock's
  were placeholders.
- **Stay Informed** is a button linking to ICJIA news signup rather than the design's inline email
  input — a static site has no form backend; the button is the honest version.
- **Projects as grid, not carousel** — design shows 3 cards + arrow (horizontal scroll); the app grid
  shows all five at once. Grid is the better reading experience; keep.
- **Dataset methodology inline** (Overview card) instead of the DialogInfo ⓘ modal — equivalent
  content, fewer interaction hurdles; keep unless dashboards embed where space is tight.
- **Dark mode + reference toasts + `/search` page + report-file download card** — app capabilities
  beyond the design; keep.

## Method notes (for future audits)

Figma captured via Chrome extension on the design-view editor: layer-panel rows carry node ids in
`data-testid` (`<node>-layers-panel-row`); with the **hand tool** active, plain digits are zoom
shortcuts (2 = zoom-to-selection, 0 = 100%) and click-drag pans, so full frames can be walked and
screenshotted without modifier keys — the extension drops modifiers on Figma's canvas (a bare "2"
with the **move** tool sets a selected layer's opacity to 20%; this was triggered once on the
Homepage frame and immediately reverted to 100% via the opacity input). App captured via viewcap
full-page tiles at 1072px.
