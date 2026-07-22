<script setup lang="ts">
import type { Center } from '../../types/content'

const props = defineProps<{
  centers: Center[]
  intro: string
}>()

const items = computed(() =>
  props.centers.map(center => ({
    label: center.title,
    content: center.description,
  })),
)
</script>

<template>
  <section
    aria-labelledby="centers-heading"
    class="mx-auto max-w-7xl px-4 py-12"
  >
    <HomeSectionHeading
      icon="i-lucide-building-2"
      title="Centers in the Research and Analysis Unit"
      heading-id="centers-heading"
    />
    <p class="mt-4 max-w-3xl text-sm leading-relaxed text-toned">
      {{ intro }}
    </p>
    <!-- First center open on load (Figma 646:212 shows the accordion with
         its lead entry expanded and a "View center" link). -->
    <UAccordion
      :items="items"
      class="mt-6"
      :unmount-on-hide="false"
      default-value="0"
    >
      <template #content="{ item, index }">
        <div class="pb-4">
          <p class="text-sm leading-relaxed text-toned">
            {{ item.content }}
          </p>
          <NuxtLink
            v-if="centers[index]"
            :to="`/centers#center-${centers[index].documentId}`"
            data-ann-nav
            class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View center<span class="sr-only">: {{ centers[index].title }}</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>
      </template>
    </UAccordion>
  </section>
</template>
