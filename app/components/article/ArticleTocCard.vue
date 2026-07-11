<script setup lang="ts">
// Figma block: "Table of Contents" rail card (numbered h2 anchors).
import type { TocEntry } from '../../utils/markdown'

defineProps<{
  toc: TocEntry[]
}>()

/**
 * Same-page anchors handled manually: native hash navigation jumps
 * instantly and the popstate it fires makes vue-router scroll a second
 * time. scrollIntoView honors the headings' scroll-margin-top (sticky
 * chrome offset) so the section lands fully visible, smooth unless the
 * user prefers reduced motion.
 */
function scrollToSection(id: string): void {
  const heading = document.getElementById(id)
  if (!heading) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  // Keep the URL shareable without a router navigation (replaceState fires
  // no popstate, so vue-router stays out of it).
  history.replaceState(history.state, '', `#${id}`)
  // Reading/tab order follows the jump for keyboard and SR users.
  heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}
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
          @click.prevent="scrollToSection(entry.id)"
        >{{ entry.text }}</a>
      </li>
    </ol>
  </nav>
</template>
