<script setup lang="ts">
/**
 * Articles listing. Filter state lives in the URL (?q, ?type, ?topic,
 * ?author, ?year, ?view) so every filtered view is shareable and
 * back/forward-safe. Addresses the three Hub 2.0 stakeholder concerns:
 * reports in one click (type chips), author names (author filter),
 * search highlighting (HighlightText in both card variants).
 */
import { hub as hubConfig } from '../../../hub.config.mjs'

useSeoMeta({
  title: 'Articles and Reports — ICJIA Research Hub',
  description: 'Research articles and reports published by the Illinois Criminal Justice Information Authority.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}articles/` }],
})

// Note: an LCP-image preload was tried here and removed — it crashed
// unhead during hydration (reactive second useHead) and measured zero
// LCP benefit; eager+fetchpriority on the first cards does the work.

const route = useRoute()
const router = useRouter()

const { data: articles, error } = await useAsyncData('articles-index', () => fetchArticleSummaries())

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: `Articles listing fetch failed: ${error.value.message}`,
    fatal: true,
  })
}

/** One URL-synced filter param (empty string = not filtering). */
function useQueryFilter(name: string) {
  return computed<string>({
    get: () => {
      const value = route.query[name]
      return typeof value === 'string' ? value : ''
    },
    set: (value) => {
      router.replace({ query: { ...route.query, [name]: value || undefined } })
    },
  })
}

const search = useQueryFilter('q')
const selectedType = useQueryFilter('type')
const selectedTopic = useQueryFilter('topic')
const selectedAuthor = useQueryFilter('author')
const selectedYear = useQueryFilter('year')

const view = computed<'grid' | 'list'>({
  get: () => (route.query.view === 'list' ? 'list' : 'grid'),
  set: (value) => {
    router.replace({ query: { ...route.query, view: value === 'list' ? 'list' : undefined } })
  },
})

function setView(value: 'grid' | 'list'): void {
  view.value = value
}

