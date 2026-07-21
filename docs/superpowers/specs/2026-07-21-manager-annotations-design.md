# Manager annotations — design

**Date:** 2026-07-21
**Status:** approved (design approved in-session by cschweda)
**Provenance:** port of the copperhead-studio-20 reviewer-annotations feature
(`copperhead-studio-20/docs/superpowers/specs/2026-07-04-reviewer-annotations-design.md`),
adapted for a public, auth-less, statically generated site with Supabase storage.

## 1. Goal

Let managers reviewing the Copperhead dev site select text on **any page**,
highlight it, and attach a comment thread that appears in a right-side rail.
Comments persist across sessions and are visible to **everyone** viewing the
site — no accounts, no roles. Anyone can reply, resolve/reopen, or delete a
thread. A session-level "Clean view" shows the site exactly as it really
looks; a build-time kill switch removes the feature permanently at go-live.

Decisions locked with the user:

| Decision | Choice |
| --- | --- |
| Storage | Supabase project **holdem-simulator** (`efgevsdftkrancswojcz`, us-east-1), one new table — no new project (avoids ~$10/mo) |
| Access model | Fully public read/write via publishable key; no auth levels |
| Name | Required ("name or initials") on every comment and reply; remembered locally |
| Highlight palette | Orange / violet / teal / lime pastels + colored underline (distinct from the studio's yellow/green/blue/pink) |
| Toolbar | Studio-style sticky bar under the header (accepted ~48 px layout shift while the feature is enabled) |
| UX | "Exactly the same" as copperhead-studio wherever it transfers; deviations listed in §9 |

## 2. Architecture

Approach: **port the studio stack behind its storage seam.** The studio
splits the feature into storage-agnostic modules (anchor, paint, rail
layout, composer positioning, components) and a 5-method `AnnotationStore`
interface with swappable adapters (localStorage, Strapi). We port the
modules nearly verbatim and write one new adapter, `store-supabase.ts`.
No new npm dependencies — Supabase is plain PostgREST over Nuxt's `$fetch`.

Alternatives rejected: CSS Custom Highlight API overlay (the studio
deliberately rejected it — highlights would not be focusable or
screen-reader-reachable); third-party annotation services (different UX,
external accounts, no kill-switch control).

### File map (new unless noted)

```
app/types/annotations.ts                 domain types + store interface
app/lib/annotations/anchor.ts            text-quote capture/resolve (studio port)
app/lib/annotations/paint.ts             <mark> painting/clearing (studio port)
app/lib/annotations/composer-position.ts popover clamping (studio port)
app/lib/annotations/page-path.ts         route-path normalization (new)
app/lib/annotations/store-supabase.ts    AnnotationStore over PostgREST (new)
app/lib/annotations/prefs.ts             localStorage name/color prefs (new)
app/composables/useAnnotations.ts        reactive state + actions
app/components/annotations/AnnotationLayer.vue   orchestrator (studio AnnotatedPreview, reshaped)
app/components/annotations/AnnotationBar.vue     sticky toolbar (studio port)
app/components/annotations/AnnotationRail.vue    right drawer + cards (studio port)
app/components/annotations/AnnotationComposer.vue popover + name field (studio port + name)
app/assets/css/annotations.css           mark/bar/rail/composer styles (recolored)
app/layouts/default.vue                  (edit) mount <AnnotationLayer> client-only
hub.config.mjs                           (edit) `annotations` block — the kill switch
nuxt.config.ts                           (edit) load annotations.css when enabled
netlify.toml                             (edit) CSP connect-src + Supabase origin
tests/unit/…                             ported + new unit tests
```

## 3. Activation — the two "offs"

**Session toggles (studio-identical semantics).** Component state, per tab:

- `armed` — the Highlight button. Off by default. Arming force-opens the rail.
- `cleanView` — collapses all review chrome and unpaints every mark so the
  page renders exactly as the public will see it.
- `railOpen` — comments drawer visibility. Closed by default; highlights are
  painted by default for every visitor.

**Permanent kill switch (net-new, requested).** `hub.config.mjs`:

```js
annotations: {
  /** Manager review tool. Set false at go-live — removes the feature from the build. */
  enabled: true,
  supabase: {
    url: 'https://efgevsdftkrancswojcz.supabase.co',
    /** Publishable key — public by design; RLS is the security boundary. */
    publishableKey: '<filled at implementation>',
    table: 'copperhead_annotations',
  },
},
```

When `enabled: false`: the layout never renders `<AnnotationLayer>`,
`annotations.css` is not included, and no Supabase value reaches the bundle
(the config object is imported only inside the flag check; tree-shaking is
verified by asserting the generated output contains no `supabase.co`
string). Go-live runbook (README + this spec): flip the flag, remove the
Supabase origin from the CSP line in `netlify.toml`, optionally drop the
table. The publishable key is committed deliberately: on a static site it
ships in the JS bundle regardless, so the repo adds no exposure; RLS
policies and CHECK constraints are the actual boundary, and go-live removes
the feature entirely.

## 4. Scope & keying

- **Annotatable region:** `<main id="main-content">` — every page's content;
  header, footer, and status bar are excluded. The layer targets the element
  by id, so it works on all current and future pages with no per-page code.
- **Page identity:** `page_path` = normalized route path (`/articles/foo`):
  baseURL stripped if present, trailing slash stripped (root stays `/`),
  query/hash ignored. Stable across localhost, the Netlify preview origin,
  and the production proxy (URL-parity contract).
- **Anchoring:** studio text-quote model — `exact` (≤ 1000 chars) +
  32-char `prefix`/`suffix` + `offset` hint, measured over the container's
  concatenated text nodes. `resolveAnchor` re-finds the quote after content
  edits (candidate scoring by context agreement, tie-break by offset
  distance). Unresolvable → the thread stays in the rail flagged
  "text changed — highlight not found"; never auto-deleted.
- **Repaint triggers:** layer mount, route change (after content settles),
  after every data mutation, and the studio's 600 ms alignment poll (also
  re-resolves anchors when the container's text changes, e.g. client-side
  pagination). Selection capture rejects: empty/whitespace selections,
  selections leaving the container, selections > 1000 chars — with the
  studio's toast messaging.
