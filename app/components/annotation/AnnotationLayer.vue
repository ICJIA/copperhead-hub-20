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
/** True once mounted, so the header-teleported review toggle has its target. */
const teleportReady = ref(false)
const activeId = ref<string | null>(null)
const savedName = ref('')
/** Pending composer state: anchor captured, waiting for name + body. */
const composer = ref<{ anchor: AnnotationAnchor, position: { x: number, y: number } } | null>(null)
/** document.activeElement at composer open — restored on cancel; superseded
 *  by a focus-the-new-mark hop on save (studio pattern). */
const composerReturnFocus = ref<Element | null>(null)
/** id → resolved start offset (null = orphan). Drives rail order + orphan flags. */
const resolvedStarts = ref<Record<string, number | null>>({})
/** id → document-order number (1-based, over the visible painted set). The same
 *  number badges the highlight and its rail card, so it's clear which is which. */
const annNumbers = ref<Record<string, number>>({})
/** One leader line per rendered card → its highlight (viewport px). Drawn at
 *  lg+ with the mark on screen (see updateLeaders); the active one is bolder. */
const leaders = ref<Array<{ id: string, x1: number, y1: number, x2: number, y2: number, stroke: string, active: boolean }>>([])
let leaderRaf = 0
/** Per-palette line color — matches each highlight's underline. */
const LEADER_STROKE: Record<AnnotationColor, string> = {
  orange: '#f97316', violet: '#8b5cf6', teal: '#14b8a6', lime: '#84cc16',
}

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

/** UButton types native `onClick` as `(e: MouseEvent) => void | Promise<void>`,
 *  so a bare `@click="ref = value"` assignment (whose expression evaluates to
 *  the assigned value, not void) fails typecheck — named handlers instead. */
function toggleCleanView() {
  cleanView.value = !cleanView.value
}
function closeDrawer() {
  railOpen.value = false
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
  // Pass 1: resolve every anchor to a text span (null = orphan).
  const starts: Record<string, number | null> = {}
  const spans = new Map<string, { start: number, end: number }>()
  for (const a of ann.annotations.value) {
    const span = resolveAnchor(container, a.anchor)
    starts[a.id] = span ? span.start : null
    if (span) spans.set(a.id, span)
  }
  resolvedStarts.value = starts
  // Number the painted (positioned + visible) set by document order, so the
  // badges run 1..N top-to-bottom and match the rail cards.
  const numbers: Record<string, number> = {}
  ann.annotations.value
    .filter(a => spans.has(a.id) && visibleUnderFilter(a.resolved))
    .sort((a, b) => spans.get(a.id)!.start - spans.get(b.id)!.start)
    .forEach((a, i) => { numbers[a.id] = i + 1 })
  annNumbers.value = numbers
  // Pass 2: paint the visible set; badge the first segment of each.
  for (const a of ann.annotations.value) {
    const span = spans.get(a.id)
    if (!span || !visibleUnderFilter(a.resolved)) continue
    const marks = paintOffsets(container, span.start, span.end, a.id, a.color)
    marks.forEach((m, idx) => {
      if (a.resolved) m.classList.add('ann--resolved')
      if (a.id === activeId.value) m.classList.add('ann--active')
      m.setAttribute('aria-label', `Comment ${numbers[a.id] ?? ''} by ${a.authorName}: ${a.anchor.exact.slice(0, 60)}`)
      if (idx === 0 && numbers[a.id]) m.dataset.annNum = String(numbers[a.id])
    })
  }
  scheduleLeader()
}

/** Recompute a leader line for every rendered card → its highlight. Shown only
 *  at lg+ (drawer reserves space) with the drawer open and the mark on screen;
 *  each line ends at the drawer edge (it sits behind the drawer). */
function updateLeaders() {
  const drawer = drawerEl.value
  const container = annotationContainer()
  if (!wide.value || cleanView.value || !railOpen.value || !drawer || !container) {
    leaders.value = []
    return
  }
  const vh = window.innerHeight
  const out: typeof leaders.value = []
  for (const card of drawer.querySelectorAll<HTMLElement>('[data-card-id]')) {
    const id = card.dataset.cardId
    if (!id) continue
    const mark = container.querySelector<HTMLElement>(`mark[data-ann-id="${CSS.escape(id)}"]`)
    if (!mark) continue // orphaned or filtered out — no highlight to point at
    const m = mark.getBoundingClientRect()
    if (m.bottom < 0 || m.top > vh) continue // highlight scrolled off screen
    const c = card.getBoundingClientRect()
    const color = ann.annotations.value.find(a => a.id === id)?.color ?? 'orange'
    out.push({
      id,
      x2: m.right,
      y2: m.top + m.height / 2,
      x1: c.left,
      y1: c.top + Math.min(20, c.height / 2),
      stroke: LEADER_STROKE[color],
      active: id === activeId.value,
    })
  }
  leaders.value = out
}
function scheduleLeader() {
  if (leaderRaf) return
  leaderRaf = requestAnimationFrame(() => {
    leaderRaf = 0
    updateLeaders()
  })
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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openThread(mark.dataset.annId)
    }
    return
  }
  if (!armed.value || e.key !== 'Enter' || composer.value) return
  if (t && (t.closest(CREATE_ENTER_SKIP) || layerEl.value?.contains(t))) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  e.preventDefault()
  tryOpenComposerFromSelection()
}

/** Capture-phase click delegation. A painted highlight opens its thread and
 *  never navigates (even under a card's stretched link). While the highlighter
 *  is armed, content links don't navigate either, so managers can drag-select
 *  and annotate card text (see the `ann-arming` rules in annotations.css). */
