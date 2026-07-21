# Manager Annotations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Select-text annotations with persistent, public comment threads (name required, replies, resolve, delete) on every page of the Copperhead dev site, stored in Supabase, with a studio-identical review toolbar and a permanent build-time kill switch.

**Architecture:** Port copperhead-studio-20's annotation stack (anchor / paint / composer-position / Bar / Composer / Rail) nearly verbatim behind its 5-method `AnnotationStore` seam; add one new `store-supabase.ts` adapter (plain PostgREST via `$fetch`), a global client-only `AnnotationLayer` orchestrator mounted from the default layout, keyed by normalized route path. Spec: `docs/superpowers/specs/2026-07-21-manager-annotations-design.md`.

**Tech Stack:** Nuxt 4 (static generate), Nuxt UI 4, Tailwind 4, TypeScript strict, vitest (+ happy-dom for DOM tests), Playwright + axe. Supabase = raw PostgREST REST; **no new runtime npm dependencies**.

## Global Constraints

- **No new runtime dependencies.** Only devDependency allowed: `happy-dom@^20.10.6` (DOM unit tests).
- **Studio source of truth for ports:** `/Volumes/satechi/webdev/copperhead-studio-20` (read-only — never modify that repo).
- **Supabase (already provisioned & smoke-tested):** url `https://efgevsdftkrancswojcz.supabase.co`, table `public.copperhead_annotations`, publishable key `sb_publishable_xYEjTCTxp-UaYGsFQMay6g_HA7BM9cn`, auth = `apikey` header only. RLS is enabled with deliberately open anon policies. The migration `create_copperhead_annotations` is already applied — do NOT re-create the table.
- **Colors:** orange `#fed7aa`/`#f97316`, violet `#ddd6fe`/`#8b5cf6`, teal `#99f6e4`/`#14b8a6`, lime `#d9f99d`/`#84cc16` (background/underline). Mark ink `#111827` in both color modes. Accent `#1d4ed8`.
- **Component dir is `app/components/annotation/` (singular)** so Nuxt's path-prefix dedupe yields `<AnnotationBar>` etc. (repo precedent: `components/article/ArticleBody.vue` → `<ArticleBody>`).
- **Commit messages:** conventional prefix, descriptive body, **no AI attribution trailers of any kind**.
- **Package manager:** pnpm. Run commands from `/Volumes/satechi/webdev/copperhead-20`.
- All new UI copy uses sentence case ("Show review tools", not "Show Review Tools").
- Comment bodies and names are ALWAYS rendered via Vue interpolation — never `v-html`.

---

### Task 1: Config foundation — hub.config annotations block, CSP, domain types, test infra

**Files:**
- Modify: `hub.config.mjs` (add `annotations` block before the closing `}` of `hub`, after `analytics`)
- Modify: `netlify.toml:47` (CSP `connect-src`)
- Create: `app/types/annotations.ts`
- Modify: `vitest.config.ts` (add `~` alias so ported studio code/tests resolve)
- Modify: `package.json` via `pnpm add -D happy-dom@^20.10.6`
- Modify: `docs/superpowers/specs/2026-07-21-manager-annotations-design.md` (fill the key placeholder)

**Interfaces:**
- Consumes: nothing.
- Produces: `hub.annotations.{enabled, supabase.{url, publishableKey, table}}`; types `AnnotationColor`, `ANNOTATION_COLORS`, `AnnotationAnchor`, `AnnotationComment`, `PageAnnotation`, `NewPageAnnotation`, `AnnotationStore`, `RailThread` from `~/types/annotations`. Every later task imports these.

- [ ] **Step 1: Add the `annotations` block to `hub.config.mjs`**

Insert after the `analytics: { ... },` block (before the closing `}` of `export const hub`):

```js
  annotations: {
    /**
     * Manager review annotations (spec: docs/superpowers/specs/
     * 2026-07-21-manager-annotations-design.md). KILL SWITCH: set
     * `enabled: false` before go-live — the layer, its CSS, and every
     * Supabase reference drop out of the build. Also remove the Supabase
     * origin from netlify.toml connect-src (runbook in README).
     */
    enabled: true,
    supabase: {
      /** Project "holdem-simulator" (efgevsdftkrancswojcz), us-east-1. */
      url: 'https://efgevsdftkrancswojcz.supabase.co',
      /** Publishable key — safe to commit by design (it ships in the client
       *  bundle regardless); the RLS policies are the security boundary. */
      publishableKey: 'sb_publishable_xYEjTCTxp-UaYGsFQMay6g_HA7BM9cn',
      table: 'copperhead_annotations',
    },
  },
```

- [ ] **Step 2: Add the Supabase origin to the CSP**

In `netlify.toml`, in the `Content-Security-Policy` value, change

```
connect-src 'self' https://v2.hub.icjia-api.cloud https://plausible.icjia.cloud;
```

to

```
connect-src 'self' https://v2.hub.icjia-api.cloud https://plausible.icjia.cloud https://efgevsdftkrancswojcz.supabase.co;
```

Also update the CSP comment block above it: add the line `# - connect-src allows the Supabase origin for manager annotations (removed at go-live — see README runbook).`

- [ ] **Step 3: Create `app/types/annotations.ts`**

```ts
// Manager-annotation domain model + the storage seam. Ported from
// copperhead-studio-20 (types/annotations.ts) with the studio's
// (contentType, documentId) keying collapsed to a single pagePath and all
// auth-derived attribution reduced to a required authorName.

export const ANNOTATION_COLORS = ['orange', 'violet', 'teal', 'lime'] as const
export type AnnotationColor = (typeof ANNOTATION_COLORS)[number]

/** W3C-style text-quote anchor over the container's concatenated text-node content. */
export interface AnnotationAnchor {
  exact: string   // the highlighted text (≤ 1000 chars)
  prefix: string  // ≤ 32 chars of container text before `exact`
  suffix: string  // ≤ 32 chars after
  offset: number  // char offset of `exact` at capture time (disambiguation hint)
}

export interface AnnotationComment {
  id: string
  body: string          // plain text — rendered via Vue interpolation ONLY
  authorName: string    // required ("name or initials")
  createdAt: string     // ISO 8601
}

export interface PageAnnotation {
  id: string
  pagePath: string      // normalized route path, e.g. '/articles/foo'
  anchor: AnnotationAnchor
  color: AnnotationColor
  resolved: boolean
  createdAt: string
  authorName: string    // thread creator = comments[0].authorName
  comments: AnnotationComment[]  // comments[0] is the initial note; the rest are replies
}

/** PageAnnotation minus the server-assigned fields. */
export type NewPageAnnotation = Omit<PageAnnotation, 'id' | 'createdAt'>

/** Storage seam (studio parity): one adapter — Supabase PostgREST. */
export interface AnnotationStore {
  list(pagePath: string): Promise<PageAnnotation[]>
  create(a: NewPageAnnotation): Promise<PageAnnotation>
  addComment(id: string, c: AnnotationComment): Promise<PageAnnotation>
  setResolved(id: string, resolved: boolean): Promise<PageAnnotation>
  remove(id: string): Promise<void>
}

/** A rail entry: an annotation plus its resolution state in the CURRENT render.
 *  (Lives here, not in the SFC — `<script setup>` cannot have named exports.) */
export interface RailThread {
  annotation: PageAnnotation
  orphan: boolean         // quote no longer found in the rendered text
  start: number | null    // resolved char offset (document order); null when orphaned
}
```

- [ ] **Step 4: Add the `~` alias to `vitest.config.ts`** (replace the whole file)

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Match Nuxt's `~` → app/ alias so ported studio modules and their
    // tests resolve identically here and in the app build.
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
  test: {
    // Unit tests only — Playwright owns tests/a11y/**.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 5: Install happy-dom**

Run: `pnpm add -D happy-dom@^20.10.6`
Expected: package.json devDependencies gains `"happy-dom": "^20.10.6"`.

- [ ] **Step 6: Fill the spec's key placeholder**

In `docs/superpowers/specs/2026-07-21-manager-annotations-design.md`, replace `publishableKey: '<filled at implementation>'` with `publishableKey: 'sb_publishable_xYEjTCTxp-UaYGsFQMay6g_HA7BM9cn',` (keep surrounding lines).

- [ ] **Step 7: Verify**

Run: `pnpm typecheck && pnpm test`
Expected: typecheck passes; the 5 existing unit test files pass unchanged.

- [ ] **Step 8: Commit**

```bash
git add hub.config.mjs netlify.toml app/types/annotations.ts vitest.config.ts package.json pnpm-lock.yaml docs/superpowers/specs/2026-07-21-manager-annotations-design.md
git commit -m "feat(annotations): config flag, Supabase values, domain types, test infra"
```

---

### Task 2: Page-path normalization (TDD)

**Files:**
- Create: `tests/unit/annotations-page-path.test.ts`
- Create: `app/lib/annotations/page-path.ts`

**Interfaces:**
- Consumes: `hub.site.baseURL` from `hub.config.mjs`.
- Produces: `normalizePagePath(path: string): string` — used by `useAnnotations` (Task 8) and `AnnotationLayer` (Task 13).

- [ ] **Step 1: Write the failing test**

`tests/unit/annotations-page-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizePagePath } from '../../app/lib/annotations/page-path'

describe('normalizePagePath', () => {
  it('passes through a clean route path', () => {
    expect(normalizePagePath('/articles/foo')).toBe('/articles/foo')
  })
  it('strips the site baseURL when present', () => {
    expect(normalizePagePath('/researchhub/articles/foo')).toBe('/articles/foo')
    expect(normalizePagePath('/researchhub/')).toBe('/')
    expect(normalizePagePath('/researchhub')).toBe('/')
  })
  it('does not strip a lookalike prefix', () => {
    expect(normalizePagePath('/researchhubs/foo')).toBe('/researchhubs/foo')
  })
  it('strips trailing slashes except on root', () => {
    expect(normalizePagePath('/articles/foo/')).toBe('/articles/foo')
    expect(normalizePagePath('/')).toBe('/')
  })
  it('drops query and hash', () => {
    expect(normalizePagePath('/search?q=x#top')).toBe('/search')
  })
  it('coerces empty input to root', () => {
    expect(normalizePagePath('')).toBe('/')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/annotations-page-path.test.ts`
Expected: FAIL — cannot resolve `../../app/lib/annotations/page-path`.

- [ ] **Step 3: Implement `app/lib/annotations/page-path.ts`**

```ts
// One page = one thread namespace. Annotations key on the route path with
// the baseURL stripped, so the same page shares threads on localhost, the
// Netlify preview origin, and the production proxy (URL-parity contract).
import { hub } from '../../../hub.config.mjs'

export function normalizePagePath(path: string): string {
  let p = (path || '/').split('#')[0]!.split('?')[0]!
  const base = hub.site.baseURL.replace(/\/+$/, '') // '/researchhub'
  if (base && (p === base || p.startsWith(`${base}/`))) p = p.slice(base.length)
  if (!p.startsWith('/')) p = `/${p}`
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p === '' ? '/' : p
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/annotations-page-path.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add app/lib/annotations/page-path.ts tests/unit/annotations-page-path.test.ts
git commit -m "feat(annotations): page-path normalization keyed to URL parity"
```

---

### Task 3: Anchor module — verbatim studio port with its test suite

**Files:**
- Create: `app/lib/annotations/anchor.ts` (copy from studio)
- Create: `tests/unit/annotations-anchor.test.ts` (copy from studio)

**Interfaces:**
- Consumes: `AnnotationAnchor` from `~/types/annotations` (Task 1).
- Produces: `textContentOf(container: Element): string`, `captureAnchor(container: Element, range: Range): CaptureResult` where `CaptureResult = { ok: true; anchor: AnnotationAnchor } | { ok: false; reason: 'empty' | 'outside' | 'katex' | 'too-long' }`, `rangeFromOffsets(container, start, end): Range | null`, `resolveAnchor(container, anchor): { start: number; end: number } | null`, constants `MAX_EXACT_LENGTH = 1000`, `CONTEXT_LENGTH = 32`. Used by Tasks 4 (indirectly), 13.

- [ ] **Step 1: Copy the module and its tests verbatim**

```bash
cp /Volumes/satechi/webdev/copperhead-studio-20/app/lib/annotations/anchor.ts app/lib/annotations/anchor.ts
cp /Volumes/satechi/webdev/copperhead-studio-20/tests/unit/annotations-anchor.test.ts tests/unit/annotations-anchor.test.ts
```

No edits needed: the module imports only `~/types/annotations` (whose `AnnotationAnchor` is identical here), and the test file starts with `// @vitest-environment happy-dom` and imports `~/lib/annotations/anchor` — both resolve via the Task 1 alias. The `.katex` guard is retained deliberately (harmless; CMS bodies could contain rendered math).

- [ ] **Step 2: Run the ported suite**

Run: `pnpm vitest run tests/unit/annotations-anchor.test.ts`
Expected: PASS (the studio suite: textContentOf / captureAnchor / rangeFromOffsets / resolveAnchor cases).

- [ ] **Step 3: Verify whole unit suite + typecheck still green**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/lib/annotations/anchor.ts tests/unit/annotations-anchor.test.ts
git commit -m "feat(annotations): port studio text-quote anchor module + tests"
```

---

### Task 4: Paint module — verbatim studio port + idempotence test

**Files:**
- Create: `app/lib/annotations/paint.ts` (copy from studio)
- Create: `tests/unit/annotations-paint.test.ts` (new)

**Interfaces:**
- Consumes: `AnnotationColor` (Task 1).
- Produces: `paintOffsets(container: Element, start: number, end: number, id: string, color: AnnotationColor): HTMLElement[]`, `clearAnnotations(container: Element): void`. Used by Task 13.

- [ ] **Step 1: Copy the module**

```bash
cp /Volumes/satechi/webdev/copperhead-studio-20/app/lib/annotations/paint.ts app/lib/annotations/paint.ts
```

No edits: it imports only `AnnotationColor` from `~/types/annotations`; color names are type-level, not hardcoded.

- [ ] **Step 2: Write the failing test** — `tests/unit/annotations-paint.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from 'vitest'
import { paintOffsets, clearAnnotations } from '~/lib/annotations/paint'
import { textContentOf } from '~/lib/annotations/anchor'

let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  container.innerHTML = '<p>The quick <strong>brown</strong> fox jumps.</p>'
  document.body.appendChild(container)
})

