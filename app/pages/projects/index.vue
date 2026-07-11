<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'
import { PLACEHOLDER_PROJECTS } from '../../content/homepage-placeholders'

useSeoMeta({
  title: 'Major Projects — ICJIA Research Hub',
  description: 'Major projects and strategic partnerships of the ICJIA Research & Analysis Unit.',
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}projects/` }],
})

const { data: projects } = await useAsyncData('projects-index', () =>
  fetchAllProjects().catch(() => []),
)

const list = computed(() =>
  projects.value?.length ? projects.value : PLACEHOLDER_PROJECTS,
)

// Landing copy: authors own it via a pages entry slugged `projects`
// (fallback preserves the copy from the retired projecthomes type).
const { data: copy } = await usePageCopy('projects', {
  title: 'Major Projects in R&A',
  summary:
    'Through major statewide projects and strategic partnerships, ICJIA\'s Research & Analysis Unit modernizes Illinois\'s justice system by integrating rigorous data infrastructure with policy innovation to improve transparency and performance.',
})

const HEADER_PALETTE = ['bg-icjia-800', 'bg-red-900', 'bg-emerald-900']
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="text-3xl font-bold text-highlighted">
      {{ copy?.title }}
    </h1>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-toned">
      {{ copy?.summary }}
    </p>
    <div
      v-if="copy?.bodyHtml"
      class="article-body mt-6 max-w-3xl"
      v-html="copy.bodyHtml"
    />
    <ul
      class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      <li
        v-for="(project, index) in list"
        :key="project.documentId"
      >
        <article
          class="relative flex h-full flex-col rounded-lg p-6 text-white shadow-md transition-shadow focus-within:ring-2 focus-within:ring-white hover:shadow-lg"
          :class="HEADER_PALETTE[index % HEADER_PALETTE.length]"
        >
          <span
            v-if="project.category"
            class="inline-flex self-start rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold"
          >
            {{ project.category }}
          </span>
          <h2 class="mt-3 text-lg font-bold">
            <NuxtLink
              :to="`/projects/${project.slug}`"
              class="after:absolute after:inset-0 focus:outline-none"
            >
              {{ project.title }}
            </NuxtLink>
          </h2>
          <p class="mt-2 line-clamp-4 text-sm leading-relaxed text-white/85">
            {{ project.description }}
          </p>
          <div
            class="mt-auto pt-4 text-sm font-semibold"
            aria-hidden="true"
          >
            Learn More
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>
