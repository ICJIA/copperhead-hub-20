<script setup lang="ts">
import { hub as hubConfig } from '../../hub.config.mjs'
import {
  HOMEPAGE_COPY,
  PLACEHOLDER_CENTERS,
  PLACEHOLDER_PROJECTS,
} from '../content/homepage-placeholders'

useSeoMeta({
  title: hubConfig.site.name,
  description: hubConfig.site.description,
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': hubConfig.site.name,
        'url': `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}`,
        'publisher': {
          '@type': 'GovernmentOrganization',
          'name': 'Illinois Criminal Justice Information Authority',
        },
      }),
    },
  ],
})

// Live content anchors the page (articles fail loud — they exist and must
// render). Centers/projects fall back to typed placeholders until content
// authors populate those collections; the swap is automatic. Hero/welcome/
// topics copy comes from the hub-home page entry once it is authored
// (fetch attempted; placeholder until then).
const { data, error } = await useAsyncData('homepage', async () => {
  const [latest, centers, projects] = await Promise.all([
    fetchLatestArticles(6),
    fetchAllCenters().catch(() => []),
    fetchAllProjects().catch(() => []),
  ])
  const page = await fetchPageBySlug('hub-home').catch(() => null)
  return {
    latest,
    centers: centers.length ? centers : PLACEHOLDER_CENTERS,
    projects: projects.length ? projects : PLACEHOLDER_PROJECTS,
    hero: page
      ? { title: page.title, lede: page.summary ?? HOMEPAGE_COPY.hero.lede }
      : HOMEPAGE_COPY.hero,
  }
})

if (error.value || !data.value?.latest?.length) {
  throw createError({
    statusCode: 500,
    statusMessage: `Homepage content fetch failed: ${error.value?.message ?? 'no articles returned'}`,
    fatal: true,
  })
}
</script>

<template>
  <div v-if="data">
    <HomeHero
      :title="data.hero.title"
      :lede="data.hero.lede"
    />

    <!-- Research and Analysis Unit -->
    <section
      aria-labelledby="welcome-heading"
      class="mx-auto max-w-7xl px-4 pt-12"
    >
      <HomeSectionHeading
        icon="i-lucide-flask-conical"
        :title="HOMEPAGE_COPY.welcome.title"
        :subtitle="HOMEPAGE_COPY.welcome.subtitle"
        heading-id="welcome-heading"
      />
      <p class="mt-4 max-w-4xl text-sm leading-relaxed text-toned">
        {{ HOMEPAGE_COPY.welcome.body }}
      </p>
    </section>

    <HomeCenters
      :centers="data.centers"
      :intro="HOMEPAGE_COPY.centersIntro"
    />

    <!-- Latest Articles (live) -->
    <section
      aria-labelledby="latest-heading"
      class="border-t border-default bg-elevated/40"
    >
      <div class="mx-auto max-w-7xl px-4 py-12">
        <h2
          id="latest-heading"
          class="text-2xl font-bold text-highlighted"
        >
          Latest Articles
        </h2>
        <ul
          class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          <li
            v-for="article in data.latest"
            :key="article.documentId"
          >
            <ArticleCard :article="article" />
          </li>
        </ul>
        <div class="mt-8 text-center">
          <UButton
            to="/articles"
            color="primary"
            size="lg"
            label="Load More Articles"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </div>
    </section>

    <HomeTopics
      :title="HOMEPAGE_COPY.topics.title"
      :intro="HOMEPAGE_COPY.topics.intro"
      :focus-areas="HOMEPAGE_COPY.topics.focusAreas"
    />

    <HomeResources />

    <HomeProjects
      :projects="data.projects"
      :intro="HOMEPAGE_COPY.projectsIntro"
    />
  </div>
</template>
