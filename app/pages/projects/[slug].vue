<script setup lang="ts">
import { hub as hubConfig } from '../../../hub.config.mjs'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useAsyncData(`project-${slug}`, async () => {
  const project = await fetchProjectBySlug(slug)
  const rendered = renderMarkdown(project.body)
  return { project, html: rendered.html }
})

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 500,
    statusMessage: error.value?.statusCode === 404
      ? 'Project not found'
      : `Project fetch failed: ${error.value?.message}`,
    fatal: true,
  })
}

const project = computed(() => data.value!.project)

useSeoMeta({
  title: () => `${project.value.title} — ICJIA Research Hub`,
  description: () => (project.value.description ?? '').slice(0, 158),
})

useHead({
  link: [{ rel: 'canonical', href: `${hubConfig.site.productionOrigin}${hubConfig.site.baseURL}projects/${slug}/` }],
})
</script>

<template>
  <div v-if="project">
    <!-- Title band -->
    <div class="bg-default">
      <div class="mx-auto max-w-7xl px-4 pt-10 pb-6">
        <div class="flex items-start gap-4">
          <span
            class="mt-1 flex size-12 shrink-0 items-center justify-center rounded-lg bg-icjia-800"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-landmark"
              class="size-6 text-white"
            />
          </span>
          <div>
            <h1 class="text-3xl font-bold text-icjia-800 sm:text-4xl dark:text-icjia-200">
              {{ project.title }}
            </h1>
            <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <CategoryChip
                v-if="project.category"
                :label="project.category"
              />
              <span
                v-if="project.date"
                class="inline-flex items-center gap-1.5 text-muted"
              >
                <UIcon
                  name="i-lucide-calendar"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ formatDate(project.date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 pb-16">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p
            v-if="project.subtitle"
            class="text-lg leading-relaxed text-toned"
          >
            {{ project.subtitle }}
          </p>
          <div
            v-if="data?.html"
            class="article-body mt-6"
            v-html="data.html"
          />
        </div>

        <aside
          class="space-y-6"
          aria-label="Project context"
        >
          <div
            v-if="project.bullets.length"
            class="rounded-lg border border-default bg-default p-5"
          >
            <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
              Focus Areas
            </h2>
            <ul class="mt-3 space-y-2">
              <li
                v-for="bullet in project.bullets"
                :key="bullet"
                class="flex items-center gap-2 text-sm text-toned"
              >
                <UIcon
                  name="i-lucide-check-circle"
                  class="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {{ bullet }}
              </li>
            </ul>
          </div>

          <div
            v-if="project.authors.length"
            class="rounded-lg bg-icjia-50 p-5 dark:bg-icjia-950"
          >
            <h2 class="text-sm font-bold tracking-wide text-highlighted uppercase">
              Project Manager
            </h2>
            <p class="mt-2 text-sm text-toned">
              {{ project.authors.join(', ') }}
            </p>
            <UButton
              v-if="project.email"
              :to="`mailto:${project.email}`"
              color="primary"
              variant="outline"
              size="sm"
              class="mt-3"
              icon="i-lucide-mail"
              label="Contact"
            />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
