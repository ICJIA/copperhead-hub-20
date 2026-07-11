<script setup lang="ts">
// Figma block: navy Overview band with authors + splash hero.
import type { Article } from '../../types/content'

const props = defineProps<{
  article: Article
}>()

const authorLine = computed(() => {
  const names = props.article.authors.map(a => a.name)
  if (!names.length) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
})
</script>

<template>
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
</template>
