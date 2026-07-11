<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  subtitle?: string
  headingId: string
}>()
</script>

<template>
  <div class="flex items-start gap-3">
    <span
      class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-icjia-800"
      aria-hidden="true"
    >
      <UIcon
        :name="icon"
        class="size-5 text-white"
      />
    </span>
    <div>
      <h2
        :id="headingId"
        class="text-2xl font-bold text-highlighted"
      >
        {{ title }}
      </h2>
      <p
        v-if="subtitle"
        class="mt-0.5 text-sm text-muted"
      >
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