- **Known limits (accepted):** canvas-rendered PDF text in `/reader` is not
  DOM text and cannot be annotated; annotations on transient dynamic content
  (e.g. a search-results list) may orphan when the content changes. Fine for
  a manager-preview tool.

## 5. Data model & Supabase

### Domain types (adapted from studio)

```ts
export const ANNOTATION_COLORS = ['orange', 'violet', 'teal', 'lime'] as const
export type AnnotationColor = (typeof ANNOTATION_COLORS)[number]

export interface AnnotationAnchor {
  exact: string; prefix: string; suffix: string; offset: number
}
export interface AnnotationComment {
  id: string; body: string; authorName: string; createdAt: string
}
export interface PageAnnotation {
  id: string
  pagePath: string
  anchor: AnnotationAnchor
  color: AnnotationColor
  resolved: boolean
  createdAt: string
  authorName: string            // thread creator = comments[0].authorName
  comments: AnnotationComment[] // [0] is the initial note; the rest are replies
}

/** PageAnnotation minus the server-assigned fields. */
export type NewPageAnnotation = Omit<PageAnnotation, 'id' | 'createdAt'>

export interface AnnotationStore {
  list(pagePath: string): Promise<PageAnnotation[]>
  create(a: NewPageAnnotation): Promise<PageAnnotation>
  addComment(id: string, c: AnnotationComment): Promise<PageAnnotation>
  setResolved(id: string, resolved: boolean): Promise<PageAnnotation>
  remove(id: string): Promise<void>
}
```

Changes vs. studio: `(contentType, documentId)` → single `pagePath`;
`authorEmail`/`roleLabel` dropped (no auth); flat one-level replies and the
single `resolved` boolean kept as-is. No comment editing (studio parity).

### Table (migration `create_copperhead_annotations`)

