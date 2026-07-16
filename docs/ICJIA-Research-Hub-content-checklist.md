---
title: "ICJIA Research Hub — Pre-Launch Content Checklist"
subtitle: "Item-by-item tracker of the content to add in the CMS before the new Research Hub goes public"
date: "Prepared July 16, 2026 · a snapshot of the project roadmap's content items"
---

## The short version

The new Research Hub is a **complete, working draft** at the private preview address. The engineering
is built and continuously tested; what remains before it can go public is mostly **content** to be
written or uploaded in the content system (Strapi), plus the go-live coordination handled separately.

This is an item-by-item tracker of that content — every project, center, and dataset listed by name —
so the work can be assigned and tracked. Every content item is owned by the **R&A (Research & Analysis)
unit**: the Owner column is pre-set to *R&A staff* — replace it with a specific name once assigned. Fill
in **Target** dates and mark **Done** (change ☐ to ☒) as work completes. (The one-time technical setups
listed below are the development team's, not R&A's.)

**At a glance:**

- **Write now (no technical work):** the homepage (3 pieces) and the 5 project write-ups.
- **Needs a one-time system change first, then content:** photos for 6 centers, thumbnails for 5
  datasets, "filter articles by center" (setup + tagging ~236 articles), related content on the 5
  project pages, and an optional article-links field.
- **At go-live:** one content sync.

This is a snapshot for hand-off; the always-current version is the project **roadmap** (in the app
under "Roadmap", and in the code repository as `ROADMAP.md`).

> **One-time technical setups (for the development team).** A few items below can't be started until a
> small, one-time change is made in the content system. Collected here for the developers: (1) an image
> field on Center; (2) an image field on Dataset; (3) a Center ↔ Article link; (4) Related Publications
> / Related Resources on Project; (5) a "Related Content" links field on Article. Each is flagged below
> where it applies.

---

## 1. Ready to write now — no technical work needed

### 1a. Homepage — author the "Hub Home" entry

Adds the homepage hero photo, the "Topics in Research & Analysis" image, and the real homepage headline
and introduction (all placeholders today). The homepage is the first thing every visitor sees.

| Piece | Owner | Target | Done |
|---|---|---|---|
| Hero photo | R&A staff | | ☐ |
| "Topics in Research & Analysis" image | R&A staff | | ☐ |
| Homepage headline + introduction copy | R&A staff | | ☐ |

### 1b. Project write-ups (5)

Each project page needs its own real description; today all five share the same seeded placeholder text.

| Project | Owner | Target | Done |
|---|---|---|---|
| Justice Counts Implementation Program | R&A staff | | ☐ |
| Restore, Reinvest, Renew (R3) | R&A staff | | ☐ |
| Deaths in Custody | R&A staff | | ☐ |
| Illinois Uniform Crime Report | R&A staff | | ☐ |
| Violence Prevention Research | R&A staff | | ☐ |

---

## 2. Needs a one-time system change first, then content

### 2a. Center photos (6) — *setup: image field on Center*

One photo per research center (center pages have none today).

| Center | Owner | Target | Done |
|---|---|---|---|
| Center for Community Corrections Research | R&A staff | | ☐ |
| Center for Criminal Justice Data and Analytics | R&A staff | | ☐ |
| Center for Justice Research and Evaluation | R&A staff | | ☐ |
| Center for Sponsored Research & Program Development | R&A staff | | ☐ |
| Center for Victim Studies | R&A staff | | ☐ |
| Center for Violence Prevention and Intervention Research | R&A staff | | ☐ |

### 2b. Dataset thumbnails (5) — *setup: image field on Dataset*

A small preview image per dataset.

| Dataset | Owner | Target | Done |
|---|---|---|---|
| Death in Custody Reports | R&A staff | | ☐ |
| Illinois Juvenile Justice Data Dashboard | R&A staff | | ☐ |
| Illinois Uniform Crime Reports (UCR) Index Crime Offense | R&A staff | | ☐ |
| Illinois Uniform Crime Reports (UCR) Index Crime Arrest | R&A staff | | ☐ |
| Illinois Uniform Crime Reports (UCR) Hate Crime Offense | R&A staff | | ☐ |

### 2c. "Filter articles by center" — *setup: Center ↔ Article link*

Turns on the design's "All Centers" filter on the Articles page. Once the link exists, each published
article is tagged with its center. This is a bulk editorial pass (~236 published articles) and can be
split among editors.

| Task | Owner | Target | Done |
|---|---|---|---|
| Tag published articles with their center (~236 articles) | R&A staff | | ☐ |

### 2d. Related Publications & Resources on project pages (5) — *setup: relations/fields on Project*

Link each project to its related publications and downloadable resources.

| Project | Owner | Target | Done |
|---|---|---|---|
| Justice Counts Implementation Program | R&A staff | | ☐ |
| Restore, Reinvest, Renew (R3) | R&A staff | | ☐ |
| Deaths in Custody | R&A staff | | ☐ |
| Illinois Uniform Crime Report | R&A staff | | ☐ |
| Violence Prevention Research | R&A staff | | ☐ |

### 2e. Article "Related Content" links — *setup: field on Article*

An optional place to add hand-picked external links on an article. Populate where useful (related apps
and datasets already appear automatically when they are linked).

| Task | Owner | Target | Done |
|---|---|---|---|
| Add "Related Content" links where useful (as needed) | R&A staff | | ☐ |

---

## 3. At go-live — content sync

| Task | Owner | Target | Done |
|---|---|---|---|
| Bring over any articles published on the live Hub since this draft was built | R&A staff | | ☐ |

---

## For context — not content (handled separately)

These remaining launch steps are **not** content and are tracked on the roadmap, listed only so the
picture is complete: design sign-off, a live screen-reader accessibility session, the main-site address
switch-over (so `icjia.illinois.gov/researchhub/…` points at the new site), and the search-engine
settings turned on at go-live. Two obsolete internal content types (`centerhome`, `projecthome`) are
scheduled for removal after July 31, 2026.

---

*Project, center, and dataset names are pulled from the live content system as of July 16, 2026. Want
Target dates added, or the ~236-article tagging pass split into assignable batches? The
development team can adjust this tracker.*
