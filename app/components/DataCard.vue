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
}>()

const primaryCategory = computed(() => props.categories[0])
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default shadow-sm">
    <div class="aspect-[16/9] w-full bg-elevated">
      <img
        v-if="image"
        :src="image.url"
        :alt="image.alternativeText"
        class="h-full w-full object-cover"
        loading="lazy"
      >
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
        <NuxtLink
          :to="to"
          class="hover:text-primary hover:underline"
        >
          {{ title }}
        </NuxtLink>
      </h3>
      <p class="line-clamp-3 text-sm text-muted">
        {{ description }}
      </p>
      <div class="mt-auto pt-1">
        <NuxtLink
          :to="to"
          class="text-sm font-semibold text-primary hover:underline"
          :aria-label="`Read more: ${title}`"
        >
          Read More
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
