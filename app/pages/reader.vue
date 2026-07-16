<script setup lang="ts">
/**
 * In-app PDF reader with search-term highlighting. Reached from search
 * results that matched inside a PDF: /reader?file=<cms-url>&q=<term>&title=…
 *
 * Client-only rendering (pdf.js needs the DOM + a worker); the prerendered
 * shell is the accessible "no document" state. Only files served by the
 * configured CMS origin may be opened — the reader is not a general proxy.
 */
import { hub as hubConfig } from '../../hub.config.mjs'

const route = useRoute()

const fileUrl = computed(() => (typeof route.query.file === 'string' ? route.query.file : ''))
const term = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const docTitle = computed(() => (typeof route.query.title === 'string' ? route.query.title : 'Document'))

// Security: only render PDFs served by the CMS. Anything else is refused —
// the reader must never fetch an arbitrary attacker-supplied URL.
const isAllowed = computed(() =>
  fileUrl.value.startsWith(`${hubConfig.cms.origin}/`) && /\.pdf($|\?)/i.test(fileUrl.value))

useSeoMeta({
  title: () => `${docTitle.value} — Document Reader — ICJIA Research Hub`,
  description: 'In-app document reader for the ICJIA Research Hub.',
  robots: 'noindex',
})

const reader = usePdfReader()
const pagesContainer = ref<HTMLElement | null>(null)

const backTo = computed(() => (term.value ? `/search?q=${encodeURIComponent(term.value)}` : '/search'))

const matchLabel = computed(() => {
  if (!term.value) return ''
  if (reader.matchCount.value > 0) {
    const position = reader.currentMatch.value ? `${reader.currentMatch.value} of ` : ''
    return `${position}${reader.matchCount.value} match${reader.matchCount.value === 1 ? '' : 'es'} for “${term.value}”`
  }
  // Only declare "no matches" once rendering has finished — mid-render the
  // count is still climbing.
  if (reader.status.value === 'ready') return `No matches for “${term.value}”`
  return ''
})

// The prerendered shell is the empty state (no query at build time), so on
// the client the reader container only mounts once isAllowed flips true —
// after onMounted would have fired. Watch both and load once, post-DOM, when
// the container actually exists.
let started = false
watch([isAllowed, pagesContainer], ([allowed, container]) => {
  if (started || !allowed || !container) return
  started = true
  reader.load({ url: fileUrl.value, query: term.value, container })
}, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-elevated/40">
    <!-- Toolbar -->
    <div class="sticky top-0 z-10 border-b border-default bg-default/95 backdrop-blur">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <UButton
          :to="backTo"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-arrow-left"
          label="Back to search"
        />
        <h1 class="min-w-0 flex-1 truncate text-sm font-semibold text-highlighted">
          {{ docTitle }}
        </h1>

        <!-- Match navigation -->
        <div
          v-if="term && isAllowed"
          class="flex items-center gap-2"
        >
          <p
            class="text-xs text-toned"
            aria-live="polite"
          >
            {{ matchLabel }}
          </p>
          <div
            v-if="reader.matchCount.value > 1"
            class="flex gap-1"
            role="group"
            aria-label="Navigate matches"
          >
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-up"
              aria-label="Previous match"
              @click="reader.prevMatch()"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-down"
              aria-label="Next match"
              @click="reader.nextMatch()"
            />
          </div>
        </div>

        <UButton
          v-if="isAllowed"
          :to="fileUrl"
          target="_blank"
          rel="noopener"
          color="primary"
          variant="outline"
          size="sm"
          icon="i-lucide-download"
          label="Download original"
        />
      </div>
    </div>

    <!-- No / invalid document: accessible shell (this is what prerenders) -->
    <div
      v-if="!isAllowed"
      class="mx-auto max-w-2xl px-4 py-20 text-center"
    >
      <UIcon
        name="i-lucide-file-x"
        class="mx-auto size-10 text-muted"
        aria-hidden="true"
      />
      <h2 class="mt-4 text-xl font-bold text-highlighted">
        No document to display
      </h2>
      <p class="mt-2 text-sm text-toned">
        This reader opens PDF documents from the Research Hub. Open one from a
        search result to read it here with your search term highlighted.
      </p>
      <UButton
        to="/search"
        color="primary"
        class="mt-6"
        icon="i-lucide-search"
        label="Go to search"
      />
    </div>

    <!-- Reader -->
    <div
      v-else
      class="mx-auto w-full max-w-5xl flex-1 px-4 py-6"
    >
      <p
        v-if="reader.status.value === 'loading'"
        class="flex items-center justify-center gap-2 py-20 text-sm text-toned"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin"
          aria-hidden="true"
        />
        Loading document…
      </p>

      <UAlert
        v-else-if="reader.status.value === 'error'"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Could not display this document"
        :description="`${reader.error.value} You can still download the original.`"
      />

      <p
        v-if="reader.status.value === 'rendering'"
        class="py-3 text-center text-xs text-muted"
        aria-live="polite"
      >
        Rendering page {{ reader.renderedCount.value }} of {{ reader.pageCount.value }}…
      </p>

      <!-- pdf.js renders page canvases + text layers into this container -->
      <div
        ref="pagesContainer"
        class="flex flex-col items-center gap-4"
        role="document"
        :aria-label="docTitle"
        :aria-busy="reader.status.value === 'rendering' || reader.status.value === 'loading'"
      />
    </div>
  </div>
</template>
