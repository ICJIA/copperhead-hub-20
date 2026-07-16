<script setup lang="ts">
/**
 * In-app PDF reader with search-term highlighting. Reached from search
 * results that matched inside a PDF: /reader?file=<cms-url>&q=<term>&title=…
 *
 * Rendering is pdf.js's own viewer components (see usePdfReader) — lazy,
 * virtualized, worker-managed. This page owns the site chrome (back to search,
 * title, match navigation, download) and the security guard; the composable
 * owns the document. Client-only: the prerendered shell is the accessible
 * "no document" state. Only files served by the configured CMS origin may be
 * opened — the reader is not a general proxy.
 */
import 'pdfjs-dist/web/pdf_viewer.css'
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
const viewerContainer = ref<HTMLDivElement | null>(null)
const viewerInner = ref<HTMLDivElement | null>(null)

const backTo = computed(() => (term.value ? `/search?q=${encodeURIComponent(term.value)}` : '/search'))

const matchLabel = computed(() => {
  if (!term.value) return ''
  if (reader.matchCount.value > 0) {
    const position = reader.currentMatch.value ? `${reader.currentMatch.value} of ` : ''
    return `${position}${reader.matchCount.value} match${reader.matchCount.value === 1 ? '' : 'es'} for “${term.value}”`
  }
  // Only declare "no matches" once the find scan has settled — mid-scan the
  // count is still climbing.
  if (reader.searchComplete.value) return `No matches for “${term.value}”`
  return ''
})

// The prerendered shell is the empty state (no query at build time), so on the
// client the viewer container only mounts once isAllowed flips true — after
// onMounted would have fired. Watch and load once, post-DOM, when the
// container (and its inner .pdfViewer) actually exist.
let started = false
watch([isAllowed, viewerContainer], ([allowed, container]) => {
  if (started || !allowed || !container || !viewerInner.value) return
  started = true
  reader.load({ url: fileUrl.value, query: term.value, container, viewer: viewerInner.value })
}, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="flex h-screen flex-col bg-elevated/40">
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

    <!-- Reader: pdf.js renders lazily into the scroll container below. -->
    <div
      v-else
      class="relative flex-1"
    >
      <div
        ref="viewerContainer"
        class="pdf-reader-viewport absolute inset-0 overflow-auto px-2 py-4 sm:px-4"
        role="document"
        :aria-label="docTitle"
        :aria-busy="reader.status.value === 'loading'"
      >
        <div
          ref="viewerInner"
          class="pdfViewer"
        />
      </div>

      <!-- Loading: overlaid so it never shifts the viewer layout -->
      <p
        v-if="reader.status.value === 'loading'"
        class="pointer-events-none absolute inset-x-0 top-24 flex items-center justify-center gap-2 text-sm text-toned"
        aria-live="polite"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin"
          aria-hidden="true"
        />
        Loading document…
      </p>

      <div
        v-else-if="reader.status.value === 'error'"
        class="absolute inset-x-0 top-16 mx-auto max-w-2xl px-4"
      >
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="Could not display this document"
          :description="`${reader.error.value} You can still download the original.`"
        />
      </div>
    </div>
  </div>
</template>
