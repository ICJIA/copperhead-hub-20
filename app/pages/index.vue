<script setup lang="ts">
useSeoMeta({
  title: 'ICJIA Research Hub',
  description:
    'Research articles, datasets, and data dashboards published by the Illinois Criminal Justice Information Authority.',
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-highlighted">
      ICJIA Research Hub
    </h1>
    <p class="max-w-prose text-lg text-muted">
      Research articles, datasets, and data dashboards from the Illinois
      Criminal Justice Information Authority.
    </p>
    <UAlert
      color="primary"
      variant="subtle"
      title="Copperhead preview build — Phase 0"
      description="This is the foundation build of the rebuilt Research Hub. Content, search, and the full page catalog arrive in later phases; the live Research Hub is unaffected."
      icon="i-lucide-construction"
    />
  </div>
</template>
