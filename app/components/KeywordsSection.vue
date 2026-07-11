<script setup lang="ts">
// Figma block: "Keywords & Tags" chip row (shared by all detail pages).
defineProps<{
  terms: string[]
}>()
</script>

<template>
  <section
    v-if="terms.length"
    class="mt-8"
    aria-label="Keywords and tags"
  >
    <h2 class="inline text-base font-bold text-highlighted">
      Keywords &amp; Tags:
    </h2>
    <span class="ml-2 inline-flex flex-wrap gap-2 align-middle">
      <CategoryChip
        v-for="term in terms"
        :key="term"
        :label="term"
      />
    </span>
  </section>
</template>
