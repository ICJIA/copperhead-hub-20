<script setup lang="ts">
import type { MediaFile } from '../types/content'

const props = defineProps<{
  title: string
  to: string
  date: string
  description: string
  categories: string[]
  image?: MediaFile
  archived?: boolean
  eager?: boolean
}>()

const primaryCategory = computed(() => props.categories[0])

const img = computed(() => {
  if (!props.image) return undefined
  const small = props.image.formats?.small
  return {
    src: small?.url ?? props.image.url,
    width: small?.width ?? props.image.width,
    height: small?.height ?? props.image.height,
    alt: props.image.alternativeText,
  }
})

// "Read more about {title}" — reflects the dataset/app so the CTA is
// meaningful on its own (full title in the aria-label, a short prefix shown).
const readMore = computed(() => readMoreLabel(props.title))
</script>

<template>
  <article class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary hover:shadow-md">
    <div class="aspect-[16/9] w-full bg-elevated">
      <NuxtImg
        v-if="img"
        :src="img.src"
        :alt="img.alt"
        width="400"
        height="225"
        fit="cover"
        densities="x1"
        class="h-full w-full object-cover"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
        aria-hidden="true"
      >
        <UIcon
          name="i-lucide-database"
          class="size-10 text-muted"
        />
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex flex-wrap items-center gap-2">
        <CategoryChip
          v-if="primaryCategory"
          :label="primaryCategory"
        />
        <span
          v-if="archived"
          class="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-200"
        >
          Archived
        </span>
        <span class="text-xs text-muted">{{ formatDate(date) }}</span>
      </div>
      <h3 class="font-semibold text-highlighted">
        <!-- Stretched link — see ArticleCard. -->
        <NuxtLink
          :to="to"
          class="after:absolute after:inset-0 hover:text-primary focus:outline-none"
        >
          {{ title }}
        </NuxtLink>
      </h3>
      <p class="line-clamp-3 text-sm text-muted">
        {{ description }}
      </p>
      <!-- Real, always-clickable CTA (was decorative text; the whole card is
           still the stretched title link). data-ann-nav keeps it navigable
           while the annotation highlighter is armed. -->
      <div class="mt-auto pt-1">
        <NuxtLink
          :to="to"
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
