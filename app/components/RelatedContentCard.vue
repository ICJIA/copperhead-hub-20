<script setup lang="ts">
defineProps<{
  items: { documentId: string, title: string, to: string }[]
}>()
</script>

<template>
  <div
    v-if="items.length"
    class="rounded-lg bg-icjia-50 p-5 dark:bg-icjia-950"
  >
    <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
      Related Content
    </h2>
    <ul class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.documentId"
      >
        <NuxtLink
          :to="item.to"
          class="text-sm font-medium text-primary hover:underline"
        >
          {{ item.title }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
