<script setup lang="ts">
import type { Project } from '../../types/content'

defineProps<{
  projects: Project[]
  intro: string
}>()

// Fixed, contrast-safe header palette assigned by position (the design
// shows navy/red/green tiles). CMS `headerBgRaw` is intentionally NOT
// bound — arbitrary class strings from the CMS don't survive Tailwind's
// build and aren't contrast-audited (plan, Appendix A.5 #8).
const HEADER_PALETTE = ['bg-icjia-800', 'bg-red-900', 'bg-emerald-900']

function headerClass(index: number): string {
  return HEADER_PALETTE[index % HEADER_PALETTE.length]!
}
</script>

<template>
  <section
    aria-labelledby="projects-heading"
    class="bg-icjia-900"
  >
    <div class="mx-auto max-w-7xl px-4 py-12">
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-landmark"
            class="size-5 text-white"
          />
        </span>
        <h2
          id="projects-heading"
          class="text-2xl font-bold text-white"
        >
          Major Projects in R&amp;A
        </h2>
      </div>
      <p class="mt-3 max-w-3xl text-sm leading-relaxed text-icjia-100">
        {{ intro }}
      </p>
      <ul
        class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        <li
          v-for="(project, index) in projects"
          :key="project.documentId"
        >
          <article
            class="relative flex h-full flex-col rounded-lg p-6 text-white shadow-md transition-shadow focus-within:ring-2 focus-within:ring-white hover:shadow-lg"
            :class="headerClass(index)"
          >
            <span
              v-if="project.category"
              class="inline-flex self-start rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white"
            >
              {{ project.category }}
            </span>
            <h3 class="mt-3 text-lg font-bold">
              <NuxtLink
                :to="`/projects/${project.slug}`"
                class="after:absolute after:inset-0 focus:outline-none"
              >
                {{ project.title }}
              </NuxtLink>
            </h3>
            <p class="mt-2 line-clamp-4 text-sm leading-relaxed text-white/85">
              {{ project.description }}
            </p>
            <ul
              v-if="project.bullets.length"
              class="mt-4 space-y-1.5"
            >
              <li
                v-for="bullet in project.bullets"
                :key="bullet"
                class="flex items-center gap-2 text-sm text-white/90"
              >
                <UIcon
                  name="i-lucide-check-circle"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
                {{ bullet }}
              </li>
            </ul>
            <!-- Visual affordance only — the card's stretched link carries
                 the accessible name (Figma: white outline Learn More). -->
            <div
              class="mt-auto self-end pt-5"
              aria-hidden="true"
            >
              <span class="inline-flex items-center rounded-md border border-white/60 bg-white/5 px-3.5 py-1.5 text-sm font-semibold">
                Learn More
              </span>
            </div>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>
