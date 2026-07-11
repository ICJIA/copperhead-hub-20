# ADR 0003 — One content type per concept (retire the *home singletons)

- **Status:** accepted (entries migrated; type deletion scheduled after 2026-07-31)
- **Date:** 2026-07-11
- **Context:** `docs/cms-consolidation.md`

## Decision

1. `centers` and `projects` remain the only content types for their
   concepts — one entry per center/project, canonical everywhere.
2. Landing-page copy (previously the `centerhomes`/`projecthomes`
   singleton collections) lives in the `pages` collection, one entry per
   route (`centers`, `projects`, `hub-home`, …). Copperhead reads it via
   `usePageCopy(slug, fallback)` — fallback until authored, live once
   published, no code change to swap.
3. The `pages` type's embedded `centers[]`/`projects[]` components are
   scheduled for removal — no second copies of collection data.

## Consequences

- Anyone reading the database sees one type per concept; no
  `pageSize=1` singleton conventions to discover.
- Page furniture is uniformly author-editable in one place (Pages).
- Until the scheduled deletion, the `*home` types still exist but nothing
  reads them; content entered there will NOT appear on the site.
