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
  /** id → document-order number, matching the badge on each highlight. */
  numbers: Record<string, number>
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

function cancelDelete() {
  confirmingId.value = null
}

function confirmDelete(id: string) {
  emit('remove', id)
  confirmingId.value = null
}

function openConfirmDelete(id: string) {
  confirmingId.value = id
}

function updateDraft(id: string, value: string) {
  drafts.value = { ...drafts.value, [id]: value }
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
onMounted(() => {
  void scrollToActive(props.activeId)
})
</script>

<template>
  <section
    ref="rootEl"
    class="ann-rail"
    aria-label="Review comments"
  >
    <p
      v-if="loadFailed"
      class="p-3 text-sm text-warning"
    >
      Comments unavailable — couldn’t reach the comment service.
    </p>
    <p
      v-else-if="visible.length === 0"
      class="p-3 text-sm text-muted"
    >
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
        <span
          v-if="numbers[t.annotation.id]"
          class="ann-card-num"
          aria-hidden="true"
        >{{ numbers[t.annotation.id] }}</span>
        <span
          class="h-3 w-3 shrink-0 rounded-full"
          :class="`ann-dot--${t.annotation.color}`"
          aria-hidden="true"
        />
        <span class="text-sm font-medium">{{ t.annotation.authorName }}</span>
        <span class="text-xs text-muted">{{ timeOf(t.annotation.createdAt) }}</span>
        <span
          v-if="t.annotation.resolved"
          class="ml-auto text-xs text-muted"
        >Resolved</span>
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
      <p
        v-if="t.orphan"
        class="mt-1 text-xs text-warning"
      >
        <UIcon
          name="i-lucide-map-pin-off"
          class="align-text-bottom"
        /> text changed — highlight not found
      </p>

      <ul class="mt-2 space-y-2">
        <li
          v-for="c in t.annotation.comments"
          :key="c.id"
          class="text-sm"
        >
          <span class="font-medium">{{ c.authorName }}</span>
          <span class="ml-1 text-xs text-muted">{{ timeOf(c.createdAt) }}</span>
          <p class="whitespace-pre-wrap">
            {{ c.body }}
          </p>
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
            @input="updateDraft(t.annotation.id, ($event.target as HTMLInputElement).value)"
            @keydown.enter.prevent="sendReply(t.annotation.id)"
          >
          <UButton
            data-test="ann-reply-send"
            size="xs"
            variant="ghost"
            icon="i-lucide-reply"
            aria-label="Send reply"
            @click="sendReply(t.annotation.id)"
          />
        </div>
      </div>

      <footer class="mt-2">
        <div
          v-if="confirmingId === t.annotation.id"
          class="flex items-center gap-2"
        >
          <span class="text-xs font-medium text-error">Delete this thread?</span>
          <UButton
            data-test="ann-delete-confirm"
            size="xs"
            color="error"
            label="Delete"
            @click="confirmDelete(t.annotation.id)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="cancelDelete"
          />
        </div>
        <div
          v-else
          class="flex items-center gap-2"
        >
          <UButton
            data-test="ann-resolve"
            size="xs"
            :variant="t.annotation.resolved ? 'outline' : 'solid'"
            color="neutral"
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
            @click="openConfirmDelete(t.annotation.id)"
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
