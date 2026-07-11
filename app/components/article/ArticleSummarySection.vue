<script setup lang="ts">
// Figma block: ⓘ Summary section (abstract).
defineProps<{
  abstract: string
}>()
</script>

<template>
  <section
    v-if="abstract"
    aria-labelledby="summary-heading"
    class="mt-8"
  >
    <h2
      id="summary-heading"
      class="flex items-center gap-2 text-xl font-bold text-highlighted"
    >
      <UIcon
        name="i-lucide-info"
        class="size-5 text-primary"
        aria-hidden="true"
      />
      Summary
    </h2>
    <p class="mt-3 leading-relaxed text-toned">
      {{ abstract }}
    </p>
  </section>
</template>
