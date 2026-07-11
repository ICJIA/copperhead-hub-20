# ADR 0001 — Phase 0 architecture baseline

- **Status:** accepted
- **Date:** 2026-07-11
- **Context:** Rewrite plan (`docs/ICJIA-Hub-20-rewrite-copperhead.md`), Sections 8–9

## Decisions

1. **Nuxt `~4.4.8`** (tilde-pinned to the 4.4.x line — the plan's target; 4.4.8 is the current latest and includes the 4.4.7 security hotfix the predecessor repo never merged). Minor-version moves are deliberate decisions, not drive-by upgrades.
2. **Nuxt UI `^4.9.0`**, Tailwind 4, semantic tokens only — components never hardcode colors; the Figma palette lands in `app/app.config.ts` + `@theme` in Phase 2.
3. **TypeScript strict, everywhere.** No `.js` application code. TypeScript 7 (native compiler) with `vue-tsc` 3 for template-aware checking via `nuxt typecheck`.
4. **`app.baseURL = '/researchhub/'`** from the first commit — the URL-parity contract is structural, not a launch-week patch.
5. **Static generation only** (`nuxt generate`); the deployed artifact is `.output/public`. No runtime server routes, no runtime secrets. Builds require **zero environment variables** in Phase 0 and at most one read-only token from Phase 1 on.
6. **Quality gates in CI from day one**, all blocking: ESLint, `nuxt typecheck`, Vitest unit tests, axe-core WCAG 2.1 A/AA (Playwright, against the generated artifact, on real routes), Lighthouse budgets (perf ≥ 0.9, a11y = 1.0, best-practices ≥ 0.9, SEO ≥ 0.9).
7. **Preview stays out of search**: `public/robots.txt` disallows all crawling until launch; Phase 4 owns the flip (robots, sitemap, canonicals).
8. **pnpm** with a committed lockfile; `--frozen-lockfile` in CI; Node 22 via `.nvmrc`.

## Consequences

- Every later phase inherits enforced accessibility and performance floors; regressions fail PRs instead of reaching review.
- The a11y suite's route list must be extended as pages land (real slugs or fixtures — never `[slug]` placeholders).
- Anything requiring a runtime server (proxies, preview endpoints) is architecturally out of scope; authoring/preview belongs to Hub Studio.
