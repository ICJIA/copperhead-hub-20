<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`dataset-${slug}`, async () => {
  const dataset = await fetchDatasetBySlug(slug)
  return {
    dataset,
    citationHtml: dataset.citation ? sanitizeHtml(dataset.citation) : '',
    fundingHtml: dataset.funding ? sanitizeHtml(dataset.funding) : '',
  }
})

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 500,
    statusMessage: error.value?.statusCode === 404
      ? 'Dataset not found'
      : `Dataset fetch failed: ${error.value?.message}`,
    fatal: true,
  })
}

const dataset = computed(() => data.value!.dataset)
const canonicalUrl = `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}datasets/${slug}/`

useSeoMeta({
  title: () => `${dataset.value.title} — ICJIA Research Hub`,
  description: () => dataset.value.description.slice(0, 158),
  ogTitle: () => dataset.value.title,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        'name': dataset.value.title,
        'description': dataset.value.description.slice(0, 500),
        'url': canonicalUrl,
        'dateModified': dataset.value.date,
        'publisher': {
          '@type': 'GovernmentOrganization',
          'name': 'Illinois Criminal Justice Information Authority',
        },
      }),
    },
  ],
})

const timeperiodLabel = computed(() => {
  const period = dataset.value.timeperiod
  if (!period?.yearmin) return ''
  const range = period.yearmax && period.yearmax !== period.yearmin
    ? `${period.yearmin}–${period.yearmax}`
    : `${period.yearmin}`
  return period.yeartype ? `${range} (${period.yeartype})` : range
})
</script>

<template>
  <div v-if="dataset">
    <!-- Title band -->
    <div class="bg-default">
      <div class="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <div class="flex items-start gap-4">
          <span
            class="mt-1 flex size-12 shrink-0 items-center justify-center rounded-lg bg-icjia-800"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-database"
              class="size-6 text-white"
            />
          </span>
          <div>
            <h1 class="text-3xl font-bold text-icjia-800 sm:text-4xl dark:text-icjia-200">
              {{ dataset.title }}
            </h1>
            <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span class="inline-flex items-center gap-1.5 text-muted">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-4"
                  aria-hidden="true"
                />
                Last Updated: {{ formatDate(dataset.date) }}
              </span>
              <span
                v-if="dataset.unit"
                class="inline-flex items-center gap-1.5 text-muted capitalize"
              >
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-4"
                  aria-hidden="true"
                />
                Unit: {{ dataset.unit }}
              </span>
              <span
                v-if="timeperiodLabel"
                class="inline-flex items-center gap-1.5 text-muted"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ timeperiodLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 pb-16">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <!-- Overview band -->
          <div class="rounded-lg bg-icjia-800 px-6 py-5 text-white">
            <h2 class="text-xl font-bold">
              Overview
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-icjia-100">
              {{ dataset.description }}
            </p>
          </div>

          <!-- Download -->
          <section
            v-if="dataset.datafile"
            class="mt-8"
            aria-labelledby="download-heading"
          >
            <h2
              id="download-heading"
              class="flex items-center gap-2 text-xl font-bold text-highlighted"
            >
              <UIcon
                name="i-lucide-download"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              Dataset: {{ dataset.title }}
            </h2>
            <div class="mt-3 flex flex-wrap gap-3">
              <UButton
                :to="dataset.datafile.url"
                target="_blank"
                rel="noopener"
                color="primary"
                icon="i-lucide-file-down"
                :label="`Download ${dataset.datafile.ext.replace('.', '').toUpperCase()}`"
              />
            </div>
          </section>

          <!-- Sources -->
          <section
            v-if="dataset.sources.length"
            class="mt-8"
            aria-labelledby="sources-heading"
          >
            <h2
              id="sources-heading"
              class="text-xl font-bold text-highlighted"
            >
              Sources
            </h2>
            <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-toned">
              <li
                v-for="source in dataset.sources"
                :key="source.title"
              >
                <a
                  v-if="source.url"
                  :href="source.url"
                  target="_blank"
                  rel="noopener"
                  class="text-primary underline"
                >{{ source.title }}</a>
                <template v-else>
                  {{ source.title }}
                </template>
              </li>
            </ul>
          </section>

          <!-- Variables table -->
          <section
            v-if="dataset.variables.length"
            class="mt-8"
            aria-labelledby="variables-heading"
          >
            <h2
              id="variables-heading"
              class="text-xl font-bold text-highlighted"
            >
              Variables
            </h2>
            <div class="mt-3 overflow-x-auto rounded-lg border border-default">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-elevated text-left">
                    <th class="px-4 py-2.5 font-semibold text-highlighted">
                      Name
                    </th>
                    <th class="px-4 py-2.5 font-semibold text-highlighted">
                      Type
                    </th>
                    <th class="px-4 py-2.5 font-semibold text-highlighted">
                      Definition
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="variable in dataset.variables"
                    :key="variable.name"
                    class="border-t border-default align-top"
                  >
                    <td class="px-4 py-2.5 font-medium text-highlighted">
                      {{ variable.name }}
                    </td>
                    <td class="px-4 py-2.5 text-muted capitalize">
                      {{ variable.type }}
                    </td>
                    <td class="px-4 py-2.5 text-toned">
                      {{ variable.definition }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Notes -->
          <section
            v-if="dataset.notes.length"
            class="mt-8"
            aria-labelledby="notes-heading"
          >
            <h2
              id="notes-heading"
              class="text-xl font-bold text-highlighted"
            >
              Notes
            </h2>
            <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-toned">
              <li
                v-for="(note, index) in dataset.notes"
                :key="index"
              >
                {{ note }}
              </li>
            </ul>
          </section>

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

          <KeywordsSection :terms="[...dataset.categories, ...dataset.tags]" />
        </div>

        <!-- Right rail -->
        <aside
          class="space-y-6"
          aria-label="Dataset context"
        >
          <RelatedContentCard
            :items="[
              ...dataset.relatedApps.map(ref => ({ ...ref, to: `/apps/${ref.slug}` })),
              ...dataset.relatedArticles.map(ref => ({ ...ref, to: `/articles/${ref.slug}` })),
            ]"
          />
          <FundingCard :html="data?.fundingHtml ?? ''" />
        </aside>
      </div>
    </div>
  </div>
</template>
