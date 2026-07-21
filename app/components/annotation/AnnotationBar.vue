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
defineProps<{ armed: boolean, color: AnnotationColor, filter: Filter, openCount: number, railOpen: boolean }>()
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
    <div
      class="flex items-center gap-1"
      role="radiogroup"
      aria-label="Highlight color"
    >
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
