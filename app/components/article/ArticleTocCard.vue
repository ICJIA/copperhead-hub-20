<script setup lang="ts">
// Figma block: "Table of Contents" rail card (numbered h2 anchors).
import type { TocEntry } from '../../utils/markdown'

defineProps<{
  toc: TocEntry[]
}>()
</script>

<template>
  <nav
    v-if="toc.length"
    aria-labelledby="toc-heading"
    class="rounded-lg border border-default bg-default p-5"
  >
    <h2
      id="toc-heading"
      class="text-sm font-bold tracking-wide text-highlighted uppercase"
    >
      Table of Contents
    </h2>
    <ol class="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
      <li
        v-for="entry in toc"
        :key="entry.id"
      >
        <a
          :href="`#${entry.id}`"
          class="text-primary hover:underline"
        >{{ entry.text }}</a>
      </li>
    </ol>
  </nav>
</template>
