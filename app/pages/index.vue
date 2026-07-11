<script setup lang="ts">
useSeoMeta({
  title: 'ICJIA Research Hub',
  description:
    'Research articles, datasets, and data dashboards published by the Illinois Criminal Justice Information Authority.',
})

// Fetched at build time and embedded in the prerendered payload — the
// static HTML contains this content (predecessor defect P3 was fetching
// client-side only, shipping spinners to search engines).
const { data: latest, error } = await useAsyncData('latest-articles', () => fetchLatestArticles(3))

// Fail loud: a home page without content must fail the prerender, not ship
// silently hollow (the predecessor hid fetch failures behind v-if).
if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: `Home content fetch failed: ${error.value.message}`,
    fatal: true,
  })
}
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-3xl font-bold text-highlighted">
      ICJIA Research Hub
    </h1>
    <p class="max-w-prose text-lg text-muted">
      Research articles, datasets, and data dashboards from the Illinois
      Criminal Justice Information Authority.
    </p>
    <UAlert
      color="primary"
      variant="subtle"
      title="Copperhead preview build — Phase 1"
      description="This preview now renders live content from the migrated Strapi 5 CMS at build time. Full article, dataset, and dashboard pages arrive in Phase 2; the live Research Hub is unaffected."
      icon="i-lucide-construction"
    />
    <section
      v-if="latest?.length"
      aria-labelledby="latest-heading"
    >
      <h2
        id="latest-heading"
        class="mb-4 text-xl font-semibold text-highlighted"
      >
        Latest publications
      </h2>
      <ul class="space-y-3">
        <li
          v-for="article in latest"
          :key="article.documentId"
          class="border-l-2 border-primary pl-4"
        >
          <p class="font-medium text-highlighted">
            {{ article.title }}
          </p>
          <p class="text-sm text-muted">
            {{ formatDate(article.date) }}
            <template v-if="article.authors.length">
              · {{ article.authors.map(a => a.name).join(', ') }}
            </template>
          </p>
        </li>
      </ul>
      <p class="mt-4 text-sm text-muted">
        Article pages open here in Phase 2 — these titles are live CMS data,
        rendered into the static build.
      </p>
    </section>
  </div>
</template>
