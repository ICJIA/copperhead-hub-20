<script setup lang="ts">
// The design's "Analytics and Data" page shows Datasets and Apps as pill
// toggles. URL parity requires them to remain separate routes, so the
// pills are links, not client tabs.
defineProps<{
  active: 'datasets' | 'apps'
}>()
</script>

<template>
  <nav
    aria-label="Data sections"
    class="inline-flex gap-2"
  >
    <NuxtLink
      to="/datasets"
      class="rounded-full px-4 py-1.5 text-sm font-semibold"
      :class="active === 'datasets'
        ? 'bg-icjia-800 text-white'
        : 'border border-default text-toned hover:text-primary'"
      :aria-current="active === 'datasets' ? 'page' : undefined"
    >
      Datasets
    </NuxtLink>
    <NuxtLink
      to="/apps"
      class="rounded-full px-4 py-1.5 text-sm font-semibold"
      :class="active === 'apps'
        ? 'bg-icjia-800 text-white'
        : 'border border-default text-toned hover:text-primary'"
      :aria-current="active === 'apps' ? 'page' : undefined"
    >
      Apps
    </NuxtLink>
  </nav>
</template>
