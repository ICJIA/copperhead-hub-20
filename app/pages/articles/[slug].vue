<script setup lang="ts">
/**
 * Article detail — a thin orchestrator. Every visual block is a component
 * under app/components/article/ (each mapping to one Figma frame block),
 * so a design revision means editing one component or reordering the
 * sections below — never surgery on this file.
 */
import { hub as hubConfig } from '../../../hub.config.mjs'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`article-${slug}`, async () => {
  // Started before any await — cmsConfig() must run synchronously inside
  // the Nuxt context (see app/utils/content.ts header). Soft-fails: these
  // refs are enhancements, the article itself still fails loud.
  const summariesPromise = fetchArticleSummariesShared().catch((cause) => {
    console.warn(`[article ${slug}] summaries unavailable, skipping next/related refs:`, cause)
    return []
  })
  const article = await fetchArticleBySlug(slug)
  // Rendered at build time so the payload carries sanitized HTML + TOC.
  const rendered = renderMarkdown(article.markdown)

  // Figma 646:4085: "Next Article" walks the listing order (newest-first,
  // so next = one older); "More Articles from Author(s)" shares ≥1 author.
  // Derived from the shared summaries list at build — the payload carries
  // only these slim refs, never the whole list.
  const summaries = await summariesPromise
  const index = summaries.findIndex(summary => summary.slug === slug)
  const next = index >= 0 ? summaries[index + 1] : undefined
  const authorNames = new Set(article.authors.map(author => author.name))
  const moreFromAuthors = authorNames.size
    ? summaries
        .filter(summary =>
          summary.slug !== slug
          && summary.authors.some(author => authorNames.has(author.name)))
        .slice(0, 3)
        .map(summary => ({
          documentId: summary.documentId,
          title: summary.title,
          to: `/articles/${summary.slug}`,
        }))
    : []

  return {
    article,
    html: rendered.html,
    toc: rendered.toc,
    citationHtml: article.citation ? sanitizeHtml(article.citation) : '',
    fundingHtml: article.funding ? sanitizeHtml(article.funding) : '',
    nextArticle: next ? { slug: next.slug, title: next.title } : null,
    moreFromAuthors,
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
      innerHTML: serializeJsonLd({
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

const relatedItems = computed(() => [
  ...article.value.relatedApps.map(ref => ({ ...ref, to: `/apps/${ref.slug}` })),
  ...article.value.relatedDatasets.map(ref => ({ ...ref, to: `/datasets/${ref.slug}` })),
])
</script>

<template>
  <div v-if="article && data">
    <ArticleTitleBand
      :article="article"
      :show-cite-link="!!data.citationHtml"
      :next-article="data.nextArticle"
    />

    <div class="mx-auto max-w-7xl px-4 pb-16">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <!-- Main column: section order lives here -->
        <div>
          <ArticleOverview :article="article" />
          <ArticleSummarySection :abstract="article.abstract" />
          <ArticleBody
            v-if="data.html"
            :html="data.html"
          />
          <ArticleCitationSection
            :citation-html="data.citationHtml"
            :doi="article.doi"
          />
          <KeywordsSection :terms="[...article.categories, ...article.tags]" />
        </div>

        <!-- Right rail: card order lives here (Figma order: TOC, more
             from authors, related content, funding, report file) -->
        <aside
          class="space-y-6"
          aria-label="Article context"
        >
          <ArticleTocCard :toc="data.toc" />
          <RelatedContentCard
            :items="data.moreFromAuthors"
            title="More Articles from Author(s)"
          />
          <RelatedContentCard :items="relatedItems" />
          <FundingCard :html="data.fundingHtml" />
          <ArticleFileCard
            v-if="article.mainfile"
            :file="article.mainfile"
            :file-type="article.mainfiletype"
          />
        </aside>
      </div>
    </div>
  </div>
</template>
