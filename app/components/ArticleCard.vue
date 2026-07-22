<script setup lang="ts">
import type { ArticleSummary } from '../types/content'

const props = defineProps<{
  article: ArticleSummary
  highlight?: string
  /** First-row cards load eagerly — a lazy LCP image tanks page speed. */
  eager?: boolean
  /**
   * True only when this card was part of build-rendered markup: ipxStatic
   * emits /_ipx/ variants solely for images rendered at build time, so
   * client-revealed cards (Load More, filtered-in older articles) must
   * skip NuxtImg or they 404. Optimized cards keep the same-origin webp
   * that holds the listing's LCP budget.
   */
  optimized?: boolean
}>()

const primaryCategory = computed(() => props.article.categories[0])

// Cards are ~400px wide; the CMS "small" format (~500px) beats shipping
// the full-size original. Dimensions prevent layout shift.
const image = computed(() => {
  const media = props.article.thumbnail
  if (!media) return undefined
  const small = media.formats?.small
  return {
    src: small?.url ?? media.url,
    width: small?.width ?? media.width,
    height: small?.height ?? media.height,
    alt: media.alternativeText,
  }
})

// "Read more about {title}" — reflects the article so the CTA is meaningful
// on its own (full title in the aria-label, a short prefix on screen).
const readMore = computed(() => readMoreLabel(props.article.title))
</script>

<template>
  <article class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary hover:shadow-md">
    <div class="aspect-[16/9] w-full bg-elevated">
      <NuxtImg
        v-if="image && optimized"
        :src="image.src"
        :alt="image.alt"
        width="400"
        height="225"
        fit="cover"
        densities="x1"
        class="h-full w-full object-cover"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
      />
      <img
        v-else-if="image"
        :src="image.src"
        :alt="image.alt"
        :width="image.width"
        :height="image.height"
        class="h-full w-full object-cover"
        decoding="async"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
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
          <HighlightText
            :text="article.title"
            :term="highlight"
          />
        </NuxtLink>
      </h3>
      <p
        v-if="article.authors.length"
        class="text-xs text-muted"
      >
        {{ article.authors.map(a => a.name).join(', ') }}
      </p>
      <p class="line-clamp-3 text-sm text-muted">
        <HighlightText
          :text="article.abstract"
          :term="highlight"
        />
      </p>
      <!-- Real, always-clickable CTA (was decorative text; the whole card is
           still the stretched title link). data-ann-nav keeps it navigable
           while the annotation highlighter is armed. -->
      <div class="mt-auto pt-1">
        <NuxtLink
          :to="`/articles/${article.slug}`"
          :aria-label="readMore.full"
          data-ann-nav
          class="read-more-link inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:underline focus:outline-none"
        >
          <span :class="{ 'read-more-link__text--clip': readMore.truncated }">{{ readMore.visible }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
            aria-hidden="true"
          />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