describe('paintOffsets', () => {
  it('wraps the span in mark elements with id, color, and a11y attributes', () => {
    const text = textContentOf(container)
    const start = text.indexOf('quick brown')
    const marks = paintOffsets(container, start, start + 'quick brown'.length, 'a1', 'teal')
    expect(marks.length).toBeGreaterThan(0)
    for (const m of marks) {
      expect(m.tagName).toBe('MARK')
      expect(m.className).toBe('ann ann--teal')
      expect(m.dataset.annId).toBe('a1')
      expect(m.getAttribute('tabindex')).toBe('0')
      expect(m.getAttribute('role')).toBe('button')
    }
    expect(container.querySelectorAll('mark[data-ann-id="a1"]').length).toBe(marks.length)
  })
  it('never changes the container text', () => {
    const before = textContentOf(container)
    paintOffsets(container, 4, 15, 'a1', 'orange')
    expect(textContentOf(container)).toBe(before)
  })
})

describe('clearAnnotations', () => {
  it('paint → clear restores the original DOM text and removes all marks', () => {
    const before = textContentOf(container)
    paintOffsets(container, 4, 15, 'a1', 'lime')
    clearAnnotations(container)
    expect(container.querySelectorAll('mark[data-ann-id]').length).toBe(0)
    expect(textContentOf(container)).toBe(before)
  })
  it('paint → clear → paint at the same offsets works (idempotence)', () => {
    const text = textContentOf(container)
    const start = text.indexOf('fox')
    paintOffsets(container, start, start + 3, 'a1', 'violet')
    clearAnnotations(container)
    const marks = paintOffsets(container, start, start + 3, 'a2', 'violet')
    expect(marks.length).toBe(1)
    expect(marks[0]!.textContent).toBe('fox')
  })
})
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run tests/unit/annotations-paint.test.ts`
Expected: PASS immediately (the implementation was copied in Step 1 — this test pins the ported behavior; if anything fails, the copy went wrong).

- [ ] **Step 4: Commit**

```bash
git add app/lib/annotations/paint.ts tests/unit/annotations-paint.test.ts
git commit -m "feat(annotations): port studio mark-painting module, pin with tests"
```

---

### Task 5: Composer-position module — port with a larger clamp footprint

**Files:**
- Create: `app/lib/annotations/composer-position.ts` (copy, one constant change)
- Create: `tests/unit/annotations-composer-position.test.ts` (new)

**Interfaces:**
- Consumes: nothing.
- Produces: `composerPosition(opts: { desired: {x,y}; viewport: {width,height}; container: ComposerContainerRect | null }): { left: number; top: number }`. Used by Task 11.

- [ ] **Step 1: Copy and adjust**

```bash
cp /Volumes/satechi/webdev/copperhead-studio-20/app/lib/annotations/composer-position.ts app/lib/annotations/composer-position.ts
```

Then edit the constants block: change `const CLAMP_H = 220` to `const CLAMP_H = 260` and update its doc comment to:

```ts
/** Popover footprint used for clamping: w-80 (320px) + 16px gutter; ~244px tall
 *  (the copperhead composer adds a required name field above the textarea) + 16px gutter. */
```

- [ ] **Step 2: Write the test** — `tests/unit/annotations-composer-position.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { composerPosition } from '../../app/lib/annotations/composer-position'

const viewport = { width: 1280, height: 800 }

describe('composerPosition', () => {
  it('returns the desired point when it fits', () => {
    expect(composerPosition({ desired: { x: 100, y: 200 }, viewport, container: null }))
      .toEqual({ left: 100, top: 200 })
  })
  it('clamps the right edge so the popover never clips (336px footprint)', () => {
    const { left } = composerPosition({ desired: { x: 1200, y: 200 }, viewport, container: null })
    expect(left).toBe(1280 - 336)
  })
  it('clamps the bottom edge with the 260px footprint', () => {
    const { top } = composerPosition({ desired: { x: 100, y: 780 }, viewport, container: null })
    expect(top).toBe(800 - 260)
  })
  it('respects a containing block and converts into its coordinate space', () => {
    const container = { left: 100, top: 50, right: 700, bottom: 600 }
    const pos = composerPosition({ desired: { x: 690, y: 590 }, viewport, container })
    expect(pos.left).toBe(700 - 336 - 100)
    expect(pos.top).toBe(600 - 260 - 50)
  })
})
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run tests/unit/annotations-composer-position.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/lib/annotations/composer-position.ts tests/unit/annotations-composer-position.test.ts
git commit -m "feat(annotations): port composer clamp math (taller name-field footprint)"
```

---

### Task 6: Local prefs — remembered name + last color (TDD)

**Files:**
- Create: `tests/unit/annotations-prefs.test.ts`
- Create: `app/lib/annotations/prefs.ts`

**Interfaces:**
- Consumes: `ANNOTATION_COLORS`, `AnnotationColor` (Task 1).
- Produces: `createAnnotationPrefs(storage?: Storage | null): AnnotationPrefs` and singleton `annotationPrefs`; `AnnotationPrefs = { getName(): string; setName(n: string): void; getColor(): AnnotationColor | null; setColor(c: AnnotationColor): void }`. Used by Tasks 11, 12, 13.

- [ ] **Step 1: Write the failing test** — `tests/unit/annotations-prefs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createAnnotationPrefs } from '../../app/lib/annotations/prefs'

function fakeStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size },
  } as Storage
}

