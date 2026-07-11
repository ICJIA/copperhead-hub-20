<script setup lang="ts">
useSeoMeta({
  title: 'Analytics and Data — Datasets — ICJIA Research Hub',
  description: 'Downloadable criminal justice datasets published by the Illinois Criminal Justice Information Authority.',
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

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return datasets.value ?? []
  return (datasets.value ?? []).filter(dataset =>
    `${dataset.title} ${dataset.description}`.toLowerCase().includes(term),
  )
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="text-3xl font-bold text-highlighted">
      Analytics and Data
    </h1>

    <div class="mt-6 flex flex-wrap items-center gap-4">
      <DataSectionTabs active="datasets" />
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search datasets…"
        class="w-full sm:w-72"
        aria-label="Search datasets"
      />
      <p
        class="ml-auto text-sm text-muted"
        aria-live="polite"
      >
        {{ filtered.length }} of {{ datasets?.length }} datasets
      </p>
    </div>

    <ul
      class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      <li
        v-for="dataset in filtered"
        :key="dataset.documentId"
      >
        <DataCard
          :title="dataset.title"
          :to="`/datasets/${dataset.slug}`"
          :date="dataset.date"
          :description="dataset.description"
          :categories="dataset.categories"
          :archived="dataset.status === 'archived'"
        />
      </li>
    </ul>

    <p
      v-if="!filtered.length"
      class="mt-10 text-center text-muted"
    >
      No datasets match the current search.
    </p>
  </div>
</template>
