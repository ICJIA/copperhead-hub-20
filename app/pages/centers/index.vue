<script setup lang="ts">
import { PLACEHOLDER_CENTERS } from '../../content/homepage-placeholders'

useSeoMeta({
  title: 'Centers — ICJIA Research Hub',
  description: 'The specialized research centers of the ICJIA Research & Analysis Unit.',
})

// Live centers from Strapi; typed placeholders only if the collection
// is ever emptied (same swap mechanism as the homepage).
const { data: centers } = await useAsyncData('centers-index', () =>
  fetchAllCenters().catch(() => []),
)

const list = computed(() =>
  centers.value?.length ? centers.value : PLACEHOLDER_CENTERS,
)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="text-3xl font-bold text-highlighted">
      Centers in Research &amp; Analysis
    </h1>
    <p class="mt-3 max-w-3xl text-sm leading-relaxed text-toned">
      The unit's specialized research centers focus on different areas of the
      criminal justice system. Each center conducts research, evaluation, and
      analysis within its area of expertise.
    </p>
    <ul
      class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      <li
        v-for="center in list"
        :key="center.documentId"
      >
        <article class="flex h-full flex-col rounded-lg border border-default bg-default p-6 shadow-sm">
          <span
            class="flex size-10 items-center justify-center rounded-md bg-icjia-800"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-building-2"
              class="size-5 text-white"
            />
          </span>
          <h2 class="mt-4 text-lg font-bold text-highlighted">
            {{ center.title }}
          </h2>
          <p
            v-if="center.author"
            class="mt-1 text-xs font-semibold tracking-wide text-muted uppercase"
          >
            Director: {{ center.author }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-toned">
            {{ center.description }}
          </p>
        </article>
      </li>
    </ul>
  </div>
</template>
