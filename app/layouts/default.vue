<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Manager-annotation review layer (dev preview only). It mounts only while the
// kill switch is on. `__ANN_ENABLED__` is a Vite build-time constant
// (nuxt.config.ts, sourced from hub.annotations.enabled): with it `false` the
// async import sits in a dead branch, so the bundler tree-shakes the whole
// annotation layer — and its Supabase store — out of the client bundle.
// Client-only at mount time: it is pure DOM overlay and never runs in prerender.
const AnnotationLayer = __ANN_ENABLED__
  ? defineAsyncComponent(() => import('~/components/annotation/AnnotationLayer.vue'))
  : null
</script>

<template>
  <div class="flex min-h-screen flex-col bg-elevated/50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-inverted"
    >
      Skip to main content
    </a>

    <AppHeader />

    <ClientOnly v-if="AnnotationLayer">
      <component :is="AnnotationLayer" />
    </ClientOnly>

    <main
      id="main-content"
      class="w-full flex-1"
    >
      <slot />
    </main>

    <AppFooter />
    <AppStatusBar />
  </div>
</template>
