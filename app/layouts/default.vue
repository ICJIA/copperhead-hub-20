<script setup lang="ts">
import { hub } from '../../hub.config.mjs'

// Manager-annotation review layer (dev preview only). Client-only: it is
// pure DOM overlay and must never run during prerender. The flag is the
// permanent kill switch — see hub.config.mjs.
const annotationsEnabled = hub.annotations.enabled
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

    <ClientOnly v-if="annotationsEnabled">
      <AnnotationLayer />
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
