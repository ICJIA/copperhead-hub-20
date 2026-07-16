<script setup lang="ts">
// Resource shortcuts anchor to live routes; labels/icons come from the
// hub-home CMS entry once authored.
const resources = [
  { label: 'Datasets', icon: 'i-lucide-database', to: '/datasets', description: 'Downloadable data' },
  { label: 'Dashboards', icon: 'i-lucide-monitor', to: '/apps', description: 'Interactive apps' },
  { label: 'Reports', icon: 'i-lucide-file-text', to: '/articles', description: 'Research & reports' },
  { label: 'All Articles', icon: 'i-lucide-files', to: '/articles', description: 'Everything published' },
]
</script>

<template>
  <section
    aria-labelledby="resources-heading"
    class="mx-auto max-w-7xl px-4 py-12"
  >
    <h2
      id="resources-heading"
      class="text-2xl font-bold text-highlighted"
    >
      View Resources
    </h2>
    <ul
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="list"
    >
      <li
        v-for="resource in resources"
        :key="resource.label"
      >
        <NuxtLink
          :to="resource.to"
          class="flex h-full items-center gap-3 rounded-lg border border-default bg-default p-4 shadow-sm hover:border-primary"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-md bg-icjia-100 dark:bg-icjia-900"
            aria-hidden="true"
          >
            <UIcon
              :name="resource.icon"
              class="size-5 text-icjia-700 dark:text-icjia-300"
            />
          </span>
          <span>
            <span class="block font-semibold text-highlighted">{{ resource.label }}</span>
            <span class="block text-xs text-muted">{{ resource.description }}</span>
          </span>
          <!-- Visual affordance only — the tile link carries the name
               (Figma: outlined View button on each resource card). -->
          <span
            class="ml-auto inline-flex shrink-0 items-center rounded-md border border-default px-2.5 py-1 text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            View
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
