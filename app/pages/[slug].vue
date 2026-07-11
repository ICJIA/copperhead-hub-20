<script setup lang="ts">
import { hub as hubConfig } from '../../hub.config.mjs'

// Generic CMS page route — Hub 1.0 parity for /researchhub/:slug pages
// (hub-overview, dicra, hub-home, …). Pages are authored in the Strapi
// `pages` collection; new entries appear on the next build automatically.
const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`page-${slug}`, async () => {
  const page = await fetchPageBySlug(slug)
  const rendered = renderMarkdown(page.body)
  return { page, html: rendered.html }
})

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 500,
    statusMessage: error.value?.statusCode === 404
      ? 'Page not found'
      : `Page fetch failed: ${error.value?.message}`,
    fatal: true,
  })
}

const page = computed(() => data.value!.page)

useSeoMeta({
  title: () => `${page.value.title} — ICJIA Research Hub`,
  description: () => (page.value.summary ?? '').slice(0, 158),
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}${slug}/` }],
})
</script>

<template>
  <div
    v-if="page"
    class="mx-auto max-w-4xl px-4 py-12"
  >
    <h1 class="text-3xl font-bold text-icjia-800 sm:text-4xl dark:text-icjia-200">
      {{ page.title }}
    </h1>
    <p
      v-if="page.summary"
      class="mt-3 text-lg text-muted"
    >
      {{ page.summary }}
    </p>
    <div
      v-if="data?.html"
      class="article-body mt-8"
      v-html="data.html"
    />
  </div>
</template>
