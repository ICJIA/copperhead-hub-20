<script setup lang="ts">
// Figma block: navy page-hero band on section landing pages
// (Centers / Projects frames): white title + light intro on icjia navy.
defineProps<{
  title: string
  summary?: string
}>()
</script>

<template>
  <section class="bg-icjia-800">
    <div class="mx-auto max-w-7xl px-4 py-10">
      <h1 class="text-3xl font-bold text-white sm:text-4xl">
        {{ title }}
      </h1>
      <p
        v-if="summary"
        class="mt-3 max-w-3xl text-sm leading-relaxed text-icjia-100"
      >
        {{ summary }}
      </p>
    </div>
  </section>
</template>