```sql
create table public.copperhead_annotations (
  id          uuid primary key default gen_random_uuid(),
  page_path   text not null check (char_length(page_path) <= 300),
  exact       text not null check (char_length(exact) <= 1000),
  prefix      text not null default '' check (char_length(prefix) <= 64),
  suffix      text not null default '' check (char_length(suffix) <= 64),
  offset_hint integer not null default 0,
  color       text not null default 'orange'
              check (color in ('orange','violet','teal','lime')),
  resolved    boolean not null default false,
  author_name text not null check (char_length(author_name) between 1 and 80),
  comments    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index on public.copperhead_annotations (page_path);
alter table public.copperhead_annotations enable row level security;
-- Deliberately open: crawl-blocked dev preview, no auth by requirement.
create policy "public read"   on public.copperhead_annotations for select using (true);
create policy "public insert" on public.copperhead_annotations for insert with check (true);
create policy "public update" on public.copperhead_annotations for update using (true) with check (true);
create policy "public delete" on public.copperhead_annotations for delete using (true);
```

Security advisors will flag the permissive policies — intentional and
documented. CHECK constraints bound junk writes; the endpoint disappears at
go-live.

### Store adapter (PostgREST via `$fetch`, no SDK)

- `list` — `GET /rest/v1/{table}?select=*&page_path=eq.{p}&order=created_at.asc`
- `create` — `POST` with `Prefer: return=representation` (DB assigns id)
- `addComment` / `setResolved` — read row, `PATCH` full `comments` array /
  `resolved`, `Prefer: return=representation`. **Last-write-wins**, the
  studio's documented concurrency trade-off — acceptable at manager scale.
- `remove` — `DELETE ?id=eq.{id}`
- Headers: `apikey: <publishableKey>` (+ `Authorization: Bearer` when the
  key is a legacy JWT-format anon key — decided at implementation from what
  `get_publishable_keys` returns).
