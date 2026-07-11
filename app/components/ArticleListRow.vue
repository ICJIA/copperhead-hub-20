<script setup lang="ts">
// Figma block: list-view row for the articles listing (?view=list).
// The grid variant is ArticleCard.vue; both are swappable presentation.
import type { ArticleSummary } from '../types/content'

defineProps<{
  article: ArticleSummary
  highlight?: string
}>()
</script>

<template>
  <article class="relative rounded-lg border border-default bg-default p-5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary hover:shadow-md">
    <div class="flex flex-wrap items-center gap-2">
      <CategoryChip
        v-if="article.categories[0]"
        :label="article.categories[0]"
      />
      <span class="text-xs text-muted">{{ formatDate(article.date) }}</span>
    </div>
    <h3 class="mt-2 font-semibold text-highlighted">
      <NuxtLink
        :to="`/articles/${article.slug}`"
        class="after:absolute after:inset-0 hover:text-primary focus:outline-none"
      >
        <HighlightText
          :text="article.title"
          :term="highlight"
        />
      </NuxtLink>
    </h3>
    <p
      v-if="article.authors.length"
      class="mt-0.5 text-xs text-muted"
    >
      {{ article.authors.map(a => a.name).join(', ') }}
    </p>
    <p class="mt-1 line-clamp-2 text-sm text-muted">
      <HighlightText
        :text="article.abstract"
        :term="highlight"
      />
    </p>
  </article>
</template>
