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

const props = defineProps<{ position: { x: number, y: number }, quote: string, initialName: string }>()
const emit = defineEmits<{ save: [body: string, name: string], cancel: [] }>()

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
      "{{ quote }}"
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
      <UButton
        data-test="ann-cancel"
        size="xs"
        variant="ghost"
        color="neutral"
        label="Cancel"
        @click="emit('cancel')"
      />
      <UButton
        data-test="ann-save"
        size="xs"
        color="primary"
        label="Comment"
        :disabled="!canSave"
        @click="save"
      />
    </div>
  </div>
</template>
