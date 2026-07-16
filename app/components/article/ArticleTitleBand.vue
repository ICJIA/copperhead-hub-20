<script setup lang="ts">
// Figma block: article title band (doc icon, navy title, meta/action row).
// Restyle here; the page only decides section order.
import type { Article } from '../../types/content'

defineProps<{
  article: Article
  showCiteLink: boolean
  /** Next entry in listing order (Figma: navy button, top right). */
  nextArticle?: { slug: string, title: string } | null
}>()
</script>

<template>
  <div class="bg-default">
    <div class="mx-auto max-w-7xl px-4 pt-10 pb-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
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
        <UButton
          v-if="nextArticle"
          :to="`/articles/${nextArticle.slug}`"
          color="primary"
          trailing-icon="i-lucide-chevron-right"
          label="Next Article"
          :aria-label="`Next article: ${nextArticle.title}`"
          class="shrink-0"
        />
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
          v-if="showCiteLink"
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
</template>