function onDocumentClick(e: MouseEvent) {
  const t = e.target instanceof Element ? e.target : null
  const mark = t?.closest?.('mark[data-ann-id]') as HTMLElement | null
  if (mark?.dataset.annId) {
    e.preventDefault()
    e.stopPropagation()
    openThread(mark.dataset.annId)
    return
  }
  if (armed.value && t?.closest?.('a[href]') && annotationContainer()?.contains(t)) {
    e.preventDefault()
    e.stopPropagation()
  }
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
/** `lg` breakpoint. At/above it the drawer reserves page space and is
 *  NON-modal — the visible content stays reachable by keyboard and AT; below
 *  it the drawer overlays (near full-width) and is modal with a Tab trap. */
const wide = ref(true)
let drawerMql: MediaQueryList | undefined
function syncWide() {
  wide.value = drawerMql?.matches ?? true
}
watch(drawerShowing, async (open) => {
  // Reserve page space for the drawer (CSS pushes content left from `lg` up)
  // so the open drawer never hides the text being reviewed.
  document.body.classList.toggle('ann-drawer-open', open)
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
  if (e.key === 'Escape') {
    e.stopPropagation()
    railOpen.value = false
    return
  }
  if (e.key !== 'Tab') return
  if (wide.value) return // non-modal at lg+: let Tab reach the visible page content
  const focusables = Array.from(drawerEl.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select') ?? [])
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  }
  else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
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
// Re-aim (or hide) the leader line when the active thread, drawer, clean view,
// or breakpoint changes — after the DOM settles.
watch([activeId, railOpen, cleanView, wide], () => {
  nextTick(scheduleLeader)
})
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
  drawerMql = window.matchMedia('(min-width: 1024px)')
  syncWide()
  drawerMql.addEventListener('change', syncWide)
  teleportReady.value = true
  document.addEventListener('keydown', onDocumentKeydown)
  document.addEventListener('click', onDocumentClick, true)
  document.addEventListener('mouseup', onMouseUp)
  window.addEventListener('scroll', scheduleLeader, { passive: true })
  window.addEventListener('resize', scheduleLeader)
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
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('scroll', scheduleLeader)
  window.removeEventListener('resize', scheduleLeader)
  if (leaderRaf) cancelAnimationFrame(leaderRaf)
  if (contentPoll) clearInterval(contentPoll)
  const container = annotationContainer()
  if (container) clearAnnotations(container)
  armed.value = false
  cleanView.value = false
  syncArmingClasses()
  document.body.classList.remove('ann-drawer-open')
  drawerMql?.removeEventListener('change', syncWide)
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

    <!-- Persistent review toggle, teleported into the site header next to the
         color-mode toggle. Always available, so clean view is never a trap. -->
    <Teleport
      v-if="teleportReady"
      to="#review-toggle-slot"
    >
      <button
        type="button"
        data-test="ann-review-toggle"
        class="flex size-9 items-center justify-center rounded-md text-toned transition-colors hover:bg-elevated hover:text-primary"
        :class="{ 'text-primary': !cleanView }"
        :aria-pressed="String(!cleanView)"
        :aria-label="cleanView ? 'Show review tools' : 'Hide review tools (clean view)'"
        :title="cleanView ? 'Show review tools' : 'Hide review tools'"
        @click="toggleCleanView"
      >
        <UIcon
          :name="cleanView ? 'i-lucide-pencil-off' : 'i-lucide-pencil'"
          class="size-4.5"
          aria-hidden="true"
        />
      </button>
    </Teleport>

    <!-- The comments rail: a right-edge slide-over drawer at every width
         (spec D2). A labelled modal dialog: focus hops in on open, Tab wraps,
         Escape closes and restores focus. -->
    <div
      v-if="railOpen && !cleanView"
      ref="drawerEl"
      data-test="ann-drawer"
      role="dialog"
      :aria-modal="wide ? 'false' : 'true'"
      aria-label="Review comments"
      class="ann-rail-drawer fixed inset-y-0 right-0 z-[60] w-80 max-w-full overflow-y-auto border-l border-default bg-default p-3 shadow-xl"
      @keydown="onDrawerKeydown"
    >
      <div class="mb-2 flex justify-end">
        <UButton
          data-test="ann-drawer-close"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          aria-label="Close comments"
          @click="closeDrawer"
        />
      </div>
      <AnnotationRail
        :threads="threads"
        :filter="filter"
        :active-id="activeId"
        :numbers="annNumbers"
        :saved-name="savedName"
        :load-failed="ann.loadFailed.value"
        @reply="onReply"
        @resolve="onResolve"
        @remove="onRemove"
        @jump="jumpToMark"
      />
    </div>

    <!-- One leader line per card → its highlight (lg+ only); active is bolder. -->
    <svg
      v-if="leaders.length"
      class="ann-leader-line"
      aria-hidden="true"
    >
      <g
        v-for="l in leaders"
        :key="l.id"
        :opacity="l.active ? 1 : 0.7"
      >
        <path
          :d="`M ${l.x2} ${l.y2} C ${l.x2 + 48} ${l.y2}, ${l.x1 - 48} ${l.y1}, ${l.x1} ${l.y1}`"
          fill="none"
          :stroke="l.stroke"
          :stroke-width="l.active ? 2.5 : 1.5"
          stroke-dasharray="5 4"
        />
        <circle
          :cx="l.x2"
          :cy="l.y2"
          :r="l.active ? 4 : 3"
          :fill="l.stroke"
        />
      </g>
    </svg>

    <AnnotationComposer
      v-if="composer"
      :position="composer.position"
      :quote="composer.anchor.exact"
      :initial-name="savedName"
      @save="saveComposer"
      @cancel="cancelComposer"
    />

    <p
      class="sr-only"
      role="status"
      aria-live="polite"
    >
      {{ announce }}
    </p>
  </div>
</template>
