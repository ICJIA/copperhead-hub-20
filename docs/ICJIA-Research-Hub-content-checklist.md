---
title: "ICJIA Research Hub — Pre-Launch Content Checklist"
subtitle: "The content still to be added in the CMS before the new Research Hub goes public"
date: "Prepared July 16, 2026 · a snapshot of the project roadmap's content items"
---

## The short version

The new Research Hub is a **complete, working draft** at the private preview address. The
engineering is built and continuously tested; what remains before it can go public is mostly
**content** — things that need to be written or uploaded in the content system (Strapi) — plus the
go-live coordination handled separately.

This is a plain-language checklist of that remaining content, for planning and assignment.

**At a glance:**

- **2 items** can be written today, no technical work needed.
- **5 items** need a small one-time change to the content system first (a new field or link), then
  content entry.
- **1 item** is a content sync at go-live.

This is a snapshot for hand-off. The live, always-current version of this list lives on the project
**roadmap** (in the app under "Roadmap", and in the code repository as `ROADMAP.md`), which is
updated as each item is completed.

---

## 1. Ready to write now — no technical work needed

A content editor can do these in the CMS today.

- [ ] **Homepage content** — author the "Hub Home" entry.
    - Adds the homepage **hero photo**, the **"Topics in Research & Analysis" image**, and the real
      **homepage headline and introduction**.
    - These are placeholders today, and the homepage is the first thing every visitor sees.

- [ ] **Project descriptions (5 project pages)** — write the real write-up for each project.
    - The five project pages currently share the same seeded placeholder text (the "Justice Counts"
      body).
    - Each project needs its own summary/description.

---

## 2. Needs a quick content-system change first, then content

For each of these, a developer makes a small one-time change in the CMS (adds a field or a
relationship); after that it is ordinary content entry.

- [ ] **Center photos** — a photo for each research center.
    - *Technical step first:* add an image field to the Center type. *Then:* upload one photo per
      center.
    - Center pages have no photo today.

- [ ] **Dataset thumbnails** — a small preview image for each dataset.
    - *Technical step first:* add an image field. *Then:* upload the thumbnails.

- [ ] **"Filter articles by center"** — connect each article to its research center.
    - *Technical step first:* add a link between centers and articles. *Then:* tag each article with
      its center.
    - This turns on the design's **"All Centers" filter** on the Articles page. (Right now a center is
      only implied by the author's name.)

- [ ] **Related Publications & Related Resources on project pages** — link each project to its related
  publications and downloadable resources.
    - *Technical step first:* add the links/fields. *Then:* fill them in per project.

- [ ] **Article "Related Content" links** — a place to add hand-picked external links on an article.
    - *Technical step first:* add the field. *Then:* fill it in where useful.
    - (Related apps and datasets already appear automatically when they are linked.)

---

## 3. At go-live — a content sync

- [ ] **Bring over newer articles** — pull in any articles published on the current live Hub since this
  draft was built, so nothing is missed at the switch-over.

---

## For context — not content (handled separately)

These remaining launch steps are **not** content and are tracked on the roadmap, listed here only so
the picture is complete: design sign-off, a live screen-reader accessibility session, the main-site
address switch-over (so `icjia.illinois.gov/researchhub/…` points at the new site), and the
search-engine settings flipped on at go-live. Separately, two obsolete internal content types
(`centerhome`, `projecthome`) are scheduled for removal after July 31, 2026.

---

*Need any row broken down further — e.g., a line per center, per project, or per dataset — or an
owner and target date added to each? The development team can expand this into a working tracker.*
