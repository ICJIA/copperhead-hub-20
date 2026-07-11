<script setup lang="ts">
import { hub as hubConfig } from '../../hub.config.mjs'
/**
 * Site search. Pagefind runs over the generated HTML — including the
 * document stubs written by scripts/build-doc-stubs.mjs — so queries
 * match words inside published PDFs/Office files. File hits carry
 * parent metadata and group under their parent item.
 *
 * The engine loads client-side via a @vite-ignore dynamic import (no
 * `unsafe-eval`, unlike the predecessor's `new Function` hack).
 */
useSeoMeta({
  title: 'Search — ICJIA Research Hub',
  description: 'Search Research Hub articles, datasets, and dashboards — including the contents of published documents.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}search/` }],
})

interface PagefindResultData {
  url: string
  excerpt: string
  meta: Record<string, string>
}

interface PagefindApi {
  init: () => Promise<void>
  debouncedSearch: (query: string) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] } | null>
}

interface PageHit {
  key: string
  title: string
  to: string
  excerptHtml: string
  attachments: AttachmentHit[]
}

interface AttachmentHit {
  key: string
  parentTitle: string
  parentTo: string
  fileType: string
  excerptHtml: string
}

const route = useRoute()
const router = useRouter()

const query = computed<string>({
  get: () => (typeof route.query.q === 'string' ? route.query.q : ''),
  set: (value) => {
    router.replace({ query: { ...route.query, q: value || undefined } })
  },
})

const engineState = ref<'idle' | 'ready' | 'unavailable'>('idle')
const searching = ref(false)
const groups = ref<PageHit[]>([])
const orphanAttachments = ref<AttachmentHit[]>([])
let pagefind: PagefindApi | null = null

async function loadEngine(): Promise<void> {
  if (pagefind || engineState.value === 'unavailable') return
  try {
    const base = useRuntimeConfig().app.baseURL
    pagefind = await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`) as PagefindApi
    await pagefind.init()
    engineState.value = 'ready'
  }
  catch {
    engineState.value = 'unavailable'
  }
}

function routerPath(pagefindUrl: string): string {
  return pagefindUrl.replace(/index\.html$/, '').replace(/\.html$/, '/')
}

let searchSeq = 0
async function runSearch(term: string): Promise<void> {
  await loadEngine()
  if (!pagefind || !term.trim()) {
    groups.value = []
    orphanAttachments.value = []
    return
  }
  const seq = ++searchSeq
  searching.value = true
  const response = await pagefind.debouncedSearch(term)
  // Stale-response guard (the predecessor pattern worth keeping).
  if (seq !== searchSeq || response === null) return

  const rows = await Promise.all(response.results.slice(0, 40).map(r => r.data()))
  if (seq !== searchSeq) return

  const pages: PageHit[] = []
  const attachments: AttachmentHit[] = []
  for (const row of rows) {
    const excerptHtml = sanitizeHtml(row.excerpt)
    if (row.meta.kind === 'attachment') {
      attachments.push({
        key: row.url,
        parentTitle: row.meta.parentTitle ?? 'Document',
        parentTo: row.meta.parentUrl ?? '/',
        fileType: row.meta.fileType ?? 'FILE',
        excerptHtml,
      })
    }
    else {
      pages.push({
        key: row.url,
        title: row.meta.title ?? row.url,
        to: routerPath(row.url),
        excerptHtml,
        attachments: [],
      })
    }
  }

  // Group file hits under their parent page when it also matched.
  const byPath = new Map(pages.map(page => [page.to, page]))
  const orphans: AttachmentHit[] = []
  for (const attachment of attachments) {
    const parent = byPath.get(attachment.parentTo)
    if (parent) parent.attachments.push(attachment)
    else orphans.push(attachment)
  }

  groups.value = pages
  orphanAttachments.value = orphans
  searching.value = false
}

watch(query, term => runSearch(term))

onMounted(() => {
  if (query.value) runSearch(query.value)
  else loadEngine()
})

const totalCount = computed(() =>
  groups.value.length
  + groups.value.reduce((sum, g) => sum + g.attachments.length, 0)
  + orphanAttachments.value.length)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <h1 class="text-3xl font-bold text-highlighted">
      Search
    </h1>
    <p class="mt-2 text-sm text-muted">
      Search articles, datasets, and dashboards — including the contents of
      published documents.
    </p>

    <UInput
      :model-value="query"
      icon="i-lucide-search"
      size="xl"
      placeholder="Search the Research Hub…"
      class="mt-6 w-full"
      aria-label="Search the Research Hub"
      autofocus
      @update:model-value="query = $event"
    />

    <UAlert
      v-if="engineState === 'unavailable'"
      color="warning"
      variant="subtle"
      class="mt-6"
      title="Search index unavailable"
      description="The search index has not been built for this environment."
      icon="i-lucide-alert-triangle"
    />

    <p
      v-if="query && engineState === 'ready'"
      class="mt-6 text-sm text-muted"
      aria-live="polite"
    >
      {{ totalCount }} result{{ totalCount === 1 ? '' : 's' }} for
      "{{ query }}"
    </p>

    <ol
      v-if="groups.length || orphanAttachments.length"
      class="mt-4 space-y-5"
    >
      <li
        v-for="group in groups"
        :key="group.key"
        class="rounded-lg border border-default bg-default p-5"
      >
        <h2 class="font-semibold text-highlighted">
          <NuxtLink
            :to="group.to"
            class="hover:text-primary hover:underline"
          >
            {{ group.title }}
          </NuxtLink>
        </h2>
        <p
          class="mt-1.5 text-sm text-muted [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5 dark:[&_mark]:bg-amber-400/30"
          v-html="group.excerptHtml"
        />
        <ul
          v-if="group.attachments.length"
          class="mt-3 space-y-2 border-l-2 border-primary/30 pl-4"
        >
          <li
            v-for="attachment in group.attachments"
            :key="attachment.key"
          >
            <p class="text-xs font-semibold tracking-wide text-primary uppercase">
              <UIcon
                name="i-lucide-paperclip"
                class="size-3.5 align-text-bottom"
                aria-hidden="true"
              />
              Match inside {{ attachment.fileType }} document
            </p>
            <p
              class="mt-0.5 text-sm text-muted [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5 dark:[&_mark]:bg-amber-400/30"
              v-html="attachment.excerptHtml"
            />
          </li>
        </ul>
      </li>

      <li
        v-for="attachment in orphanAttachments"
        :key="attachment.key"
        class="rounded-lg border border-default bg-default p-5"
      >
        <p class="text-xs font-semibold tracking-wide text-primary uppercase">
          <UIcon
            name="i-lucide-paperclip"
            class="size-3.5 align-text-bottom"
            aria-hidden="true"
          />
          Match inside {{ attachment.fileType }} document
        </p>
        <h2 class="mt-1 font-semibold text-highlighted">
          <NuxtLink
            :to="attachment.parentTo"
            class="hover:text-primary hover:underline"
          >
            {{ attachment.parentTitle }}
          </NuxtLink>
        </h2>
        <p
          class="mt-1.5 text-sm text-muted [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5 dark:[&_mark]:bg-amber-400/30"
          v-html="attachment.excerptHtml"
        />
      </li>
    </ol>

    <p
      v-else-if="query && engineState === 'ready' && !searching"
      class="mt-6 text-muted"
    >
      No results for "{{ query }}".
    </p>
  </div>
</template>
