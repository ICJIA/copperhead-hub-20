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
    <UAccordion
      :items="items"
      class="mt-6"
      :unmount-on-hide="false"
    >
      <template #content="{ item }">
        <p class="pb-4 text-sm leading-relaxed text-toned">
          {{ item.content }}
        </p>
      </template>
    </UAccordion>
  </section>
</template>