function throwingStorage(): Storage {
  return {
    getItem: () => { throw new Error('denied') },
    setItem: () => { throw new Error('quota') },
    removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage
}

describe('annotation prefs', () => {
  it('round-trips the name through storage', () => {
    const s = fakeStorage()
    createAnnotationPrefs(s).setName('CS')
    expect(createAnnotationPrefs(s).getName()).toBe('CS')
  })
  it('round-trips a valid color and rejects junk', () => {
    const s = fakeStorage()
    const prefs = createAnnotationPrefs(s)
    prefs.setColor('violet')
    expect(prefs.getColor()).toBe('violet')
    s.setItem('copperhead-annotations-ui-v1:color', 'chartreuse')
    expect(prefs.getColor()).toBeNull()
  })
  it('degrades to in-memory when storage throws (private windows)', () => {
    const prefs = createAnnotationPrefs(throwingStorage())
    prefs.setName('KB')
    expect(prefs.getName()).toBe('KB')
  })
  it('works with no storage at all (SSR)', () => {
    const prefs = createAnnotationPrefs(null)
    expect(prefs.getName()).toBe('')
    prefs.setName('X')
    expect(prefs.getName()).toBe('X')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/annotations-prefs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/lib/annotations/prefs.ts`**

```ts
// UI preferences for the annotation tool: remembered reviewer name and
// last-used swatch. A distinct "-ui-v1" prefix (studio precedent) keeps
// preferences visually separate from any data keys. Storage failures
// (private windows, quota) degrade silently to in-memory so the tool keeps
// working for the session.
import { ANNOTATION_COLORS, type AnnotationColor } from '~/types/annotations'

const NAME_KEY = 'copperhead-annotations-ui-v1:name'
const COLOR_KEY = 'copperhead-annotations-ui-v1:color'

export interface AnnotationPrefs {
  getName(): string
  setName(name: string): void
  getColor(): AnnotationColor | null
  setColor(color: AnnotationColor): void
}

export function createAnnotationPrefs(storage?: Storage | null): AnnotationPrefs {
  const memory = new Map<string, string>()
  function read(key: string): string {
    try { return storage?.getItem(key) ?? memory.get(key) ?? '' }
    catch { return memory.get(key) ?? '' }
  }
  function write(key: string, value: string): void {
    memory.set(key, value)
    try { storage?.setItem(key, value) } catch { /* preference only */ }
  }
  return {
    getName: () => read(NAME_KEY),
    setName: (name) => write(NAME_KEY, name),
    getColor: () => {
      const c = read(COLOR_KEY)
      return (ANNOTATION_COLORS as readonly string[]).includes(c) ? (c as AnnotationColor) : null
    },
    setColor: (c) => write(COLOR_KEY, c),
  }
}

/** App-wide instance over window.localStorage (guarded for SSR). */
export const annotationPrefs: AnnotationPrefs = createAnnotationPrefs(
  typeof window === 'undefined' ? null : window.localStorage,
)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/annotations-prefs.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/lib/annotations/prefs.ts tests/unit/annotations-prefs.test.ts
git commit -m "feat(annotations): local prefs — remembered name and last color"
```

---

### Task 7: Supabase store adapter (TDD)

**Files:**
- Create: `tests/unit/annotations-store-supabase.test.ts`
- Create: `app/lib/annotations/store-supabase.ts`

**Interfaces:**
- Consumes: types from Task 1.
- Produces: `createSupabaseAnnotationStore(opts: { url: string; key: string; table: string; fetcher?: Fetcher }): AnnotationStore`; exported helpers `annotationFromRow(row: AnnotationRow): PageAnnotation`, `annotationToRow(a: NewPageAnnotation)`, and the `AnnotationRow` interface. Used by Task 8.

- [ ] **Step 1: Write the failing test** — `tests/unit/annotations-store-supabase.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseAnnotationStore, annotationFromRow } from '../../app/lib/annotations/store-supabase'
import type { AnnotationRow } from '../../app/lib/annotations/store-supabase'
import type { NewPageAnnotation } from '../../app/types/annotations'

const OPTS = { url: 'https://x.supabase.co', key: 'sb_publishable_test', table: 'copperhead_annotations' }
const ENDPOINT = 'https://x.supabase.co/rest/v1/copperhead_annotations'

const ROW: AnnotationRow = {
  id: 'a1', page_path: '/articles/foo', exact: 'quick brown', prefix: 'The ', suffix: ' fox',
  offset_hint: 4, color: 'teal', resolved: false, author_name: 'CS',
  comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
  created_at: '2026-07-21T00:00:00Z',
}

const NEW: NewPageAnnotation = {
  pagePath: '/articles/foo',
  anchor: { exact: 'quick brown', prefix: 'The ', suffix: ' fox', offset: 4 },
  color: 'teal', resolved: false, authorName: 'CS',
  comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
}

describe('annotationFromRow', () => {
  it('maps a row to the domain shape', () => {
    const a = annotationFromRow(ROW)
    expect(a).toEqual({
      id: 'a1', pagePath: '/articles/foo',
      anchor: { exact: 'quick brown', prefix: 'The ', suffix: ' fox', offset: 4 },
      color: 'teal', resolved: false, createdAt: '2026-07-21T00:00:00Z', authorName: 'CS',
      comments: [{ id: 'c1', body: 'first note', authorName: 'CS', createdAt: '2026-07-21T00:00:00Z' }],
    })
  })
  it('defaults junk colors to orange and drops malformed comments', () => {
    const a = annotationFromRow({ ...ROW, color: 'plaid', comments: [{ id: 'c1' }, 'nope', null] })
    expect(a.color).toBe('orange')
    expect(a.comments).toEqual([])
  })
})

describe('createSupabaseAnnotationStore', () => {
  it('list() GETs by page_path in created order with the apikey header', async () => {
    const fetcher = vi.fn().mockResolvedValue([ROW])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.list('/articles/foo')
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      headers: { apikey: 'sb_publishable_test' },
      query: { select: '*', page_path: 'eq./articles/foo', order: 'created_at.asc' },
    })
    expect(out).toHaveLength(1)
    expect(out[0]!.id).toBe('a1')
  })
  it('create() POSTs the row and returns the representation', async () => {
    const fetcher = vi.fn().mockResolvedValue([ROW])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const created = await store.create(NEW)
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'POST',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      body: {
        page_path: '/articles/foo', exact: 'quick brown', prefix: 'The ', suffix: ' fox',
        offset_hint: 4, color: 'teal', resolved: false, author_name: 'CS',
        comments: NEW.comments,
      },
    })
    expect(created.id).toBe('a1')
  })
  it('addComment() reads the row, appends, PATCHes the whole thread (last-write-wins)', async () => {
    const reply = { id: 'c2', body: 'a reply', authorName: 'KB', createdAt: '2026-07-21T01:00:00Z' }
    const patched = { ...ROW, comments: [...(ROW.comments as unknown[]), reply] }
    const fetcher = vi.fn()
      .mockResolvedValueOnce([ROW])      // read
      .mockResolvedValueOnce([patched])  // patch
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.addComment('a1', reply)
    expect(fetcher).toHaveBeenNthCalledWith(1, ENDPOINT, {
      headers: { apikey: 'sb_publishable_test' },
      query: { select: '*', id: 'eq.a1' },
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, ENDPOINT, {
      method: 'PATCH',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      query: { id: 'eq.a1' },
      body: { comments: [...(ROW.comments as unknown[]), reply] },
    })
    expect(out.comments).toHaveLength(2)
  })
  it('addComment() throws when the thread is gone', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await expect(store.addComment('gone', { id: 'c', body: 'x', authorName: 'Y', createdAt: 'z' }))
      .rejects.toThrow('not found')
  })
  it('setResolved() PATCHes the flag', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ ...ROW, resolved: true }])
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    const out = await store.setResolved('a1', true)
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'PATCH',
      headers: { apikey: 'sb_publishable_test', Prefer: 'return=representation' },
      query: { id: 'eq.a1' },
      body: { resolved: true },
    })
    expect(out.resolved).toBe(true)
  })
  it('remove() DELETEs by id', async () => {
    const fetcher = vi.fn().mockResolvedValue(undefined)
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await store.remove('a1')
    expect(fetcher).toHaveBeenCalledWith(ENDPOINT, {
      method: 'DELETE',
      headers: { apikey: 'sb_publishable_test' },
      query: { id: 'eq.a1' },
    })
  })
  it('propagates network errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    const store = createSupabaseAnnotationStore({ ...OPTS, fetcher })
    await expect(store.list('/x')).rejects.toThrow('offline')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/annotations-store-supabase.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/lib/annotations/store-supabase.ts`**

```ts
// PostgREST adapter for the AnnotationStore seam. Deliberately SDK-free:
// five REST calls via the injectable fetcher (Nuxt's $fetch at runtime).
// Auth is the publishable key in the `apikey` header; the table's RLS
// policies are intentionally open (dev-preview tool, removed at go-live).
// Concurrency: addComment/setResolved are read-modify-write over the whole
// comments array — LAST WRITE WINS (studio's documented trade-off; fine at
// manager-review scale).
import type { AnnotationColor, AnnotationComment, AnnotationStore, NewPageAnnotation, PageAnnotation } from '~/types/annotations'
import { ANNOTATION_COLORS } from '~/types/annotations'

/** Server row shape (mirrors the create_copperhead_annotations migration). */
export interface AnnotationRow {
  id: string
  page_path: string
  exact: string
  prefix: string
  suffix: string
  offset_hint: number
  color: string
  resolved: boolean
  author_name: string
  comments: unknown
  created_at: string
}

type Fetcher = (url: string, opts?: {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
}) => Promise<unknown>

/** Defensive parse: the comments column is writable JSON — never trust its shape. */
function commentsFromJson(value: unknown): AnnotationComment[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((c) => {
    if (typeof c !== 'object' || c === null) return []
    const o = c as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.body !== 'string') return []
    return [{
      id: o.id,
      body: o.body,
      authorName: typeof o.authorName === 'string' ? o.authorName : '',
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
    }]
  })
}

export function annotationFromRow(row: AnnotationRow): PageAnnotation {
  const color = (ANNOTATION_COLORS as readonly string[]).includes(row.color)
    ? (row.color as AnnotationColor)
    : 'orange'
  return {
    id: row.id,
    pagePath: row.page_path,
    anchor: { exact: row.exact, prefix: row.prefix ?? '', suffix: row.suffix ?? '', offset: row.offset_hint ?? 0 },
    color,
    resolved: !!row.resolved,
    createdAt: row.created_at,
    authorName: row.author_name,
    comments: commentsFromJson(row.comments),
  }
}

export function annotationToRow(a: NewPageAnnotation): Omit<AnnotationRow, 'id' | 'created_at'> {
  return {
    page_path: a.pagePath,
    exact: a.anchor.exact,
    prefix: a.anchor.prefix,
    suffix: a.anchor.suffix,
    offset_hint: a.anchor.offset,
    color: a.color,
    resolved: a.resolved,
    author_name: a.authorName,
    comments: a.comments,
  }
}

