<script setup lang="ts">
defineProps<{
  title: string
  lede: string
}>()
</script>

<template>
  <!-- Hero. The design uses a photographic background sourced from the
       hub-home CMS entry; until that is authored, a navy gradient stands in
       (self-contained, no external image dependency). -->
  <section
    class="bg-gradient-to-br from-icjia-800 via-icjia-900 to-icjia-950"
    aria-labelledby="hero-heading"
  >
    <div class="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <h1
        id="hero-heading"
        class="max-w-3xl text-4xl font-bold text-white sm:text-5xl"
      >
        {{ title }}
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-icjia-100">
        {{ lede }}
      </p>
    </div>
  </section>
</template>
