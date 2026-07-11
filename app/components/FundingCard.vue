<script setup lang="ts">
// Figma block: "Funding Acknowledgement" rail card (shared by all detail
// pages). `html` is pre-sanitized by the caller (sanitizeHtml).
defineProps<{
  html: string
}>()
</script>

<template>
  <div
    v-if="html"
    class="rounded-lg bg-icjia-50 p-5 dark:bg-icjia-950"
  >
    <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
      Funding Acknowledgement
    </h2>
    <div
      class="mt-2 text-sm leading-relaxed text-toned"
      v-html="html"
    />
  </div>
</template>
