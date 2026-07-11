# ADR 0002 — Content layer (Strapi 5, build-time, tokenless)

- **Status:** accepted
- **Date:** 2026-07-11
- **Context:** Rewrite plan Sections 8–9 (Phase 1); ADR 0001

## Decisions

1. **REST over GraphQL.** The typed service (`app/utils/content.ts`) uses Strapi's REST API with `populate=*` — fewer moving parts than a GraphQL client, and the normalization layer makes response shape a single-point concern anyway.
2. **Tokenless by default, optional bearer.** The Strapi 5 public role currently permits reading published content on all seven collections (verified 2026-07-11). `NUXT_STRAPI_TOKEN` is supported but optional: attached server-side only, empty default in `runtimeConfig`, value only ever from env (`.env` locally — gitignored — and Netlify UI/CI secrets if the public role is later locked).
3. **One normalization boundary** (`app/utils/normalize.ts`). Everything downstream sees domain models (`app/types/content.ts`); raw quirks absorbed in one file: relative `/uploads` URLs absolutized, PascalCase project/center fields mapped, `{title, description}` author components → `{name, bio}`, CMS presentation hints (`headerBg`, `icon`) quarantined as `*Raw` fields never bound as classes.
4. **Pagination to completion.** List fetches loop all pages (100/page) — the predecessor silently capped at 50/100 (defect A.5 #9).
5. **Real 404 semantics.** Missing slugs throw `createError({ statusCode: 404 })`, enabling prerendered 404s (predecessor threw generic `Error`, defect A7).
6. **One markdown pipeline** (`app/utils/markdown.ts`): `marked` 18 (per-render instance) + `marked-footnote` + isomorphic DOMPurify sanitization, heading ids with collision suffixes, h2 TOC extraction, `rel="noopener noreferrer"` forced on `target=_blank`. No unsanitized `v-html` anywhere (defects S6/P8, minors #15/27).
7. **Fixtures, not mocks** (`tests/fixtures/*.json` via `scripts/update-fixtures.mjs`): unit tests run against committed live-API snapshots — offline, deterministic, diff-reviewable.

## Known content gaps (for Phase 2 planning)

- The `pages` collection contains a single `test` entry; the real `hub-home`, `hub-overview`, and `dicra` pages must be authored in Strapi/Hub Studio before the generic page route can reach parity.
- Datasets: 5 published (26 existed at migration; remainder presumably drafts). Apps include `status: "archived"` entries — listing pages must decide presentation, not the data layer.

## Consequences

- `pnpm generate` requires CMS reachability (content is build input); tests do not. CMS outage blocks deploys but never breaks CI.
- Client-side navigation in dev fetches tokenless from the browser — acceptable while public reads are open; production static pages carry embedded payloads and never fetch.
