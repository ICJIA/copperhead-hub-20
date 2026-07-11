<script setup lang="ts">
const props = defineProps<{
  label: string
}>()

// AA-safe pairs (900-text on 100-tint ≥ 7:1 light; 200-text on 950 dark).
// Class strings are static literals so Tailwind's build sees them.
const PALETTES = [
  'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
  'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200',
] as const

const palette = computed(() => {
  let hash = 0
  for (let i = 0; i < props.label.length; i++) hash = (hash * 31 + props.label.charCodeAt(i)) | 0
  return PALETTES[Math.abs(hash) % PALETTES.length]
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
    :class="palette"
  >
    {{ label }}
  </span>
</template>
