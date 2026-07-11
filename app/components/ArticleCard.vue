<script setup lang="ts">
import type { ArticleSummary } from '../types/content'

const props = defineProps<{
  article: ArticleSummary
}>()

const primaryCategory = computed(() => props.article.categories[0])
</script>

<template>
  <article class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary hover:shadow-md">
    <div class="aspect-[16/9] w-full bg-elevated">
      <img
        v-if="article.thumbnail"
        :src="article.thumbnail.url"
        :alt="article.thumbnail.alternativeText"
        class="h-full w-full object-cover"
        loading="lazy"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
        aria-hidden="true"
      >
        <UIcon
          name="i-lucide-file-text"
          class="size-10 text-muted"
        />
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-center gap-2">
        <CategoryChip
          v-if="primaryCategory"
          :label="primaryCategory"
        />
        <span class="text-xs text-muted">{{ formatDate(article.date) }}</span>
      </div>
      <h3 class="font-semibold text-highlighted">
        <!-- Stretched link: the title is the card's single link (descriptive
             text for SEO/AT); after:inset-0 makes the whole card clickable. -->
        <NuxtLink
          :to="`/articles/${article.slug}`"
          class="after:absolute after:inset-0 hover:text-primary focus:outline-none"
        >
          {{ article.title }}
        </NuxtLink>
      </h3>
      <p class="line-clamp-3 text-sm text-muted">
        {{ article.abstract }}
      </p>
      <div
        class="mt-auto pt-1 text-sm font-semibold text-primary"
        aria-hidden="true"
      >
        Read More
      </div>
    </div>
  </article>
</template>
