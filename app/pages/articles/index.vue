<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

useSeoMeta({
  title: 'Articles and Reports — ICJIA Research Hub',
  description: 'Research articles and reports published by the Illinois Criminal Justice Information Authority.',
})

const route = useRoute()

const { data: articles, error } = await useAsyncData('articles-index', () => fetchArticleSummaries())

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: `Articles listing fetch failed: ${error.value.message}`,
    fatal: true,
  })
}

const search = ref('')
const selectedType = ref('All Types')
const selectedYear = ref('All Years')

// Hub 1.0 parity: the grid/list toggle mirrors into ?view=list so views
// are shareable and survive back/forward navigation.
const router = useRouter()
const view = computed<'grid' | 'list'>({
  get: () => (route.query.view === 'list' ? 'list' : 'grid'),
  set: (value) => {
    router.replace({ query: { ...route.query, view: value === 'list' ? 'list' : undefined } })
  },
})

const typeOptions = computed(() => {
  const types = new Set<string>()
  for (const article of articles.value ?? []) {
    if (article.type) types.add(article.type)
  }
  return ['All Types', ...[...types].sort()]
})

const yearOptions = computed(() => {
  const years = new Set<string>()
  for (const article of articles.value ?? []) {
    const year = article.date?.slice(0, 4)
    if (year) years.add(year)
  }
  return ['All Years', ...[...years].sort().reverse()]
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (articles.value ?? []).filter((article) => {
    if (selectedType.value !== 'All Types' && article.type !== selectedType.value) return false
    if (selectedYear.value !== 'All Years' && !article.date.startsWith(selectedYear.value)) return false
    if (term && !(`${article.title} ${article.abstract}`.toLowerCase().includes(term))) return false
    return true
  })
})

// Hub 1.0 parity: incremental loading, 42 per page.
const visibleCount = ref(hubConfig.content.listingPageSize)
watch([search, selectedType, selectedYear], () => {
  visibleCount.value = hubConfig.content.listingPageSize
})
const visible = computed(() => filtered.value.slice(0, visibleCount.value))

function loadMore(): void {
  visibleCount.value += hubConfig.content.listingPageSize
}

function setView(value: 'grid' | 'list'): void {
  view.value = value
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-7xl px-4 py-10">
      <h1 class="text-3xl font-bold text-highlighted">
        Articles and Reports
      </h1>

      <div class="mt-6 flex flex-wrap items-end gap-3">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search articles…"
          class="w-full sm:w-72"
          aria-label="Search articles"
        />
        <USelect
          v-model="selectedType"
          :items="typeOptions"
          class="w-44 capitalize"
          aria-label="Filter by publication type"
        />
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          class="w-36"
          aria-label="Filter by year"
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

      <ul
        v-if="view === 'grid'"
        class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="article in visible"
          :key="article.documentId"
        >
          <ArticleCard :article="article" />
        </li>
      </ul>
      <ul
        v-else
        class="mt-8 space-y-4"
        role="list"
      >
        <li
          v-for="article in visible"
          :key="article.documentId"
        >
          <ArticleListRow :article="article" />
        </li>
      </ul>

      <p
        v-if="!filtered.length"
        class="mt-10 text-center text-muted"
      >
        No articles match the current filters.
      </p>

      <div
        v-if="visibleCount < filtered.length"
        class="mt-10 text-center"
      >
        <UButton
          color="primary"
          size="lg"
          :label="`Load More Articles (${filtered.length - visibleCount} remaining)`"
          @click="loadMore"
        />
      </div>
    </div>
    <NewsletterBand class="mt-12" />
  </div>
</template>
