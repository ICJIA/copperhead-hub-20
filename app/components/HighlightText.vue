<script setup lang="ts">
// Search-term highlighting rendered as text segments (never v-html).
const props = defineProps<{
  text: string
  term?: string
}>()

const segments = computed(() => segmentText(props.text, props.term ?? ''))
</script>

<template>
  <span>
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <mark
        v-if="segment.hit"
        class="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-400/30"
      >{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
