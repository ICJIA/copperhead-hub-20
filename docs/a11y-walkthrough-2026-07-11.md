# Accessibility walkthrough — July 11, 2026

Manual-procedure walkthrough per `docs/runbook.md`, executed with a
driven browser (`scripts/a11y-walkthrough.mjs`) so it is repeatable.
Complements the per-PR axe suite (30 checks) — this pass covers what
axe cannot: keyboard operability with visible focus, reflow, motion,
and live-region behavior.

## Scope

9 templates × 2 color schemes (18 page-passes): home, articles listing
(grid + list views), article detail, dataset detail, app detail,
centers, projects, search (with an active query).

Checks per pass: landmark uniqueness and labeling; single-h1 outline;
60-stop keyboard walk asserting every focus stop is interactive and
carries a **visible focus indicator** (element or ancestor ring), with
tab-trap detection; **320px reflow** (WCAG 1.4.10) with offending-element
attribution; `aria-live` presence on dynamic counts; accordion keyboard
operability (Enter toggles `aria-expanded`).

## Findings and resolutions

| # | Finding | Resolution |
|---|---|---|
| 1 | **320px reflow failure on 16 page-passes** — the header's section-nav row did not wrap; content forced ~354px of horizontal page scroll | Nav wraps; the link row scrolls horizontally within its own container at narrow widths; right-side controls pinned (`AppHeader.vue`) |
| 2 | **320px reflow on dataset/article/app/project detail** — the two-column grid had no base column template, so wide children (variables table) forced the implicit column past the viewport | `grid-cols-1` base template (clamps to `minmax(0,1fr)`) on all four detail grids |
| 3 | **CMS markdown tables** overflowed the page at 320px on article bodies | `.article-body table` scrolls within its own box (`display:block; overflow-x:auto`) |
| 4 | **"Launch {long app title}" button** could not wrap at 320px (437px wide) | Visible label "Launch dashboard"; the full app title moved to `aria-label` (also improves link purpose out of context) |
| 5 | `prefers-reduced-motion` not honored | Global reduced-motion guard in `main.css` (all motion on the site is decorative) |
| 6 | Checker false-positives: card title links use the stretched-link pattern with the focus ring on the **card** | Confirmed the ancestor ring renders (visible indicator satisfied); checker made ancestor-aware. Pattern kept |

Final state: **walkthrough clean — zero findings** across all 18
page-passes. Keyboard traps: none. Accordion: operable. Live regions:
present on listing and search counts.

## Same-day deploy fixes (found via user testing of the preview)

- `@nuxt/image` pinned to `ipxStatic`: on Netlify the module auto-switched
  to Netlify's runtime Image CDN, which 400'd every card image (remote
  domain unauthorized). The deployed artifact is now byte-identical to the
  locally tested one.
- Icon CDN fallback disabled (`fallbackToApi: false`) and the color-mode
  toggle's dynamically-bound icons pinned into the client bundle — the
  runtime fetch to `api.iconify.design` violated the CSP.
- Verified in a fresh browser profile: **light mode is the default** for
  new visitors (`<html class="light">`); dark mode is a persisted user
  choice via the header toggle; zero external requests on page load.

## Residual human steps (launch checklist)

A live screen-reader session (VoiceOver/Safari; NVDA/Firefox if
available) across the same templates — semantics are verified here, but
spoken UX (announcement phrasing, reading order feel) needs ears.
Repeat this walkthrough script plus the SR session quarterly post-launch.
