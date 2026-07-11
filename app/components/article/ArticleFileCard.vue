<script setup lang="ts">
// Figma block: "Report File" rail card (download).
import type { MediaFile } from '../../types/content'

defineProps<{
  file: MediaFile
  fileType?: string
}>()
</script>

<template>
  <div class="rounded-lg border border-default bg-default p-5">
    <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
      Report File
    </h2>
    <p class="mt-2 text-sm text-muted">
      {{ fileType || 'PDF version' }}
    </p>
    <UButton
      :to="file.url"
      target="_blank"
      rel="noopener"
      color="primary"
      class="mt-3"
      icon="i-lucide-download"
      label="Download"
    />
  </div>
</template>
