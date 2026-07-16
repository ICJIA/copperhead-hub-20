<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

useSeoMeta({
  title: 'Analytics and Data — Datasets — ICJIA Research Hub',
  description: 'Downloadable criminal justice datasets published by the Illinois Criminal Justice Information Authority.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}datasets/` }],
})

const { data: datasets, error } = await useAsyncData('datasets-index', () => fetchAllDatasets())

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: `Datasets listing fetch failed: ${error.value.message}`,
    fatal: true,
  })
}

const search = ref('')

const sort = ref('newest')
const sortOptions = [
  { label: 'Sort: Most Recent', value: 'newest' },
  { label: 'Sort: Oldest', value: 'oldest' },
  { label: 'Sort: Title A–Z', value: 'title' },
]

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  const rows = !term
    ? (datasets.value ?? [])
    : (datasets.value ?? []).filter(dataset =>
        `${dataset.title} ${dataset.description}`.toLowerCase().includes(term),
      )
  if (sort.value === 'oldest') return [...rows].reverse()
  if (sort.value === 'title') return [...rows].sort((a, b) => a.title.localeCompare(b.title))
  return rows
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="text-3xl font-bold text-highlighted">
      Analytics and Data
    </h1>

    <div class="mt-6 flex flex-wrap items-center gap-4">
      <DataSectionTabs active="datasets" />
      <span class="text-sm font-semibold text-toned">Filter by:</span>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search datasets…"
        class="w-full sm:w-72"
        aria-label="Search datasets"
      />
      <USelect
        v-model="sort"
        :items="sortOptions"
        class="w-44"
        aria-label="Sort datasets"
      />
      <p
        class="ml-auto text-sm text-muted"
        aria-live="polite"
      >
        {{ filtered.length }} of {{ datasets?.length }} datasets
      </p>
    </div>

    <h2 class="sr-only">
      Results
    </h2>
    <TransitionGroup
      tag="ul"
      name="fade"
      class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      <li
        v-for="(dataset, index) in filtered"
        :key="dataset.documentId"
      >
        <DataCard
          :title="dataset.title"
          :to="`/datasets/${dataset.slug}`"
          :date="dataset.date"
          :description="dataset.description"
          :categories="dataset.categories"
          :eager="index < 3"
          :archived="dataset.status === 'archived'"
        />
      </li>
    </TransitionGroup>

    <p
      v-if="!filtered.length"
      class="mt-10 text-center text-muted"
    >
      No datasets match the current search.
    </p>
  </div>
</template>