export function createSupabaseAnnotationStore(opts: {
  url: string
  key: string
  table: string
  /** Injectable for tests; defaults to the $fetch global Nuxt provides. */
  fetcher?: Fetcher
}): AnnotationStore {
  const fetcher: Fetcher = opts.fetcher ?? (globalThis.$fetch as unknown as Fetcher)
  const endpoint = `${opts.url}/rest/v1/${opts.table}`
  const read = { apikey: opts.key }
  const write = { apikey: opts.key, Prefer: 'return=representation' }

  async function findRow(id: string): Promise<AnnotationRow> {
    const rows = await fetcher(endpoint, { headers: read, query: { select: '*', id: `eq.${id}` } }) as AnnotationRow[]
    const row = rows[0]
    if (!row) throw new Error(`Annotation ${id} not found`)
    return row
  }

  function firstOf(rows: unknown, action: string): PageAnnotation {
    const row = (rows as AnnotationRow[])[0]
    if (!row) throw new Error(`Annotation ${action} not found`)
    return annotationFromRow(row)
  }

  return {
    async list(pagePath) {
      const rows = await fetcher(endpoint, {
        headers: read,
        query: { select: '*', page_path: `eq.${pagePath}`, order: 'created_at.asc' },
      }) as AnnotationRow[]
      return rows.map(annotationFromRow)
    },

    async create(a) {
      const rows = await fetcher(endpoint, { method: 'POST', headers: write, body: annotationToRow(a) })
      return firstOf(rows, 'create')
    },

    async addComment(id, c) {
      const row = await findRow(id)
      const comments = [...commentsFromJson(row.comments), c]
      const rows = await fetcher(endpoint, {
        method: 'PATCH', headers: write, query: { id: `eq.${id}` }, body: { comments },
      })
      return firstOf(rows, 'update')
    },

    async setResolved(id, resolved) {
      const rows = await fetcher(endpoint, {
        method: 'PATCH', headers: write, query: { id: `eq.${id}` }, body: { resolved },
      })
      return firstOf(rows, 'update')
    },

    async remove(id) {
      await fetcher(endpoint, { method: 'DELETE', headers: read, query: { id: `eq.${id}` } })
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/annotations-store-supabase.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Run the whole unit suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/lib/annotations/store-supabase.ts tests/unit/annotations-store-supabase.test.ts
git commit -m "feat(annotations): Supabase PostgREST store adapter behind the studio seam"
```

---

### Task 8: `useAnnotations` composable

**Files:**
- Create: `app/composables/useAnnotations.ts`

**Interfaces:**
- Consumes: `createSupabaseAnnotationStore` (Task 7), `hub.annotations.supabase` (Task 1), types (Task 1).
- Produces: `useAnnotations(pagePath: MaybeRefOrGetter<string>)` returning `{ annotations: Ref<PageAnnotation[]>, loading: Ref<boolean>, loadFailed: Ref<boolean>, load(): Promise<void>, createAnnotation(anchor, color, body, authorName): Promise<PageAnnotation>, reply(id, body, authorName): Promise<void>, setResolved(id, resolved): Promise<void>, removeAnnotation(id): Promise<void> }`. Used by Task 13. **Error contract:** `load()` never throws (sets `loadFailed`, no toast — avoids toast spam on every page when offline); every mutation toasts AND rethrows so callers keep their UI open for a retry.

- [ ] **Step 1: Create `app/composables/useAnnotations.ts`**

```ts
// Reactive orchestration for page annotations (spec §5). One Supabase-backed
// store per call; the AnnotationLayer owns when to (re)load. Load failures
// set `loadFailed` quietly (the rail shows an inline note — a toast on every
// page load would spam offline sessions); mutation failures toast AND
// rethrow so the caller keeps its UI open (composer stays up for a retry).
import { ref, toValue, type MaybeRefOrGetter } from '#imports'
import { hub } from '../../hub.config.mjs'
import type { AnnotationAnchor, AnnotationColor, PageAnnotation } from '~/types/annotations'
import { createSupabaseAnnotationStore } from '~/lib/annotations/store-supabase'

export function useAnnotations(pagePath: MaybeRefOrGetter<string>) {
  const toast = useToast()
  const store = createSupabaseAnnotationStore({
    url: hub.annotations.supabase.url,
    key: hub.annotations.supabase.publishableKey,
    table: hub.annotations.supabase.table,
  })

  const annotations = ref<PageAnnotation[]>([])
  const loading = ref(true)
  const loadFailed = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      annotations.value = await store.list(toValue(pagePath))
      loadFailed.value = false
    }
    catch {
      annotations.value = []
      loadFailed.value = true
    }
    finally {
      loading.value = false
    }
  }

  function replaceOne(updated: PageAnnotation): void {
    annotations.value = annotations.value.map(a => (a.id === updated.id ? updated : a))
  }

  function fail(title: string): void {
    toast.add({ title, description: 'Check your connection and try again.', color: 'error' })
  }

  async function createAnnotation(
    anchor: AnnotationAnchor,
    color: AnnotationColor,
    body: string,
    authorName: string,
  ): Promise<PageAnnotation> {
    const now = new Date().toISOString()
    try {
      const created = await store.create({
        pagePath: toValue(pagePath),
        anchor,
        color,
        resolved: false,
        authorName,
        comments: [{ id: crypto.randomUUID(), body, authorName, createdAt: now }],
      })
      annotations.value = [...annotations.value, created]
      return created
    }
    catch (e) {
      fail('Couldn’t save the comment')
      throw e
    }
  }

  async function reply(id: string, body: string, authorName: string): Promise<void> {
    try {
      replaceOne(await store.addComment(id, {
        id: crypto.randomUUID(), body, authorName, createdAt: new Date().toISOString(),
      }))
    }
    catch (e) {
      fail('Couldn’t save the reply')
      throw e
    }
  }

  async function setResolved(id: string, resolved: boolean): Promise<void> {
    try {
      replaceOne(await store.setResolved(id, resolved))
    }
    catch (e) {
      fail(resolved ? 'Couldn’t resolve the thread' : 'Couldn’t reopen the thread')
      throw e
    }
  }

  async function removeAnnotation(id: string): Promise<void> {
    try {
      await store.remove(id)
      annotations.value = annotations.value.filter(a => a.id !== id)
    }
    catch (e) {
      fail('Couldn’t delete the thread')
      throw e
    }
  }

  return { annotations, loading, loadFailed, load, createAnnotation, reply, setResolved, removeAnnotation }
}
```

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS (fix any lint autofixables with `pnpm lint --fix` and re-run).

- [ ] **Step 3: Commit**

```bash
git add app/composables/useAnnotations.ts
git commit -m "feat(annotations): useAnnotations composable over the Supabase store"
```

---

### Task 9: Annotation stylesheet + conditional loading

**Files:**
- Create: `app/assets/css/annotations.css`
- Modify: `nuxt.config.ts` (css array — currently `css: ['~/assets/css/main.css'],`)

**Interfaces:**
- Consumes: `hub.annotations.enabled` (Task 1).
- Produces: classes `mark.ann`, `mark.ann--{orange|violet|teal|lime}`, `mark.ann--active`, `mark.ann--resolved`, arming tints on `body.ann-arming--{color}`, print rules for `.ann-bar-row`, `.ann-rail-drawer`, `.ann-composer`, `.ann-clean-pill`, `.ann-dot--{color}`. Used by Tasks 10–13.

- [ ] **Step 1: Create `app/assets/css/annotations.css`**

```css
/* app/assets/css/annotations.css
   Manager-annotation marks + print rules. Ported from copperhead-studio-20
   with the requested different palette (orange/violet/teal/lime instead of
   yellow/green/blue/pink) plus a colored underline so highlights read
   distinctly from the studio's. Unlike the studio (always-light preview
   surface), this site has a real dark mode — marks force near-black ink so
   text on the pastel stays ≥ 9:1 in BOTH modes (#111827 on every tint
   below is ≥ 9.5:1). Bar/rail chrome styles itself with Nuxt UI utilities
   in the components and inherits the app theme. */

mark.ann {
  padding: 0 0.08em;
  border-radius: 2px;
  cursor: pointer;
  color: #111827;
  border-bottom: 2px solid transparent;
}
mark.ann--orange { background-color: #fed7aa; border-bottom-color: #f97316; }
mark.ann--violet { background-color: #ddd6fe; border-bottom-color: #8b5cf6; }
mark.ann--teal   { background-color: #99f6e4; border-bottom-color: #14b8a6; }
mark.ann--lime   { background-color: #d9f99d; border-bottom-color: #84cc16; }

/* Armed live-selection tint: while the highlighter is armed the layer sets
   ann-arming--<color> on <body>, so the click-drag selection previews the
   chosen tint instead of the browser default. Forced dark ink keeps the
   preview readable in dark mode too. */
body.ann-arming main { cursor: text; }
body.ann-arming--orange main ::selection { background-color: #fed7aa; color: #111827; }
body.ann-arming--violet main ::selection { background-color: #ddd6fe; color: #111827; }
body.ann-arming--teal   main ::selection { background-color: #99f6e4; color: #111827; }
body.ann-arming--lime   main ::selection { background-color: #d9f99d; color: #111827; }

mark.ann:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 1px;
}
mark.ann.ann--active {
  box-shadow: 0 0 0 2px #1d4ed8;
}
mark.ann.ann--resolved {
  opacity: 0.55;
  text-decoration: underline dotted;
}

@media (prefers-reduced-motion: no-preference) {
  mark.ann { transition: box-shadow 120ms ease-in-out; }
}

/* Print: review chrome never prints; tints and underlines are stripped. */
@media print {
  .ann-bar-row, .ann-rail-drawer, .ann-composer, .ann-clean-pill { display: none !important; }
  mark.ann {
    background: none !important;
    border-bottom: none !important;
    box-shadow: none !important;
    opacity: 1 !important;
    text-decoration: none !important;
    padding: 0;
  }
}
```

- [ ] **Step 2: Load it conditionally in `nuxt.config.ts`**

Change

```ts
  css: ['~/assets/css/main.css'],
```

to

```ts
  // annotations.css ships only while the manager-annotation tool is enabled
  // (hub.annotations.enabled — the go-live kill switch).
  css: ['~/assets/css/main.css', ...(hub.annotations.enabled ? ['~/assets/css/annotations.css'] : [])],
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/assets/css/annotations.css nuxt.config.ts
git commit -m "feat(annotations): mark palette (orange/violet/teal/lime + underline), print rules"
```

---

### Task 10: AnnotationBar component

**Files:**
- Create: `app/components/annotation/AnnotationBar.vue`

**Interfaces:**
- Consumes: `ANNOTATION_COLORS`, `AnnotationColor` (Task 1).
- Produces: `<AnnotationBar :armed :color :filter :open-count :rail-open @update:armed @update:color @update:filter @clean-view @toggle-rail>` — `Filter = 'open' | 'resolved' | 'all'`. `data-test` hooks: `ann-clean-toggle`, `ann-arm`, `ann-color-{color}`, `ann-filter`, `ann-rail-toggle`. Used by Task 13.

Studio port. Adaptations: new SWATCH palette; the clean-view control emits a plain `clean-view` event (the layer swaps the whole bar for the floating pill, so the bar never renders in clean-view state and needs no `cleanView` prop or conditional control list).

- [ ] **Step 1: Create `app/components/annotation/AnnotationBar.vue`**

```vue
<!-- app/components/annotation/AnnotationBar.vue -->
<!--
  The review toolbar (studio port): clean view, arm the highlighter, pick the
  tint, filter open/resolved threads, open the rail. Dumb component — the
  layer owns all state; v-model style updates keep it trivially testable.
  Unlike the studio, clean view unmounts this whole bar (the layer renders a
  floating exit pill instead), so there is no collapsed in-bar state here.
-->
<script setup lang="ts">
import { ref, computed } from '#imports'
import { ANNOTATION_COLORS, type AnnotationColor } from '~/types/annotations'

type Filter = 'open' | 'resolved' | 'all'
defineProps<{ armed: boolean; color: AnnotationColor; filter: Filter; openCount: number; railOpen: boolean }>()
const emit = defineEmits<{
  'update:armed': [value: boolean]
  'update:color': [value: AnnotationColor]
  'update:filter': [value: Filter]
  'clean-view': []
  'toggle-rail': []
}>()

const FILTER_ORDER: Filter[] = ['open', 'resolved', 'all']
const FILTER_LABEL: Record<Filter, string> = { open: 'Open', resolved: 'Resolved', all: 'All' }

/** Swatch backgrounds mirror annotations.css mark tints (kept inline: tiny + colocated). */
const SWATCH: Record<AnnotationColor, string> = {
  orange: '#fed7aa', violet: '#ddd6fe', teal: '#99f6e4', lime: '#d9f99d',
}

// ---- Roving tabindex (ARIA APG toolbar pattern) ----
// The toolbar is ONE tab stop: `roving` names the control holding tabindex=0;
// every other control is tabindex=-1. ←/→ move it (wrapping), Home/End jump,
// and focusing any control (mouse, or a swatch click) hands it the stop.
// Swatches sit flat in the arrow order — inside a toolbar, radios are ARROWED
// PAST and picked with Enter/Space/click, never selected-on-focus.
type ControlId = 'clean' | 'arm' | AnnotationColor | 'filter' | 'rail'
const CONTROL_SELECTOR: Record<string, string> = {
  clean: 'ann-clean-toggle', arm: 'ann-arm', filter: 'ann-filter', rail: 'ann-rail-toggle',
  ...Object.fromEntries(ANNOTATION_COLORS.map(c => [c, `ann-color-${c}`])),
}
const rootEl = ref<HTMLElement | null>(null)
const roving = ref<ControlId>('clean')
const order = computed<ControlId[]>(() => ['clean', 'arm', ...ANNOTATION_COLORS, 'filter', 'rail'])
function tabindexOf(id: ControlId): 0 | -1 {
  return roving.value === id ? 0 : -1
}
function onToolbarKeydown(e: KeyboardEvent) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
  const ids = order.value
  const from = (e.target as HTMLElement).closest?.('[data-test]')?.getAttribute('data-test')
  const i = ids.findIndex(id => CONTROL_SELECTOR[id] === from)
  if (i === -1) return
  e.preventDefault()
  const next = e.key === 'ArrowRight'
    ? ids[(i + 1) % ids.length]!
    : e.key === 'ArrowLeft'
      ? ids[(i - 1 + ids.length) % ids.length]!
      : e.key === 'Home' ? ids[0]! : ids[ids.length - 1]!
  roving.value = next
  rootEl.value?.querySelector<HTMLElement>(`[data-test="${CONTROL_SELECTOR[next]}"]`)?.focus()
}

function cycleFilter(current: Filter) {
  const i = FILTER_ORDER.indexOf(current)
  emit('update:filter', FILTER_ORDER[(i + 1) % FILTER_ORDER.length]!)
}
</script>

<template>
  <div
    ref="rootEl"
    class="ann-bar flex flex-wrap items-center gap-2"
    role="toolbar"
    aria-label="Review tools"
    @keydown="onToolbarKeydown"
  >
    <UButton
      data-test="ann-clean-toggle"
      size="xs"
      variant="outline"
      color="neutral"
      icon="i-lucide-eye-off"
      label="Clean view"
      title="See the page without highlights or comments"
      :tabindex="tabindexOf('clean')"
      @focus="roving = 'clean'"
      @click="emit('clean-view')"
    />
    <UButton
      data-test="ann-arm"
      size="xs"
      :variant="armed ? 'solid' : 'outline'"
      color="primary"
      icon="i-lucide-highlighter"
      :aria-pressed="armed ? 'true' : 'false'"
      :label="armed ? 'Highlighting on' : 'Highlight'"
      :title="armed ? 'Select text, then press Enter to comment' : 'Turn on highlighting'"
      :tabindex="tabindexOf('arm')"
      @focus="roving = 'arm'"
      @click="emit('update:armed', !armed)"
    />
    <div class="flex items-center gap-1" role="radiogroup" aria-label="Highlight color">
      <button
        v-for="c in ANNOTATION_COLORS"
        :key="c"
        type="button"
        role="radio"
        :data-test="`ann-color-${c}`"
        class="h-5 w-5 rounded-full border border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 dark:border-neutral-500"
        :style="{ backgroundColor: SWATCH[c], boxShadow: c === color ? '0 0 0 2px #1d4ed8' : 'none' }"
        :aria-checked="c === color ? 'true' : 'false'"
        :aria-label="`Highlight color ${c}`"
        :tabindex="tabindexOf(c)"
        @focus="roving = c"
        @click="emit('update:color', c)"
      />
    </div>
    <UButton
      data-test="ann-filter"
      size="xs"
      variant="outline"
      color="neutral"
      :label="`Showing: ${FILTER_LABEL[filter]}`"
      :tabindex="tabindexOf('filter')"
      @focus="roving = 'filter'"
      @click="cycleFilter(filter)"
    />
    <UButton
      data-test="ann-rail-toggle"
      size="xs"
      variant="outline"
      color="neutral"
      :icon="railOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
      :label="`${railOpen ? 'Hide' : 'Show'} comments (${openCount})`"
      :aria-expanded="railOpen ? 'true' : 'false'"
      :title="railOpen ? 'Hide the comments panel' : 'Show the comments panel'"
      :tabindex="tabindexOf('rail')"
      @focus="roving = 'rail'"
      @click="emit('toggle-rail')"
    />
  </div>
</template>
```

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/components/annotation/AnnotationBar.vue
git commit -m "feat(annotations): review toolbar with roving tabindex and new swatches"
```

---

### Task 11: AnnotationComposer component (adds the required name field)

**Files:**
- Create: `app/components/annotation/AnnotationComposer.vue`

**Interfaces:**
- Consumes: `composerPosition` (Task 5).
- Produces: `<AnnotationComposer :position="{x,y}" :quote :initial-name @save="(body, name) => …" @cancel>`. Save is disabled until BOTH name and body are non-blank. `data-test` hooks: `ann-name`, `ann-cancel`, `ann-save`. Used by Task 13.

- [ ] **Step 1: Create `app/components/annotation/AnnotationComposer.vue`**

```vue
<!-- app/components/annotation/AnnotationComposer.vue -->
<!--
  Floating "Add comment" popover at the text selection (studio port + the
  required name field). The layer owns positioning (viewport coords from the
  selection rect) and creation; this component collects name + body and emits
  save/cancel. Focus is trapped here (name ↔ textarea ↔ buttons) and Esc
  cancels; CLOSE-focus is the layer's job — it restores the pre-open target
  on cancel, or focuses the newly painted <mark> on save.
-->
<script setup lang="ts">
import { ref, onMounted, computed } from '#imports'
import { composerPosition } from '~/lib/annotations/composer-position'

const props = defineProps<{ position: { x: number, y: number }; quote: string; initialName: string }>()
const emit = defineEmits<{ save: [body: string, name: string]; cancel: [] }>()

const name = ref(props.initialName)
const body = ref('')
const nameEl = ref<HTMLInputElement | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)
const rootEl = ref<HTMLElement | null>(null)
const canSave = computed(() => name.value.trim().length > 0 && body.value.trim().length > 0)
const mounted = ref(false)

/** The composer's containing block when `fixed` is NOT viewport-anchored
 *  (an ancestor transform would create one). Degenerate rects fall back to
 *  null = plain viewport anchoring. */
function containingBlock(): DOMRect | null {
  const op = rootEl.value?.offsetParent
  if (!(op instanceof HTMLElement) || op === document.body || op === document.documentElement) return null
  const r = op.getBoundingClientRect()
  return r.width > 0 && r.height > 0 ? r : null
}

/** Clamp so the popover never clips the viewport (or its containing block). */
const style = computed(() => {
  if (!import.meta.client) return { left: `${props.position.x}px`, top: `${props.position.y}px` }
  const cb = mounted.value ? containingBlock() : null
  const pos = composerPosition({
    desired: { x: props.position.x, y: props.position.y },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    container: cb ? { left: cb.left, top: cb.top, right: cb.right, bottom: cb.bottom } : null,
  })
  return { left: `${pos.left}px`, top: `${pos.top}px` }
})

onMounted(() => {
  mounted.value = true // re-run style: offsetParent is only knowable once in the DOM
  if (props.initialName.trim()) textareaEl.value?.focus()
  else nameEl.value?.focus()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); emit('cancel'); return }
  if (e.key !== 'Tab') return
  // Minimal focus trap over the popover's focusable controls.
  const focusables = Array.from(rootEl.value?.querySelectorAll<HTMLElement>('input, textarea, button:not([disabled])') ?? [])
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

function save() {
  if (canSave.value) emit('save', body.value.trim(), name.value.trim())
}
</script>

<template>
  <div
    ref="rootEl"
    class="ann-composer fixed z-50 w-80 max-w-[calc(100vw-32px)] rounded-lg border border-accented bg-default p-3 shadow-lg"
    :style="style"
    role="dialog"
    aria-label="Add review comment"
    @keydown="onKeydown"
  >
    <p class="mb-2 line-clamp-2 text-xs italic text-muted">
      “{{ quote }}”
    </p>
    <input
      ref="nameEl"
      v-model="name"
      data-test="ann-name"
      type="text"
      maxlength="80"
      class="mb-2 w-full rounded border border-accented bg-transparent px-2 py-1 text-sm"
      placeholder="Your name or initials (required)"
      aria-label="Your name or initials"
    >
    <textarea
      ref="textareaEl"
      v-model="body"
      rows="3"
      class="w-full rounded border border-accented bg-transparent p-2 text-sm"
      placeholder="Add a comment (required)…"
      aria-label="Comment text"
    />
    <div class="mt-2 flex justify-end gap-2">
      <UButton data-test="ann-cancel" size="xs" variant="ghost" color="neutral" label="Cancel" @click="emit('cancel')" />
      <UButton data-test="ann-save" size="xs" color="primary" label="Comment" :disabled="!canSave" @click="save" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/components/annotation/AnnotationComposer.vue
git commit -m "feat(annotations): composer popover with required name + comment"
```

---

### Task 12: Rail ordering lib (TDD) + AnnotationRail component (drawer cards, replies, confirm-delete)

**Files:**
- Create: `tests/unit/annotations-rail-order.test.ts`
- Create: `app/lib/annotations/rail-order.ts`
- Create: `app/components/annotation/AnnotationRail.vue`

**Interfaces:**
- Consumes: `RailThread` (Task 1).
- Produces (lib): `orderThreads(threads: RailThread[], filter: 'open' | 'resolved' | 'all'): RailThread[]` — filtered, then sorted by resolved start offset with orphans last (orphans among themselves by createdAt).
- Produces: `<AnnotationRail :threads :filter :active-id :saved-name :load-failed @reply="(id, body, name) => …" @resolve="(id, resolved) => …" @remove="(id) => …" @jump="(id) => …">`. `data-test` hooks: `ann-card`, `ann-quote`, `ann-reply-name`, `ann-reply-input`, `ann-reply-send`, `ann-resolve`, `ann-delete`, `ann-delete-confirm`. Used by Task 13.

Studio port. Adaptations: flow layout only (no `alignTops`/ResizeObserver/collision pass — the rail is a drawer at all widths, spec D2); no auth — delete is available to everyone behind an inline confirm (spec D4); replies need a name — when `savedName` is empty an inline name input appears (spec D3); card header shows `authorName` only (no role label); the visible-thread ordering is extracted to `rail-order.ts` so it is unit-testable (spec §8).

- [ ] **Step 1: Write the failing ordering test** — `tests/unit/annotations-rail-order.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { orderThreads } from '../../app/lib/annotations/rail-order'
import type { RailThread } from '../../app/types/annotations'

function thread(id: string, opts: { start: number | null, resolved?: boolean, createdAt?: string }): RailThread {
  return {
    annotation: {
      id,
      pagePath: '/p',
      anchor: { exact: 'x', prefix: '', suffix: '', offset: 0 },
      color: 'orange',
      resolved: opts.resolved ?? false,
      createdAt: opts.createdAt ?? '2026-07-21T00:00:00Z',
      authorName: 'CS',
      comments: [],
    },
    orphan: opts.start === null,
    start: opts.start,
  }
}

describe('orderThreads', () => {
  it('sorts anchored threads by document position', () => {
    const out = orderThreads([thread('b', { start: 50 }), thread('a', { start: 10 })], 'all')
    expect(out.map(t => t.annotation.id)).toEqual(['a', 'b'])
  })
  it('puts orphans last, ordered by createdAt', () => {
    const out = orderThreads([
      thread('orphan-late', { start: null, createdAt: '2026-07-21T02:00:00Z' }),
      thread('anchored', { start: 99 }),
      thread('orphan-early', { start: null, createdAt: '2026-07-21T01:00:00Z' }),
    ], 'all')
    expect(out.map(t => t.annotation.id)).toEqual(['anchored', 'orphan-early', 'orphan-late'])
  })
  it('filters by open / resolved / all', () => {
    const threads = [thread('open1', { start: 1 }), thread('done1', { start: 2, resolved: true })]
    expect(orderThreads(threads, 'open').map(t => t.annotation.id)).toEqual(['open1'])
    expect(orderThreads(threads, 'resolved').map(t => t.annotation.id)).toEqual(['done1'])
    expect(orderThreads(threads, 'all')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/unit/annotations-rail-order.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/lib/annotations/rail-order.ts`**

```ts
// Which threads the rail shows, in what order: filter (open/resolved/all),
// then document position; orphans sink to the bottom ordered by creation
// time. Extracted from the rail SFC so the ordering contract is unit-tested.
import type { RailThread } from '~/types/annotations'

export type RailFilter = 'open' | 'resolved' | 'all'

export function orderThreads(threads: RailThread[], filter: RailFilter): RailThread[] {
  const byFilter = threads.filter(t =>
    filter === 'all' ? true : filter === 'resolved' ? t.annotation.resolved : !t.annotation.resolved,
  )
  return [...byFilter].sort((a, b) => {
    if (a.orphan !== b.orphan) return a.orphan ? 1 : -1
    if (!a.orphan) return (a.start ?? 0) - (b.start ?? 0)
    return a.annotation.createdAt.localeCompare(b.annotation.createdAt)
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/annotations-rail-order.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `app/components/annotation/AnnotationRail.vue`**

```vue
<!-- app/components/annotation/AnnotationRail.vue -->
<!--
  The comments rail (studio port, drawer/flow mode only): threads in document
  order (orphans last), reply box, resolve/reopen, delete-with-confirm,
  click-quote → jump to the highlight. No auth on this site: anyone can
  reply, resolve, or delete (deletion is how stale annotations are removed).
  Comment bodies are Vue-interpolated text — NEVER v-html.
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from '#imports'
import type { RailThread } from '~/types/annotations'
import { orderThreads, type RailFilter } from '~/lib/annotations/rail-order'

const props = defineProps<{
  threads: RailThread[]
  filter: RailFilter
  activeId: string | null
  /** Remembered reviewer name; when blank each card shows a name input for replies. */
  savedName: string
  /** True when the initial Supabase list failed — shows the inline notice. */
  loadFailed?: boolean
}>()
const emit = defineEmits<{
  reply: [id: string, body: string, name: string]
  resolve: [id: string, resolved: boolean]
  remove: [id: string]
  jump: [id: string]
}>()

/** Root of THIS rail instance — card lookups are scoped here, never document-global. */
const rootEl = ref<HTMLElement | null>(null)

const drafts = ref<Record<string, string>>({})
const nameDraft = ref('')
/** Two-step delete: first click arms the confirm row for one card. */
const confirmingId = ref<string | null>(null)

const visible = computed(() => orderThreads(props.threads, props.filter))

function replyName(): string {
  return (props.savedName || nameDraft.value).trim()
}

function sendReply(id: string) {
  const body = (drafts.value[id] ?? '').trim()
  const name = replyName()
  if (!body || !name) return
  emit('reply', id, body, name)
  drafts.value = { ...drafts.value, [id]: '' }
}

function timeOf(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
}

async function scrollToActive(id: string | null) {
  if (!id) return
  await nextTick()
  const el = rootEl.value?.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id)}"]`)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
}

// A rail (re)mounted with a non-null activeId scrolls the active card into
// view on first paint too, not only on later changes (studio precedent).
watch(() => props.activeId, scrollToActive)
onMounted(() => { void scrollToActive(props.activeId) })
</script>

<template>
  <section ref="rootEl" class="ann-rail" aria-label="Review comments">
    <p v-if="loadFailed" class="p-3 text-sm text-warning">
      Comments unavailable — couldn’t reach the comment service.
    </p>
    <p v-else-if="visible.length === 0" class="p-3 text-sm text-muted">
      No {{ filter === 'all' ? '' : `${filter} ` }}comments yet. Turn on <strong>Highlight</strong> and select text to add one.
    </p>
    <article
      v-for="t in visible"
      :key="t.annotation.id"
      :data-card-id="t.annotation.id"
      data-test="ann-card"
      class="mb-3 rounded-lg border bg-default p-3"
      :class="t.annotation.id === activeId ? 'border-primary' : 'border-default'"
    >
      <header class="mb-1 flex items-center gap-2">
        <span class="h-3 w-3 shrink-0 rounded-full" :class="`ann-dot--${t.annotation.color}`" aria-hidden="true" />
        <span class="text-sm font-medium">{{ t.annotation.authorName }}</span>
        <span class="text-xs text-muted">{{ timeOf(t.annotation.createdAt) }}</span>
        <span v-if="t.annotation.resolved" class="ml-auto text-xs text-muted">Resolved</span>
      </header>

      <button
        type="button"
        data-test="ann-quote"
        class="line-clamp-2 text-left text-xs italic text-muted hover:underline"
        :disabled="t.orphan"
        :aria-label="`Go to highlight: ${t.annotation.anchor.exact}`"
        @click="emit('jump', t.annotation.id)"
      >
        “{{ t.annotation.anchor.exact }}”
      </button>
      <p v-if="t.orphan" class="mt-1 text-xs text-warning">
        <UIcon name="i-lucide-map-pin-off" class="align-text-bottom" /> text changed — highlight not found
      </p>

      <ul class="mt-2 space-y-2">
        <li v-for="c in t.annotation.comments" :key="c.id" class="text-sm">
          <span class="font-medium">{{ c.authorName }}</span>
          <span class="ml-1 text-xs text-muted">{{ timeOf(c.createdAt) }}</span>
          <p class="whitespace-pre-wrap">{{ c.body }}</p>
        </li>
      </ul>

      <div class="mt-2 space-y-1">
        <input
          v-if="!savedName"
          v-model="nameDraft"
          data-test="ann-reply-name"
          type="text"
          maxlength="80"
          class="w-full rounded border border-accented bg-transparent px-2 py-1 text-sm"
          placeholder="Your name or initials (required)"
          aria-label="Your name or initials"
        >
        <div class="flex items-center gap-1">
          <input
            data-test="ann-reply-input"
            :value="drafts[t.annotation.id] ?? ''"
            type="text"
            class="flex-1 rounded border border-accented bg-transparent px-2 py-1 text-sm"
            placeholder="Reply…"
            :aria-label="`Reply to ${t.annotation.authorName}`"
            @input="drafts = { ...drafts, [t.annotation.id]: ($event.target as HTMLInputElement).value }"
            @keydown.enter.prevent="sendReply(t.annotation.id)"
          >
          <UButton data-test="ann-reply-send" size="xs" variant="ghost" icon="i-lucide-reply" aria-label="Send reply" @click="sendReply(t.annotation.id)" />
        </div>
      </div>

      <footer class="mt-2">
        <div v-if="confirmingId === t.annotation.id" class="flex items-center gap-2">
          <span class="text-xs font-medium text-error">Delete this thread?</span>
          <UButton
            data-test="ann-delete-confirm"
            size="xs"
            color="error"
            label="Delete"
            @click="emit('remove', t.annotation.id); confirmingId = null"
          />
          <UButton size="xs" variant="ghost" color="neutral" label="Cancel" @click="confirmingId = null" />
        </div>
        <div v-else class="flex items-center gap-2">
          <UButton
            data-test="ann-resolve"
            size="xs"
            :variant="t.annotation.resolved ? 'outline' : 'soft'"
            :color="t.annotation.resolved ? 'neutral' : 'success'"
            :icon="t.annotation.resolved ? 'i-lucide-rotate-ccw' : 'i-lucide-check'"
            :label="t.annotation.resolved ? 'Reopen' : 'Resolve'"
            @click="emit('resolve', t.annotation.id, !t.annotation.resolved)"
          />
          <UButton
            data-test="ann-delete"
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            aria-label="Delete thread"
            @click="confirmingId = t.annotation.id"
          />
        </div>
      </footer>
    </article>
  </section>
</template>

<style scoped>
.ann-dot--orange { background-color: #fed7aa; }
.ann-dot--violet { background-color: #ddd6fe; }
.ann-dot--teal   { background-color: #99f6e4; }
.ann-dot--lime   { background-color: #d9f99d; }
</style>
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/lib/annotations/rail-order.ts tests/unit/annotations-rail-order.test.ts app/components/annotation/AnnotationRail.vue
git commit -m "feat(annotations): comment rail with replies, confirm-delete, orphan notice"
```

---

### Task 13: AnnotationLayer orchestrator + layout mount

**Files:**
- Create: `app/components/annotation/AnnotationLayer.vue`
- Modify: `app/layouts/default.vue`

**Interfaces:**
- Consumes: everything above — `useAnnotations` (Task 8), anchor/paint (Tasks 3–4), `normalizePagePath` (Task 2), `annotationPrefs` (Task 6), Bar/Composer/Rail (Tasks 10–12).
- Produces: `<AnnotationLayer>` — self-contained; mounted client-only from the default layout when `hub.annotations.enabled`.

Key behaviors (studio `AnnotatedPreview` reshaped for a whole-page site): container = `#main-content` looked up by id; document-level event delegation (the layer does not wrap the page DOM); arming tints via classes on `<body>`; sticky bar at `top-0` (the site header is not sticky); clean view unmounts the bar and shows a fixed exit pill; the rail is the drawer at ALL widths; a 600 ms poll repaints when the container's text changes (client-side pagination etc.); route changes reload + repaint.

- [ ] **Step 1: Create `app/components/annotation/AnnotationLayer.vue`**

```vue
<!-- app/components/annotation/AnnotationLayer.vue -->
<!--
  The manager-annotation surface for the whole site (studio AnnotatedPreview
  reshaped): mounted once from the default layout (client-only, behind
  hub.annotations.enabled), it annotates everything inside #main-content on
  every page. Owns the sticky review bar, armed-selection → composer capture
  (mouse + keyboard Enter), resolve+paint of stored anchors, the comments
  drawer, clean view (bar unmounts, floating exit pill remains), local name/
  color prefs, and aria-live announcements. Threads are keyed by normalized
  route path and stored in Supabase — everyone sees the same threads.
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from '#imports'
import type { AnnotationAnchor, AnnotationColor, PageAnnotation, RailThread } from '~/types/annotations'
import { ANNOTATION_COLORS } from '~/types/annotations'
import { captureAnchor, resolveAnchor, textContentOf } from '~/lib/annotations/anchor'
import { paintOffsets, clearAnnotations } from '~/lib/annotations/paint'
import { normalizePagePath } from '~/lib/annotations/page-path'
import { annotationPrefs } from '~/lib/annotations/prefs'

const route = useRoute()
const toast = useToast()
const ann = useAnnotations(() => normalizePagePath(route.path))

const armed = ref(false)
const color = ref<AnnotationColor>('orange')
const filter = ref<'open' | 'resolved' | 'all'>('open')
/** Clean view: the site exactly as the public will see it — nothing painted,
 *  no bar, no rail; only the floating exit pill remains. Overlay-only. */
const cleanView = ref(false)
/** Comments start hidden; the drawer opens on demand (studio decision). */
const railOpen = ref(false)
const activeId = ref<string | null>(null)
const savedName = ref('')
/** Pending composer state: anchor captured, waiting for name + body. */
const composer = ref<{ anchor: AnnotationAnchor, position: { x: number, y: number } } | null>(null)
/** document.activeElement at composer open — restored on cancel; superseded
 *  by a focus-the-new-mark hop on save (studio pattern). */
const composerReturnFocus = ref<Element | null>(null)
/** id → resolved start offset (null = orphan). Drives rail order + orphan flags. */
const resolvedStarts = ref<Record<string, number | null>>({})

const layerEl = ref<HTMLElement | null>(null)
const drawerEl = ref<HTMLElement | null>(null)

function annotationContainer(): Element | null {
  return document.getElementById('main-content')
}

const openCount = computed(() => ann.annotations.value.filter(a => !a.resolved).length)
const threads = computed<RailThread[]>(() => ann.annotations.value.map(a => ({
  annotation: a,
  orphan: resolvedStarts.value[a.id] === null,
  start: resolvedStarts.value[a.id] ?? null,
})))

/** Arming opens the rail (the select→comment flow ends in a thread there).
 *  Disarming deliberately leaves the rail alone (studio decision). */
function setArmed(v: boolean) {
  armed.value = v
  if (v) railOpen.value = true
}

function setColor(c: AnnotationColor) {
  color.value = c
  annotationPrefs.setColor(c)
}

function visibleUnderFilter(resolved: boolean): boolean {
  return filter.value === 'all' || (filter.value === 'resolved') === resolved
}

/** The container text as of the last repaint — the 600 ms poll repaints when
 *  it drifts (client-side pagination, late-rendering content). Marks never
 *  change the text, so paint itself never re-triggers the poll. */
let lastPainted = ''

/** Re-resolve + repaint every annotation. Idempotent: clears first, then
 *  paints the filtered set; records start offsets (null → orphan). */
function repaint() {
  const container = annotationContainer()
  if (!container) return
  clearAnnotations(container)
  lastPainted = textContentOf(container)
  if (cleanView.value) {
    resolvedStarts.value = {}
    return
  }
  const starts: Record<string, number | null> = {}
  for (const a of ann.annotations.value) {
    const span = resolveAnchor(container, a.anchor)
    starts[a.id] = span ? span.start : null
    if (!span || !visibleUnderFilter(a.resolved)) continue
    const marks = paintOffsets(container, span.start, span.end, a.id, a.color)
    for (const m of marks) {
      if (a.resolved) m.classList.add('ann--resolved')
      if (a.id === activeId.value) m.classList.add('ann--active')
      m.setAttribute('aria-label', `Comment by ${a.authorName}: ${a.anchor.exact.slice(0, 60)}`)
    }
  }
  resolvedStarts.value = starts
}

/** Open a thread from its highlight: activate, open the drawer, let it scroll. */
function openThread(id: string) {
  activeId.value = id
  railOpen.value = true
  repaint()
  annotationContainer()
    ?.querySelector<HTMLElement>(`mark[data-ann-id="${CSS.escape(id)}"]`)
    ?.focus({ preventScroll: true })
}

/** Shared armed-selection → composer capture flow (mouse and keyboard). */
function tryOpenComposerFromSelection() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  const container = annotationContainer()
  if (!container) return
  const range = sel.getRangeAt(0)
  const res = captureAnchor(container, range)
  if (!res.ok) {
    if (res.reason !== 'outside' && res.reason !== 'empty') {
      const msg = res.reason === 'katex'
        ? 'Rendered widgets can’t be highlighted — select the surrounding text instead.'
        : 'That selection is too long to highlight — pick a shorter passage.'
      toast.add({ title: 'Can’t highlight that selection', description: msg, color: 'warning' })
    }
    return
  }
  const rect = range.getBoundingClientRect()
  composerReturnFocus.value = document.activeElement
  composer.value = { anchor: res.anchor, position: { x: rect.left, y: rect.bottom + 8 } }
}

/** Interactive/editable targets never yield Enter to the create path. */
const CREATE_ENTER_SKIP = 'a[href], button, input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/** Document-level delegation: mark activation (Enter/Space) takes precedence;
 *  otherwise, armed + a live selection + Enter opens the composer (the
 *  keyboard-only path — WCAG 2.1.1). Never from the layer's own chrome. */
function onDocumentKeydown(e: KeyboardEvent) {
  const t = e.target instanceof Element ? e.target : null
  const mark = t?.closest?.('mark[data-ann-id]') as HTMLElement | null
  if (mark?.dataset.annId) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThread(mark.dataset.annId) }
    return
  }
  if (!armed.value || e.key !== 'Enter' || composer.value) return
  if (t && (t.closest(CREATE_ENTER_SKIP) || layerEl.value?.contains(t))) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  e.preventDefault()
  tryOpenComposerFromSelection()
}

/** Click activation on painted marks (document-level delegation). */
function onDocumentClick(e: MouseEvent) {
  const mark = (e.target as HTMLElement).closest?.('mark[data-ann-id]') as HTMLElement | null
  if (mark?.dataset.annId) openThread(mark.dataset.annId)
}

/** Armed-highlighter mouse selection flow → composer. */
function onMouseUp() {
  if (!armed.value || composer.value) return
  tryOpenComposerFromSelection()
}

/** Close the composer and restore focus to wherever it was before opening. */
function cancelComposer() {
  composer.value = null
  const el = composerReturnFocus.value
  if (el instanceof HTMLElement) el.focus({ preventScroll: true })
  composerReturnFocus.value = null
}

// ---- Drawer dialog semantics (studio port; the drawer IS the rail here) ----
const drawerReturnFocus = ref<Element | null>(null)
const drawerShowing = computed(() => railOpen.value && !cleanView.value)
watch(drawerShowing, async (open) => {
  if (open) {
    drawerReturnFocus.value = document.activeElement
    await nextTick() // the drawer is v-if — it exists one tick after the flag flips
    drawerEl.value?.querySelector<HTMLElement>('[data-test="ann-drawer-close"]')?.focus()
  }
  else {
    const el = drawerReturnFocus.value
    drawerReturnFocus.value = null
    if (el instanceof HTMLElement && el.isConnected) el.focus({ preventScroll: true })
  }
})
function onDrawerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); railOpen.value = false; return }
  if (e.key !== 'Tab') return
  const focusables = Array.from(drawerEl.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select') ?? [])
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

/** Screen-reader announcements for actions with no visible focus change. */
const announce = ref('')
async function say(msg: string) {
  announce.value = '' // blank first: identical consecutive messages re-announce
  await nextTick()
  announce.value = msg
}

async function saveComposer(body: string, name: string) {
  if (!composer.value) return
  annotationPrefs.setName(name)
  savedName.value = name
  let created: PageAnnotation
  try {
    created = await ann.createAnnotation(composer.value.anchor, color.value, body, name)
  }
  catch {
    return // toast already shown; the composer stays open for a retry
  }
  composer.value = null
  window.getSelection()?.removeAllRanges()
  await nextTick()
  activeId.value = created.id
  if (filter.value === 'resolved') filter.value = 'open' // the new thread must be visible
  await nextTick() // let the filter watcher's repaint run first (studio note)
  repaint()
  annotationContainer()
    ?.querySelector<HTMLElement>(`mark[data-ann-id="${CSS.escape(created.id)}"]`)
    ?.focus({ preventScroll: true })
  composerReturnFocus.value = null
  await say('Comment added')
}

async function onReply(id: string, body: string, name: string) {
  annotationPrefs.setName(name)
  savedName.value = name
  try {
    await ann.reply(id, body, name)
  }
  catch {
    return
  }
  await say('Reply added')
}

async function onResolve(id: string, resolved: boolean) {
  try {
    await ann.setResolved(id, resolved)
  }
  catch {
    return
  }
  repaint()
  await say(resolved ? 'Thread resolved' : 'Thread reopened')
}

async function onRemove(id: string) {
  try {
    await ann.removeAnnotation(id)
  }
  catch {
    return
  }
  if (activeId.value === id) activeId.value = null
  repaint()
  await say('Thread deleted')
}

/** Rail → highlight: scroll the mark into view and flash it active. */
function jumpToMark(id: string) {
  activeId.value = id
  repaint()
  const mark = annotationContainer()?.querySelector<HTMLElement>(`mark[data-ann-id="${CSS.escape(id)}"]`)
  if (!mark) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  mark.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  mark.focus({ preventScroll: true })
}

/** Armed ::selection tint + cursor cue via body classes (the layer never
 *  wraps the page DOM, so the class rides on <body>). */
function syncArmingClasses() {
  const b = document.body
  const active = armed.value && !cleanView.value
  b.classList.toggle('ann-arming', active)
  for (const c of ANNOTATION_COLORS) b.classList.toggle(`ann-arming--${c}`, active && color.value === c)
}
watch([armed, color, cleanView], syncArmingClasses)

watch(filter, () => repaint())
watch(cleanView, (clean) => {
  if (clean) armed.value = false // no capture surface in the plain read
  repaint()
})

/** Route change: new page DOM. Reset transient state, reload, repaint. */
watch(() => route.path, async () => {
  activeId.value = null
  composer.value = null
  await ann.load()
  await nextTick()
  repaint()
})

let contentPoll: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  color.value = annotationPrefs.getColor() ?? 'orange'
  savedName.value = annotationPrefs.getName()
  document.addEventListener('keydown', onDocumentKeydown)
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('mouseup', onMouseUp)
  // Self-healing repaint: page transitions and client-side pagination change
  // the container's text without a route-path change we can watch reliably.
  contentPoll = setInterval(() => {
    if (cleanView.value) return
    const c = annotationContainer()
    if (c && textContentOf(c) !== lastPainted) repaint()
  }, 600)
  await ann.load()
  await nextTick()
  repaint()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('mouseup', onMouseUp)
  if (contentPoll) clearInterval(contentPoll)
  const container = annotationContainer()
  if (container) clearAnnotations(container)
  armed.value = false
  cleanView.value = false
  syncArmingClasses()
})
</script>

<template>
  <div ref="layerEl">
    <!-- Sticky review toolbar: the site header is not sticky, so the bar pins
         to the viewport top once scrolled. Unmounts entirely in clean view. -->
    <div
      v-if="!cleanView"
      class="ann-bar-row sticky top-0 z-40 border-b border-default bg-default/85 backdrop-blur-md"
    >
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted">Review</span>
        <AnnotationBar
          :armed="armed"
          :color="color"
          :filter="filter"
          :open-count="openCount"
          :rail-open="railOpen"
          @update:armed="setArmed"
          @update:color="setColor"
          @update:filter="filter = $event"
          @clean-view="cleanView = true"
          @toggle-rail="railOpen = !railOpen"
        />
      </div>
    </div>

    <!-- Clean view: the page as the public sees it; one floating pill to exit. -->
    <UButton
      v-else
      class="ann-clean-pill fixed bottom-4 right-4 z-40 shadow-lg"
      data-test="ann-clean-exit"
      size="sm"
      color="neutral"
      variant="solid"
      icon="i-lucide-eye"
      label="Show review tools"
      @click="cleanView = false"
    />

    <!-- The comments rail: a right-edge slide-over drawer at every width
         (spec D2). A labelled modal dialog: focus hops in on open, Tab wraps,
         Escape closes and restores focus. -->
    <div
      v-if="railOpen && !cleanView"
      ref="drawerEl"
      data-test="ann-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Review comments"
      class="ann-rail-drawer fixed inset-y-0 right-0 z-[60] w-80 max-w-full overflow-y-auto border-l border-default bg-default p-3 shadow-xl"
      @keydown="onDrawerKeydown"
    >
      <div class="mb-2 flex justify-end">
        <UButton data-test="ann-drawer-close" size="xs" variant="ghost" color="neutral" icon="i-lucide-x" aria-label="Close comments" @click="railOpen = false" />
      </div>
      <AnnotationRail
        :threads="threads"
        :filter="filter"
        :active-id="activeId"
        :saved-name="savedName"
        :load-failed="ann.loadFailed.value"
        @reply="onReply"
        @resolve="onResolve"
        @remove="onRemove"
        @jump="jumpToMark"
      />
    </div>

    <AnnotationComposer
      v-if="composer"
      :position="composer.position"
      :quote="composer.anchor.exact"
      :initial-name="savedName"
      @save="saveComposer"
      @cancel="cancelComposer"
    />

    <p class="sr-only" role="status" aria-live="polite">{{ announce }}</p>
  </div>
</template>
```

- [ ] **Step 2: Mount from `app/layouts/default.vue`** (replace the whole file)

```vue
<script setup lang="ts">
import { hub } from '../../hub.config.mjs'

// Manager-annotation review layer (dev preview only). Client-only: it is
// pure DOM overlay and must never run during prerender. The flag is the
// permanent kill switch — see hub.config.mjs.
const annotationsEnabled = hub.annotations.enabled
</script>

<template>
  <div class="flex min-h-screen flex-col bg-elevated/50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-inverted"
    >
      Skip to main content
    </a>

    <AppHeader />

    <ClientOnly v-if="annotationsEnabled">
      <AnnotationLayer />
    </ClientOnly>

    <main
      id="main-content"
      class="w-full flex-1"
    >
      <slot />
    </main>

    <AppFooter />
    <AppStatusBar />
  </div>
</template>
```

- [ ] **Step 3: Verify static checks**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 4: Manual smoke on the dev server (real Supabase)**

Run: `pnpm dev` (leave running). In a browser at `http://localhost:3000/researchhub/`:
1. The Review bar appears under the header on every page.
2. Click **Highlight**, select a sentence → composer opens; Save disabled until name AND comment filled; save → mark painted (pastel + colored underline), drawer shows the card.
3. Reply on the card (name remembered — no name input the second time). Resolve → mark dims. Reload the page → everything persists. Second browser/incognito → same threads visible.
4. **Clean view** → bar, marks, drawer all vanish; floating "Show review tools" pill bottom-right; click it → everything returns.
5. Delete → inline "Delete this thread?" confirm → thread gone (check Supabase or reload).
6. Navigate to another page → bar persists, threads are per-page.
7. Keyboard: Tab to the bar (one stop), arrows move; arm, select text with keyboard, press Enter → composer opens; Esc cancels and restores focus.
8. Dark mode: marks keep dark ink on pastel; drawer/composer legible.

Screenshot verification MUST use viewcap (`mcp__viewcap__take_screenshot`), not a background Chrome-MCP tab (project memory: hidden tabs break rendering).

- [ ] **Step 5: Commit**

```bash
git add app/components/annotation/AnnotationLayer.vue app/layouts/default.vue
git commit -m "feat(annotations): global annotation layer — bar, capture, drawer, clean view"
```

---

### Task 14: Playwright smoke + full a11y suite

**Files:**
- Create: `tests/a11y/annotations.spec.ts`

**Interfaces:**
- Consumes: the generated site (Tasks 1–13); `data-test` hooks from Tasks 10–13.
- Produces: e2e coverage: toolbar axe-clean, create flow (mocked Supabase), reply flow, drawer axe-clean.

- [ ] **Step 1: Create `tests/a11y/annotations.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hub } from '../../hub.config.mjs'

// The annotation layer against a MOCKED Supabase (route interception) — the
// static-output test server has no network guarantees. One stateful row per
// test: POST stores it, later GETs return it, PATCH merges into it.
const REST = '**/rest/v1/copperhead_annotations*'

test.describe('manager annotations', () => {
  test.beforeEach(async ({ page }) => {
    let row: Record<string, unknown> | null = null
    await page.route(REST, async (route) => {
      const req = route.request()
      const method = req.method()
      if (method === 'GET') {
        await route.fulfill({ json: row ? [row] : [] })
      }
      else if (method === 'POST') {
        row = {
          ...JSON.parse(req.postData() ?? '{}'),
          id: '11111111-1111-4111-8111-111111111111',
          created_at: '2026-07-21T12:00:00Z',
        }
        await route.fulfill({ status: 201, json: [row] })
      }
      else if (method === 'PATCH') {
        row = { ...row, ...JSON.parse(req.postData() ?? '{}') }
        await route.fulfill({ json: [row] })
      }
      else {
        await route.fulfill({ status: 204, body: '' })
      }
    })
    await page.goto(hub.site.baseURL)
  })

  test('toolbar renders on every page and is axe-clean', async ({ page }) => {
    await expect(page.locator('[data-test="ann-arm"]')).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('select text → composer (name + comment required) → mark + card; reply works', async ({ page }) => {
    // Arming opens the drawer too (studio behavior). The drawer overlays the
    // right edge only, so selecting text in main is unaffected.
    await page.locator('[data-test="ann-arm"]').click()
    await expect(page.locator('[data-test="ann-drawer"]')).toBeVisible()

    // Keyboard-create path: select the first substantial text node in main,
    // then blur (interactive/chrome targets never yield Enter to the create
    // path — the drawer's close button holds focus after opening).
    await page.evaluate(() => {
      const main = document.getElementById('main-content')!
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
      let node: Text | null = null
      while (walker.nextNode()) {
        const t = walker.currentNode as Text
        if (t.data.trim().length >= 20) { node = t; break }
      }
      if (!node) throw new Error('no text node to select')
      const range = document.createRange()
      range.setStart(node, 0)
      range.setEnd(node, 15)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await page.keyboard.press('Enter')

    // Composer: save is disabled until BOTH fields are filled.
    const save = page.locator('[data-test="ann-save"]')
    await expect(save).toBeDisabled()
    await page.locator('[data-test="ann-name"]').fill('QA')
    await expect(save).toBeDisabled()
    await page.locator('.ann-composer textarea').fill('Looks good to me')
    await expect(save).toBeEnabled()
    await save.click()

    // Mark painted; the open drawer shows the thread.
    await expect(page.locator('mark.ann[data-ann-id]').first()).toBeVisible()
    const card = page.locator('[data-test="ann-card"]')
    await expect(card).toContainText('QA')
    await expect(card).toContainText('Looks good to me')

    // Axe with the drawer open.
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])

    // Reply (name remembered from the composer — no per-card name input).
    await expect(page.locator('[data-test="ann-reply-name"]')).toHaveCount(0)
    await page.locator('[data-test="ann-reply-input"]').fill('Second thought: ship it')
    await page.locator('[data-test="ann-reply-send"]').click()
    await expect(card).toContainText('Second thought: ship it')
  })

  test('clean view hides all review chrome and the pill restores it', async ({ page }) => {
    await page.locator('[data-test="ann-clean-toggle"]').click()
    await expect(page.locator('[data-test="ann-arm"]')).toHaveCount(0)
    await expect(page.locator('mark.ann')).toHaveCount(0)
    const pill = page.locator('[data-test="ann-clean-exit"]')
    await expect(pill).toBeVisible()
    await pill.click()
    await expect(page.locator('[data-test="ann-arm"]')).toBeVisible()
  })
})
```

- [ ] **Step 2: Generate and run the full a11y suite**

Run: `pnpm generate && pnpm test:a11y`
Expected: ALL specs pass (both light and dark projects), including the pre-existing `pages.spec.ts` and `keyboard.spec.ts` now rendering the bar on every page. If an existing spec fails on annotation chrome (contrast, names, keyboard order), fix the component — never the test — and re-run.

- [ ] **Step 3: Commit**

```bash
git add tests/a11y/annotations.spec.ts
git commit -m "test(annotations): e2e smoke — create/reply/clean-view + axe with chrome open"
```

---

### Task 15: Kill-switch proof, docs, release

**Files:**
- Modify: `README.md` (new "Manager annotations (dev preview)" section)
- Modify: `docs/ICJIA-Hub-20-rewrite-copperhead.md` (running changelog entry)
- Modify: `ROADMAP.md` (feature entry)
- Modify: `CHANGELOG.md` (0.27.0 entry)
- Modify: `package.json` (version 0.26.0 → 0.27.0)

- [ ] **Step 1: Prove the kill switch strips the feature**

```bash
sed -i '' 's/^    enabled: true,$/    enabled: false,/' hub.config.mjs
pnpm generate
grep -rl "supabase.co" .output/public | wc -l        # expect: 0
grep -rl "ann-bar" .output/public/researchhub/_nuxt | wc -l   # expect: 0
git checkout hub.config.mjs
```

Expected: both greps report **0** with the flag off. Then regenerate the real artifact:

```bash
pnpm generate
grep -rl "supabase.co" .output/public | head -3      # expect: at least one hit (feature present)
```

- [ ] **Step 2: README section**

Add under the existing feature/tooling sections (match the README's heading level and tone):

```markdown
## Manager annotations (dev preview)

Every page carries a review toolbar (under the header): arm **Highlight**,
select text, and leave a comment thread — name or initials required. Threads
are public to every visitor of the dev site, support replies,
resolve/reopen, and delete (with confirm), and persist in Supabase
(project `efgevsdftkrancswojcz`, table `copperhead_annotations`).
**Clean view** shows the site exactly as the public will see it.
Spec: `docs/superpowers/specs/2026-07-21-manager-annotations-design.md`.

### Turning annotations off for go-live (permanent)

1. In `hub.config.mjs` set `annotations.enabled: false`.
2. In `netlify.toml` remove `https://efgevsdftkrancswojcz.supabase.co` from
   `connect-src`.
3. Rebuild/deploy. Verify: `grep -rl "supabase.co" .output/public` returns
   nothing.
4. Optional cleanup: export anything worth keeping, then drop the
   `copperhead_annotations` table in Supabase.
```

- [ ] **Step 3: Running-changelog entry in `docs/ICJIA-Hub-20-rewrite-copperhead.md`**

Locate the running changelog section (search for the most recent dated entry near "changelog" in that document) and add, matching its existing entry format, dated **2026-07-21**:

> Added manager annotations (dev-preview only): select-text highlights with public comment threads (name required, replies, resolve, delete) on every page, stored in Supabase, with Clean view and a permanent `hub.config.mjs` kill switch for go-live. New palette (orange/violet/teal/lime + underline) distinct from Studio's reviewer annotations.

- [ ] **Step 4: ROADMAP + CHANGELOG + version**

- `ROADMAP.md`: add the annotations item as shipped 2026-07-21. Read the file first and match its existing structure (it has shipped/planned groupings); the item text: *"Manager annotations — select-text highlights with public comment threads on every page (dev preview; permanent kill switch for go-live)."*
- `CHANGELOG.md`: read the file's entry format first, then add at the top (adjusting heading style to match):

  ```markdown
  ## 0.27.0 — 2026-07-21

  ### Added
  - Manager annotations (dev preview): arm Highlight, select text on any page,
    and leave a comment thread — name or initials required. Threads are visible
    to every visitor, support replies, resolve/reopen, and delete-with-confirm,
    and persist in Supabase across sessions and devices.
  - Review toolbar (sticky, roving-tabindex), right-side comments drawer,
    Clean view with floating exit pill, orange/violet/teal/lime highlight
    palette with colored underlines (dark-mode-safe ink).
  - Permanent go-live kill switch: `annotations.enabled` in hub.config.mjs
    strips the feature and all Supabase references from the build (runbook in
    README).
  - Unit suites for anchoring, painting, composer clamping, rail ordering,
    prefs, and the Supabase store; Playwright smoke + axe coverage for the
    annotation chrome.

  ### Changed
  - netlify.toml CSP `connect-src` gains the Supabase origin (removed at
    go-live per the runbook).
  ```

- `package.json`: `"version": "0.27.0"`.

- [ ] **Step 5: Full final verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:a11y`
Expected: ALL PASS (a11y suite reuses the Step 1 regenerated `.output/public`).

- [ ] **Step 6: Commit**

```bash
git add README.md docs/ICJIA-Hub-20-rewrite-copperhead.md ROADMAP.md CHANGELOG.md package.json
git commit -m "docs(annotations): runbook, changelogs, roadmap; release 0.27.0"
```

---

## Post-plan notes for the reviewer

- **Deviation ledger** (all approved in the spec §9): clean-view exit pill (D1), drawer-at-all-widths / no aligned rail (D2), name capture (D3), open delete with confirm (D4), Supabase storage (D5), pagePath keying (D6), kill switch (D7).
- **Not in scope** (spec §10): realtime sync, editing/deleting single replies, nested threads, auth, orphan re-attachment, `/reader` PDF-canvas text.
- The Supabase table is live and pre-verified (anon read 200 / delete 204 with the `apikey` header) — implementation never needs the Supabase dashboard.
