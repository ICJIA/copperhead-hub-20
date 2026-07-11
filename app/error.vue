<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (is404.value ? 'Page not found' : 'Something went wrong'),
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold text-highlighted">
          {{ is404 ? 'Page not found' : 'Something went wrong' }}
        </h1>
        <p class="max-w-prose text-lg text-muted">
          <template v-if="is404">
            The page you're looking for doesn't exist or may have moved.
          </template>
          <template v-else>
            An unexpected error occurred (status {{ error.statusCode }}).
          </template>
        </p>
        <UButton
          to="/"
          icon="i-lucide-home"
          label="Go to the Research Hub home page"
        />
      </div>
    </NuxtLayout>
  </UApp>
</template>
