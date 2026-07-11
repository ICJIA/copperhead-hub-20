# CMS consolidation — one type per concept

- **Status:** entries migrated 2026-07-11; type deletion **scheduled after 2026-07-31** (a developer is still working in the Strapi project until then)
- **Decision record:** `docs/adr/0003-content-type-consolidation.md`

## What changed (done)

The landing-page copy that lived in the singleton-style `centerhomes` and
`projecthomes` collections now lives in the `pages` collection — one
mechanism for all page furniture:

| pages entry (slug) | documentId | replaces |
|---|---|---|
| `centers` | `fjo95bt4x8zycmb2j6cnb1ne` | `centerhomes` (Herotitle/Herosubtitle → title/summary; the SAC overview text → body) |
| `projects` | `b47zruzg4qw0lkhuf73ih6c0` | `projecthomes` (Herotitle/Herosubtitle → title/summary) |

Copperhead's `/centers` and `/projects` pages read these entries via
`usePageCopy()` (fallback copy baked in, so nothing breaks if an entry is
unpublished). Note: `projecthomes.subtitle` contained copy-pasted *centers*
text ("There are five centers in R&A…") and was deliberately **not**
migrated.

## Scheduled for after 2026-07-31 (Strapi project work)

1. **Delete the `centerhome` content type** (schema + its 1 entry).
2. **Delete the `projecthome` content type** (schema + its 1 entry).
3. **Remove the homepage component fields from the `pages` type** that
   duplicate collections (`centers[]`, `projects[]` components on page
   entries) — Copperhead renders the canonical `centers`/`projects`
   collections; a page entry should not carry a second copy of that data.
   If a hand-curated "featured" list is ever wanted, add it back then as an
   explicitly-named component (e.g. `featuredProjects`).
4. Coordinate with **Hub Studio** (its data layer validates content types)
   before deploying the schema change.
5. After deletion, run a Copperhead build — it must stay green (the
   frontend never consumed the `*home` types).

## Why

- Strapi single types are the right tool for one-off page copy; the `*home`
  collections were singletons-by-convention (`?pagination[pageSize]=1`,
  take `data[0]` — undefined behavior if a second entry appears).
- One editing surface for authors: page copy lives in **Pages**, items live
  in their own collections. First-time readers of the database see one type
  per concept.
