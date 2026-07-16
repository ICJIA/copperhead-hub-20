<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

useSeoMeta({
  title: 'Analytics and Data — Apps — ICJIA Research Hub',
  description: 'Interactive criminal justice data dashboards published by the Illinois Criminal Justice Information Authority.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}apps/` }],
})

const { data: apps, error } = await useAsyncData('apps-index', () => fetchAllApps())

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: `Apps listing fetch failed: ${error.value.message}`,
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
    ? (apps.value ?? [])
    : (apps.value ?? []).filter(app =>
        `${app.title} ${app.description}`.toLowerCase().includes(term),
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
      <DataSectionTabs active="apps" />
      <span class="text-sm font-semibold text-toned">Filter by:</span>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search apps…"
        class="w-full sm:w-72"
        aria-label="Search apps"
      />
      <USelect
        v-model="sort"
        :items="sortOptions"
        class="w-44"
        aria-label="Sort apps"
      />
      <p
        class="ml-auto text-sm text-muted"
        aria-live="polite"
      >
        {{ filtered.length }} of {{ apps?.length }} apps
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
        v-for="(app, index) in filtered"
        :key="app.documentId"
      >
        <DataCard
          :title="app.title"
          :to="`/apps/${app.slug}`"
          :date="app.date"
          :description="app.description"
          :categories="app.categories"
          :image="app.image"
          :eager="index < 3"
          :archived="app.status === 'archived'"
        />
      </li>
    </TransitionGroup>

    <p
      v-if="!filtered.length"
      class="mt-10 text-center text-muted"
    >
      No apps match the current search.
    </p>
  </div>
</template>
