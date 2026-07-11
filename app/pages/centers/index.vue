<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'
import { PLACEHOLDER_CENTERS } from '../../content/homepage-placeholders'

useSeoMeta({
  title: 'Centers — ICJIA Research Hub',
  description: 'The specialized research centers of the ICJIA Research & Analysis Unit.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}centers/` }],
})

// Live centers from Strapi; typed placeholders only if the collection
// is ever emptied (same swap mechanism as the homepage).
const { data: centers } = await useAsyncData('centers-index', () =>
  fetchAllCenters().catch(() => []),
)

const list = computed(() =>
  centers.value?.length ? centers.value : PLACEHOLDER_CENTERS,
)

// Landing copy: authors own it via a pages entry slugged `centers`
// (fallback preserves the copy from the retired centerhomes type).
const { data: copy } = await usePageCopy('centers', {
  title: 'Centers',
  summary:
    'The ICJIA\'s Research & Analysis Unit operates specialized centers that provide data-driven insights and program evaluations to guide evidence-based policy, funding decisions, and legislative reform across Illinois\'s justice system.',
})
</script>

<template>
  <div v-if="copy">
    <PageHero
      :title="copy.title"
      :summary="copy.summary"
    />

    <div class="mx-auto max-w-7xl px-4 py-12">
      <HomeSectionHeading
        icon="i-lucide-building-2"
        title="Centers in Research & Analysis"
        subtitle="Quality criminal justice research and analytics"
        heading-id="centers-grid-heading"
      />
      <ul
        class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="center in list"
          :key="center.documentId"
        >
          <article class="flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm">
            <!-- Figma shows imagery per center; the CMS center type has no
                 media field yet, so a branded panel stands in (authors get
                 real images once the field exists — content decision). -->
            <div class="relative flex aspect-[16/8] items-end bg-gradient-to-br from-icjia-700 to-icjia-950 p-4">
              <UIcon
                name="i-lucide-building-2"
                class="absolute top-4 right-4 size-7 text-white/30"
                aria-hidden="true"
              />
              <h3 class="text-lg leading-snug font-bold text-white">
                {{ center.title }}
              </h3>
            </div>
            <div class="flex flex-1 flex-col gap-2 p-4">
              <p
                v-if="center.author"
                class="text-xs font-semibold tracking-wide text-muted uppercase"
              >
                Director: {{ center.author }}
              </p>
              <p class="text-sm leading-relaxed text-toned">
                {{ center.description }}
              </p>
            </div>
          </article>
        </li>
      </ul>

      <div
        v-if="copy.bodyHtml"
        class="article-body mt-12 max-w-3xl"
        v-html="copy.bodyHtml"
      />
    </div>
  </div>
</template>
