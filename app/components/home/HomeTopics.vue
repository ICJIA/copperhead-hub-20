<script setup lang="ts">
defineProps<{
  title: string
  intro: string
  focusAreas: readonly string[]
}>()
</script>

<template>
  <section
    aria-labelledby="topics-heading"
    class="bg-icjia-50 dark:bg-icjia-950"
  >
    <div class="mx-auto max-w-7xl px-4 py-12">
      <h2
        id="topics-heading"
        class="text-2xl font-bold text-highlighted"
      >
        {{ title }}
      </h2>
      <p class="mt-3 max-w-3xl text-sm leading-relaxed text-toned">
        {{ intro }}
      </p>
      <h3 class="mt-6 text-sm font-bold tracking-wide text-highlighted uppercase">
        Key Focus Areas
      </h3>
      <ul class="mt-3 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
        <li
          v-for="area in focusAreas"
          :key="area"
          class="flex items-center gap-2 text-sm text-toned"
        >
          <UIcon
            name="i-lucide-check"
            class="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {{ area }}
        </li>
      </ul>
    </div>
  </section>
</template>