- Failure handling: every **mutation** failure surfaces a Nuxt UI toast
  ("Couldn't save the comment…") and rethrows so the invoking UI stays open
  for a retry; the initial **load** failure is quiet (an inline
  "Comments unavailable" note in the rail) — a toast on every page
  navigation would spam offline sessions. The composable re-syncs state
  from the store response on success (studio's `replaceOne` pattern).
  No debounce, no batching, no realtime.

## 6. UI (ported from studio; palette and name capture are the deltas)

**AnnotationBar** — sticky directly under `AppHeader`, full-width, compact
(~48 px). Controls in studio order: Clean view toggle · Highlight (arm)
toggle · four color swatch radios · filter cycle (open → resolved → all) ·
Comments toggle with open-thread count. Roving-tabindex toolbar (one tab
stop; ←/→/Home/End). When `cleanView` is on, the bar and all marks and the
rail disappear; a single small fixed pill (bottom-right, above the status
bar) remains to exit clean view (see §9, deviation D1).

**Composer** — fixed popover at the selection (studio clamp math:
336×220 footprint, 16 px gutter). Fields: **Name or initials** (required,
≤ 80 chars, prefilled from prefs) and **Comment** (required textarea).
Save disabled until both are non-blank. Focus-trapped; Esc cancels;
saving clears the selection, paints, focuses the new mark, and announces
"Comment added" via a polite live region.

**Rail** — right-side slide-over drawer at **all** viewport widths
(studio's < lg drawer: `fixed inset-y-0 right-0 w-80`, dialog semantics,
focus trap, Esc closes). Cards stack in document order — sorted by each
thread's resolved start offset, orphans last (the studio's aligned-mode
collision layout is not ported; see D2). Card: color dot · author name ·
timestamp · quote snippet (button — click scrolls to and flashes the
mark) · full thread · reply input (Enter or send; requires a stored name —
if none, an inline name field appears above the reply input) · footer:
Resolve/Reopen · Delete. Delete asks an inline "Delete thread?"
confirm — available to everyone (this is the "remove annotations that no
longer apply" affordance). Orphaned threads show the studio's
"text changed — highlight not found" notice instead of a jump link.

**Marks** — real `<mark class="ann ann--{color}" data-ann-id tabindex="0"
role="button">` elements (studio paint module): click/Enter opens the rail
scrolled to that thread and sets it active (`ann--active` ring). Resolved
marks: 55 % opacity + dotted underline. Filter hides marks accordingly.

### Palette (the requested "different color")

| Name | Mark background | Underline (2px bottom border) |
| --- | --- | --- |
| orange | `#fed7aa` | `#f97316` |
| violet | `#ddd6fe` | `#8b5cf6` |
| teal   | `#99f6e4` | `#14b8a6` |
| lime   | `#d9f99d` | `#84cc16` |

Marks force dark ink (`color: #111827`) in **both** color modes so text on
the pastel stays WCAG AA in dark mode (the studio's `color: inherit` would
put light text on a pastel). Focus/active accent `#1d4ed8` (studio parity);
arming `::selection` tints per color; print styles strip all annotation
chrome and mark styling (studio parity). The palette lives in
`annotations.css`, the bar swatches, and the rail dots — same three spots
as the studio — plus the color CHECK constraint above.

### Local prefs (`app/lib/annotations/prefs.ts`)

- `copperhead-annotations-ui-v1:name` — last-used name; prefills composer
  and reply fields. Never trusted server-side (there is no server trust).
- `copperhead-annotations-ui-v1:color` — last-used swatch (studio parity).
- localStorage failures degrade silently to in-memory (studio pattern).

## 7. Accessibility

Port the studio's patterns intact: APG toolbar roving tabindex; marks
focusable with `role="button"`; composer and drawer focus-trapped with Esc;
polite `aria-live` announcements for add/reply/resolve/delete; drawer is
`role="dialog" aria-modal="true"`; color is never the only signal (dots +
names); reduced-motion respected (site-wide rule already disables
transitions). The existing Playwright + axe suite must stay green with the
bar mounted on every page.

## 8. Testing

- **Unit (vitest):** anchor capture/resolve (port studio's
  `annotations-anchor.test.ts`), rail card ordering, `page-path` normalization,
  prefs (quota failure fallback), `store-supabase` against a mocked
  `$fetch` (URL/headers/method assertions, comment-append RMW, error
  propagation), name/body validation.
- **E2E/a11y (Playwright):** existing axe suite green; one smoke: bar
  renders, arm → programmatic selection → composer opens → save posts
  (Supabase mocked via route interception).
- **Build:** `pnpm generate` succeeds; with `enabled: false` the output
  contains no `supabase.co` and no annotation chrome (assertion in the
  kill-switch test or a script grep).
- **Manual:** verify highlight/comment/reply/resolve/delete round-trip on
  the dev server with viewcap screenshots (background Chrome-MCP tabs
  break rendering — use viewcap per project memory), then on a Netlify
  deploy preview against real Supabase.

## 9. Deviations from copperhead-studio (all deliberate)

- **D1 — Clean-view exit control:** the studio keeps the collapsed toggle in
  the bar row; here the bar itself is page chrome, so clean view unmounts
  the bar and leaves a small floating exit pill instead. Rationale: "see
  the website as it actually looks" requires zero layout shift.
- **D2 — Rail is a drawer at all widths** (studio adds a Word-style aligned
  desktop aside). The aligned mode assumes the rail shares the content's
  scroll flow inside a preview column; on full-width pages an overlay
  drawer is the coherent equivalent.
- **D3 — Name capture** replaces signed-in attribution; email/role dropped.
- **D4 — Anyone can delete** (studio gates by role/creator). Confirm step
  retained.
- **D5 — Storage** is Supabase PostgREST instead of Strapi admin API;
  same 5-method store seam, same last-write-wins trade-off.
- **D6 — Keying** by `pagePath` instead of `(contentType, documentId)`.
- **D7 — Kill switch** is net-new (the studio ships everywhere by design).

## 10. Out of scope (YAGNI)

Realtime cross-viewer sync; editing or deleting individual replies; nested
threads; auth of any kind; orphan re-attachment UI; export/reporting;
annotation of PDF canvas text in `/reader`.

## 11. Docs & release (standing rule: keep docs current)

Update in the same change: `README.md` (feature section + go-live runbook),
`ICJIA-Hub-20-rewrite-copperhead.md` (running changelog),
`ROADMAP.md`, `CHANGELOG.md`, version bump to **0.27.0**.