// Quick chips: the most common publication types, one click away.
const typeChips = computed(() => {
  const counts = new Map<string, number>()
  for (const article of articles.value ?? []) {
    if (article.type) counts.set(article.type, (counts.get(article.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([type]) => type)
})

function optionsFrom(values: Iterable<string>, allLabel: string) {
  return [allLabel, ...[...new Set(values)].filter(Boolean).sort()]
}

const typeOptions = computed(() => [
  { label: 'All Types', value: 'All Types' },
  ...[...new Set((articles.value ?? []).map(a => a.type ?? '').filter(Boolean))]
    .sort()
    .map(type => ({ label: formatTypeLabel(type), value: type })),
])

const topicOptions = computed(() =>
  optionsFrom((articles.value ?? []).flatMap(a => a.categories), 'All Topics'))

const authorOptions = computed(() =>
  optionsFrom((articles.value ?? []).flatMap(a => a.authors.map(author => author.name)), 'All Authors'))

const yearOptions = computed(() =>
  ['All Years', ...[...new Set((articles.value ?? []).map(a => a.date?.slice(0, 4)).filter((y): y is string => !!y))].sort().reverse()])

/** USelect needs a concrete value; '' maps to the "All …" option. */
function selectModel(filter: { value: string }, allLabel: string) {
  return computed<string>({
    get: () => filter.value || allLabel,
    set: (value) => {
      filter.value = value === allLabel ? '' : value
    },
  })
}

const typeModel = selectModel(selectedType, 'All Types')
const topicModel = selectModel(selectedTopic, 'All Topics')
const authorModel = selectModel(selectedAuthor, 'All Authors')
const yearModel = selectModel(selectedYear, 'All Years')

// Sort (Figma: "Sort by" control). Data arrives newest-first from the CMS.
const selectedSort = useQueryFilter('sort')
const sortModel = computed<string>({
  get: () => selectedSort.value || 'newest',
  set: (value) => {
    selectedSort.value = value === 'newest' ? '' : value
  },
})
const sortOptions = [
  { label: 'Sort: Most Recent', value: 'newest' },
  { label: 'Sort: Oldest', value: 'oldest' },
  { label: 'Sort: Title A–Z', value: 'title' },
]

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  const rows = (articles.value ?? []).filter((article) => {
    if (selectedType.value && article.type !== selectedType.value) return false
    if (selectedTopic.value && !article.categories.includes(selectedTopic.value)) return false
    if (selectedAuthor.value && !article.authors.some(a => a.name === selectedAuthor.value)) return false
    if (selectedYear.value && !article.date.startsWith(selectedYear.value)) return false
    if (term && !(`${article.title} ${article.abstract}`.toLowerCase().includes(term))) return false
    return true
  })
  if (sortModel.value === 'oldest') return [...rows].reverse()
  if (sortModel.value === 'title') return [...rows].sort((a, b) => a.title.localeCompare(b.title))
  return rows
})

// Hub 1.0 parity: incremental loading, 42 per page.
const visibleCount = ref(hubConfig.content.listingPageSize)
const loadingMore = ref(false)
const loadMoreStatus = ref('')
const resultsList = ref<HTMLElement | null>(null)
watch([search, selectedType, selectedTopic, selectedAuthor, selectedYear], () => {
  visibleCount.value = hubConfig.content.listingPageSize
  loadMoreStatus.value = ''
})
const visible = computed(() => filtered.value.slice(0, visibleCount.value))

/**
 * Append the next page in place: spinner on the button while the list
 * patches, and the viewport actively held still. A scroll listener snaps
 * the position back for the whole load window, and for a grace period
 * afterwards any sudden move toward the top is reverted — so no browser
 * quirk, focus side effect, or anchoring behavior can jump the page.
 * When the last page lands the button disappears, so focus moves to the
 * first newly revealed card instead of dropping to the document body.
 */
async function loadMore(): Promise<void> {
  if (loadingMore.value) return
  loadingMore.value = true
  const anchorY = window.scrollY
  const firstNewIndex = visibleCount.value
  const hold = () => window.scrollTo(0, anchorY)
  window.addEventListener('scroll', hold)
  try {
    // One painted frame with the spinner before the heavy list patch.
    await new Promise(resolve => setTimeout(resolve, 300))
    visibleCount.value += hubConfig.content.listingPageSize
    await nextTick()
    hold()
    // Keep holding through the next two paints.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined))))
  }
  finally {
    window.removeEventListener('scroll', hold)
    hold()
  }
  // Grace period: normal scrolling passes, a top-jump gets snapped back.
  const guardTopJump = () => {
    if (window.scrollY < anchorY - 1500) window.scrollTo(0, anchorY)
  }
  window.addEventListener('scroll', guardTopJump)
  setTimeout(() => window.removeEventListener('scroll', guardTopJump), 2000)
  loadMoreStatus.value = `Showing ${visible.value.length} of ${filtered.value.length} articles`
  if (visibleCount.value >= filtered.value.length) {
    resultsList.value
      ?.querySelectorAll(':scope > li')[firstNewIndex]
      ?.querySelector('a')
      ?.focus({ preventScroll: true })
  }
  loadingMore.value = false
}

function toggleTypeChip(type: string): void {
  selectedType.value = selectedType.value === type ? '' : type
}

const hasActiveFilters = computed(() =>
  !!(search.value || selectedType.value || selectedTopic.value || selectedAuthor.value || selectedYear.value))

function clearFilters(): void {
  router.replace({ query: route.query.view === 'list' ? { view: 'list' } : {} })
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-7xl px-4 py-10">
      <h1 class="text-3xl font-bold text-highlighted">
        Articles and Reports
      </h1>

      <!-- Quick type chips: one-click filters for common publication types -->
      <div
        class="mt-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Quick publication-type filters"
      >
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-semibold"
          :class="!selectedType
            ? 'bg-icjia-800 text-white'
            : 'border border-default text-toned hover:text-primary'"
          :aria-pressed="!selectedType"
          @click="selectedType = ''"
        >
          Show All
        </button>
        <button
          v-for="type in typeChips"
          :key="type"
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-semibold capitalize"
          :class="selectedType === type
            ? 'bg-icjia-800 text-white'
            : 'border border-default text-toned hover:text-primary'"
          :aria-pressed="selectedType === type"
          @click="toggleTypeChip(type)"
        >
          {{ formatTypeLabel(type) }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-semibold text-toned">Filter by:</span>
        <UInput
          :model-value="search"
          icon="i-lucide-search"
          placeholder="Search articles…"
          class="w-full sm:w-64"
          aria-label="Search articles"
          @update:model-value="search = $event"
        />
        <USelect
          v-model="typeModel"
          :items="typeOptions"
          class="w-40 capitalize"
          aria-label="Filter by publication type"
        />
        <USelect
          v-model="topicModel"
          :items="topicOptions"
          class="w-40 capitalize"
          aria-label="Filter by topic"
        />
        <USelect
          v-model="authorModel"
          :items="authorOptions"
          class="w-48"
          aria-label="Filter by author"
        />
        <USelect
          v-model="yearModel"
          :items="yearOptions"
          class="w-32"
          aria-label="Filter by year"
        />
        <USelect
          v-model="sortModel"
          :items="sortOptions"
          class="w-44"
          aria-label="Sort articles"
        />
        <UButton
          v-if="hasActiveFilters"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          label="Clear"
          @click="clearFilters"
        />
        <p
          class="ml-auto text-sm text-muted"
          aria-live="polite"
        >
          {{ filtered.length }} of {{ articles?.length }} articles
        </p>
        <div
          class="flex gap-1"
          role="group"
          aria-label="View mode"
        >
          <UButton
            icon="i-lucide-layout-grid"
            :color="view === 'grid' ? 'primary' : 'neutral'"
            :variant="view === 'grid' ? 'solid' : 'ghost'"
            aria-label="Grid view"
            :aria-pressed="view === 'grid'"
            @click="setView('grid')"
          />
          <UButton
            icon="i-lucide-list"
            :color="view === 'list' ? 'primary' : 'neutral'"
            :variant="view === 'list' ? 'solid' : 'ghost'"
            aria-label="List view"
            :aria-pressed="view === 'list'"
            @click="setView('list')"
          />
        </div>
      </div>

      <h2 class="sr-only">
        Results
      </h2>
      <ul
        v-if="view === 'grid'"
        ref="resultsList"
        class="mt-8 grid gap-6 [overflow-anchor:none] sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="(article, index) in visible"
          :key="article.documentId"
        >
          <ArticleCard
            :article="article"
            :highlight="search"
            :eager="index < 3"
          />
        </li>
      </ul>
      <ul
        v-else
        ref="resultsList"
        class="mt-8 space-y-4 [overflow-anchor:none]"
        role="list"
      >
        <li
          v-for="article in visible"
          :key="article.documentId"
        >
          <ArticleListRow
            :article="article"
            :highlight="search"
          />
        </li>
      </ul>

      <p
        v-if="!filtered.length"
        class="mt-10 text-center text-muted"
      >
        No articles match the current filters.
      </p>

      <p
        class="sr-only"
        role="status"
      >
        {{ loadMoreStatus }}
      </p>
      <div
        v-if="visibleCount < filtered.length"
        class="mt-10 text-center"
      >
        <UButton
          type="button"
          color="primary"
          size="lg"
          :loading="loadingMore"
          :label="loadingMore
            ? 'Loading more articles…'
            : `Load More Articles (${filtered.length - visibleCount} remaining)`"
          @click.prevent.stop="loadMore"
        />
      </div>
    </div>
    <NewsletterBand class="mt-12" />
  </div>
</template>
