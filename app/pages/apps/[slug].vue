<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`app-${slug}`, async () => {
  const app = await fetchAppBySlug(slug)
  return {
    app,
    citationHtml: app.citation ? sanitizeHtml(app.citation) : '',
    fundingHtml: app.funding ? sanitizeHtml(app.funding) : '',
  }
})

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 500,
    statusMessage: error.value?.statusCode === 404
      ? 'App not found'
      : `App fetch failed: ${error.value?.message}`,
    fatal: true,
  })
}

const app = computed(() => data.value!.app)
const canonicalUrl = `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}apps/${slug}/`

useSeoMeta({
  title: () => `${app.value.title} — ICJIA Research Hub`,
  description: () => app.value.description.slice(0, 158),
  ogTitle: () => app.value.title,
  ogImage: () => app.value.image?.url,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

const contributorLine = computed(() => {
  const names = app.value.contributors.map(c => c.name)
  if (!names.length) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
})
</script>

<template>
  <div v-if="app">
    <!-- Title band -->
    <div class="bg-default">
      <div class="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <span
              class="mt-1 flex size-12 shrink-0 items-center justify-center rounded-lg bg-icjia-800"
              aria-hidden="true"
            >
              <UIcon
                name="i-lucide-monitor"
                class="size-6 text-white"
              />
            </span>
            <div>
              <h1 class="text-3xl font-bold text-icjia-800 sm:text-4xl dark:text-icjia-200">
                {{ app.title }}
              </h1>
              <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span class="inline-flex items-center gap-1.5 text-muted">
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-4"
                    aria-hidden="true"
                  />
                  Last Updated: {{ formatDate(app.date) }}
                </span>
                <span
                  v-if="app.status === 'archived'"
                  class="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                >
                  Archived
                </span>
              </div>
            </div>
          </div>
          <UButton
            v-if="app.url"
            :to="app.url"
            target="_blank"
            rel="noopener"
            color="primary"
            size="lg"
            icon="i-lucide-external-link"
            trailing
            label="Launch"
          />
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 pb-16">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <!-- Overview band + preview image -->
          <div class="overflow-hidden rounded-lg border border-default">
            <div class="bg-icjia-800 px-6 py-5 text-white">
              <h2 class="text-xl font-bold">
                Overview
              </h2>
              <p
                v-if="contributorLine"
                class="mt-1 text-sm text-icjia-100"
              >
                Contributors: {{ contributorLine }}
              </p>
            </div>
            <img
              v-if="app.image"
              :src="app.image.url"
              :alt="app.image.alternativeText"
              class="max-h-[420px] w-full object-cover"
            >
          </div>

          <!-- Summary -->
          <section
            v-if="app.description"
            aria-labelledby="summary-heading"
            class="mt-8"
          >
            <h2
              id="summary-heading"
              class="flex items-center gap-2 text-xl font-bold text-highlighted"
            >
              <UIcon
                name="i-lucide-info"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              Summary
            </h2>
            <p class="mt-3 leading-relaxed text-toned">
              {{ app.description }}
            </p>
          </section>

          <!-- Launch callout -->
          <div
            v-if="app.url"
            class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-default bg-elevated/60 px-6 py-5"
          >
            <p class="text-sm text-toned">
              This dashboard opens in a new tab
              <template v-if="app.external">
                on an external site
              </template>.
            </p>
            <UButton
              :to="app.url"
              target="_blank"
              rel="noopener"
              color="primary"
              icon="i-lucide-external-link"
              trailing
              :label="`Launch ${app.title}`"
            />
          </div>

          <!-- Citation -->
          <section
            v-if="data?.citationHtml"
            aria-labelledby="citation-heading"
            class="mt-10"
          >
            <h2
              id="citation-heading"
              class="text-xl font-bold text-highlighted"
            >
              Citation
            </h2>
            <div
              class="mt-2 text-sm leading-relaxed text-toned"
              v-html="data.citationHtml"
            />
          </section>

          <!-- Keywords -->
          <section
            v-if="app.categories.length || app.tags.length"
            class="mt-8"
            aria-label="Keywords and tags"
          >
            <h2 class="inline text-base font-bold text-highlighted">
              Keywords &amp; Tags:
            </h2>
            <span class="ml-2 inline-flex flex-wrap gap-2 align-middle">
              <CategoryChip
                v-for="term in [...app.categories, ...app.tags]"
                :key="term"
                :label="term"
              />
            </span>
          </section>
        </div>

        <!-- Right rail -->
        <aside
          class="space-y-6"
          aria-label="App context"
        >
          <RelatedContentCard
            :items="[
              ...app.relatedDatasets.map(ref => ({ ...ref, to: `/datasets/${ref.slug}` })),
              ...app.relatedArticles.map(ref => ({ ...ref, to: `/articles/${ref.slug}` })),
            ]"
          />
          <div
            v-if="data?.fundingHtml"
            class="rounded-lg bg-icjia-50 p-5 dark:bg-icjia-950"
          >
            <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
              Funding Acknowledgement
            </h2>
            <div
              class="mt-2 text-sm leading-relaxed text-toned"
              v-html="data.fundingHtml"
            />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
