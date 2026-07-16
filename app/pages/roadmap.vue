<script setup lang="ts">
/**
 * In-app view of the project roadmap, so managers can read done / next /
 * deferred alongside the in-app spec (/spec) and the status bar. There is a
 * single source of truth — the repository's ROADMAP.md — imported at build
 * time and rendered through the same markdown pipeline as article bodies, so
 * the in-app roadmap and the repo file can never drift. The raw .md is also
 * published to /roadmap/ (by scripts/copy-spec.mjs) and offered as a download.
 * Kept current by keeping ROADMAP.md current.
 */
import roadmapSource from '../../ROADMAP.md?raw'

const repoUrl = 'https://github.com/ICJIA/copperhead-hub-20'

// Render the repo's ROADMAP.md, with two adjustments so it works in-app:
// drop the leading H1 (this page supplies its own heading), and repoint the
// two repo-relative doc links — they resolve on GitHub but would 404 here — at
// their in-app / canonical equivalents.
const body = roadmapSource
  .replace(/^#\s+.*\r?\n+/, '')
  .replace(/\]\(\.\/CHANGELOG\.md\)/g, `](${repoUrl}/blob/main/CHANGELOG.md)`)
  .replace(/\]\(\.\/docs\/ICJIA-Hub-20-rewrite-copperhead\.md\)/g, '](/spec)')
const { html } = renderMarkdown(body)

const base = useRuntimeConfig().app.baseURL
const mdHref = `${base}roadmap/ROADMAP.md`
const repoRoadmapUrl = `${repoUrl}/blob/main/ROADMAP.md`
const version = useRuntimeConfig().public.version

useSeoMeta({
  title: 'Roadmap — ICJIA Research Hub',
  description: 'The forward-looking roadmap for Project Copperhead: done, next, and deferred.',
  robots: 'noindex',
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="flex flex-wrap items-start justify-between gap-4 border-b border-default pb-6">
      <div>
        <p class="text-xs font-semibold tracking-widest text-primary uppercase">
          Copperhead build v{{ version }}
        </p>
        <h1 class="mt-1 text-3xl font-bold text-highlighted">
          Roadmap
        </h1>
        <p class="mt-2 text-sm text-toned">
          Done, next, and deferred for the new Research Hub. Kept current with every change.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          :to="mdHref"
          target="_blank"
          rel="noopener"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-file-text"
          label="Download .md"
        />
        <UButton
          :to="repoRoadmapUrl"
          target="_blank"
          rel="noopener"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-github"
          label="View on GitHub"
        />
      </div>
    </div>

    <article
      class="article-body mt-8"
      v-html="html"
    />
  </div>
</template>
