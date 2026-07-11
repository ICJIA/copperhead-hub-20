<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`article-${slug}`, async () => {
  const article = await fetchArticleBySlug(slug)
  // Rendered at build time so the payload carries sanitized HTML + TOC.
  const rendered = renderMarkdown(article.markdown)
  return {
    article,
    html: rendered.html,
    toc: rendered.toc,
    citationHtml: article.citation ? sanitizeHtml(article.citation) : '',
    fundingHtml: article.funding ? sanitizeHtml(article.funding) : '',
  }
})

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 500,
    statusMessage: error.value?.statusCode === 404
      ? 'Article not found'
      : `Article fetch failed: ${error.value?.message}`,
    fatal: true,
  })
}

const article = computed(() => data.value!.article)
const canonicalUrl = `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}articles/${slug}/`

useSeoMeta({
  title: () => `${article.value.title} — ICJIA Research Hub`,
  description: () => article.value.abstract.replace(/<[^>]+>/g, '').slice(0, 158),
  ogTitle: () => article.value.title,
  ogType: 'article',
  ogImage: () => article.value.splash?.url,
  articlePublishedTime: () => article.value.publishedAt,
  articleModifiedTime: () => article.value.updatedAt,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        'headline': article.value.title,
        'url': canonicalUrl,
        'datePublished': article.value.date,
        'author': article.value.authors.map(a => ({ '@type': 'Person', 'name': a.name })),
        'publisher': {
          '@type': 'GovernmentOrganization',
          'name': 'Illinois Criminal Justice Information Authority',
        },
      }),
    },
  ],
})

const authorLine = computed(() => {
  const names = article.value.authors.map(a => a.name)
  if (!names.length) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
})

const doiHref = computed(() => {
  const doi = article.value.doi
  if (!doi) return undefined
  return doi.startsWith('http') ? doi : `https://doi.org/${doi}`
})
</script>

<template>
  <div v-if="article">
    <!-- Title band -->
    <div class="bg-default">
      <div class="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <div class="flex items-start gap-4">
          <span
            class="mt-1 flex size-12 shrink-0 items-center justify-center rounded-lg bg-icjia-800"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-file-text"
              class="size-6 text-white"
            />
          </span>
          <h1 class="text-3xl font-bold text-icjia-800 sm:text-4xl dark:text-icjia-200">
            {{ article.title }}
          </h1>
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span class="inline-flex items-center gap-1.5 text-muted">
            <UIcon
              name="i-lucide-calendar"
              class="size-4"
              aria-hidden="true"
            />
            Last Updated: {{ formatDate(article.date) }}
          </span>
          <template v-if="article.mainfile">
            <a
              :href="article.mainfile.url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <UIcon
                name="i-lucide-eye"
                class="size-4"
                aria-hidden="true"
              />
              View PDF
            </a>
            <a
              :href="article.mainfile.url"
              download
              class="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <UIcon
                name="i-lucide-download"
                class="size-4"
                aria-hidden="true"
              />
              Download PDF
            </a>
          </template>
          <a
            v-if="data?.citationHtml"
            href="#citation"
            class="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <UIcon
              name="i-lucide-quote"
              class="size-4"
              aria-hidden="true"
            />
            Cite Article
          </a>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 pb-16">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- Main column -->
        <div>
          <!-- Overview band + hero -->
          <div class="overflow-hidden rounded-lg border border-default">
            <div class="bg-icjia-800 px-6 py-5 text-white">
              <h2 class="text-xl font-bold">
                Overview
              </h2>
              <p
                v-if="authorLine"
                class="mt-1 text-sm text-icjia-100"
              >
                Authors: {{ authorLine }}
              </p>
            </div>
            <img
              v-if="article.splash"
              :src="article.splash.url"
              :alt="article.splash.alternativeText"
              class="max-h-[420px] w-full object-cover"
            >
          </div>

          <!-- Summary -->
          <section
            v-if="article.abstract"
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
              {{ article.abstract }}
            </p>
          </section>

          <!-- Body -->
          <div
            v-if="data?.html"
            class="article-body mt-8"
            v-html="data.html"
          />

          <!-- Citation -->
          <section
            v-if="data?.citationHtml"
            id="citation"
            aria-labelledby="citation-heading"
            class="mt-12 scroll-mt-20"
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
            <p
              v-if="doiHref"
              class="mt-2 text-sm"
            >
              DOI:
              <a
                :href="doiHref"
                target="_blank"
                rel="noopener"
                class="text-primary underline"
              >{{ article.doi }}</a>
            </p>
          </section>

          <!-- Keywords & tags -->
          <section
            v-if="article.categories.length || article.tags.length"
            class="mt-8"
            aria-label="Keywords and tags"
          >
            <h2 class="inline text-base font-bold text-highlighted">
              Keywords &amp; Tags:
            </h2>
            <span class="ml-2 inline-flex flex-wrap gap-2 align-middle">
              <CategoryChip
                v-for="term in [...article.categories, ...article.tags]"
                :key="term"
                :label="term"
              />
            </span>
          </section>
        </div>

        <!-- Right rail -->
        <aside
          class="space-y-6 lg:pt-0"
          aria-label="Article context"
        >
          <nav
            v-if="data?.toc?.length"
            aria-labelledby="toc-heading"
            class="rounded-lg border border-default bg-default p-5"
          >
            <h2
              id="toc-heading"
              class="text-sm font-bold tracking-wide text-highlighted uppercase"
            >
              Table of Contents
            </h2>
            <ol class="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
              <li
                v-for="entry in data.toc"
                :key="entry.id"
              >
                <a
                  :href="`#${entry.id}`"
                  class="text-primary hover:underline"
                >{{ entry.text }}</a>
              </li>
            </ol>
          </nav>

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

          <div
            v-if="article.mainfile"
            class="rounded-lg border border-default bg-default p-5"
          >
            <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
              Report File
            </h2>
            <p class="mt-2 text-sm text-muted">
              {{ article.mainfiletype || 'PDF version' }}
            </p>
            <UButton
              :to="article.mainfile.url"
              target="_blank"
              rel="noopener"
              color="primary"
              class="mt-3"
              icon="i-lucide-download"
              label="Download"
            />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
