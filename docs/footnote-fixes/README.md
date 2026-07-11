# Paste-ready corrected markdown — 9 articles

**Generated:** 2026-07-11 · **Companion to:** [`../footnote-content-fixes.md`](../footnote-content-fixes.md)

Each `.md` file in this folder is the **complete corrected `markdown` field**
for one article — fetched from Strapi 5 on 2026-07-11, fixed, and validated
through the site's actual rendering pipeline (zero leaked `[^…]` markers, no
duplicate or missing definitions, every in-text reference resolves).

## How to apply (per article)

1. In Strapi admin, open **Content Manager → Article** and find the article
   (each filename is the article's slug).
2. Open the matching file here, select all, copy.
3. **Replace the entire `markdown` field** with the copied content and save
   (+ publish).

## What changed in each file

Only the footnote defects were touched — everything else is byte-identical to
the current CMS content:

| File (slug) | Change |
|---|---|
| `addressing-opioid-use-disorders…` | `[^2018]:` → the date "2018." restored |
| `what-s-next-for-infonet…` | `[^2013]:` → "2013." restored + paragraph break |
| `victimization-and-help-seeking…` | `[^015]:` → the statistic ".015." restored |
| `differences-in-recidivism…` | stray empty `[^42]:` after a DOI deleted |
| `police-use-of-discretion…` | stray empty `[^34]:` after a DOI deleted |
| `child-and-youth-exposure…` | first `[^22]:` relabeled `[^21]:` |
| `behavioral-and-public-health…` | glued duplicate after "IEMA." deleted; CDC/Weine citations split into `[^1]:`/`[^2]:` |
| `criminal-history-record-checks…` | definitions renumbered +1 from the Holzer line (`[^2]:`→`[^3]:` … `[^14]:`→`[^15]:`) |
| `developing-enhancing…` | missing `[^33]:` (Brody 2001; Ge 2002) and `[^34]:` (Ingoldsby 2006) added — **recovered from the original report PDF's endnotes**, formatted to match neighboring citations |

## After saving all nine

1. Trigger a site rebuild (Netlify build hook — `docs/runbook.md`).
2. Spot-check each article page: no literal `[^…]` text anywhere, and the
   renumbered references open the *matching* citation in the footnote toast
   (criminal-history 2/3/15, behavioral 1/2, child-and-youth 21/22).

⚠️ If an article is edited in Strapi between 2026-07-11 and when these are
applied, do **not** paste over it wholesale — apply the single change from the
table above by hand instead (exact find/replace strings are in
`../footnote-content-fixes.md`).
