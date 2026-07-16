<script setup lang="ts">
/**
 * In-app view of the manager-facing spec/status doc. The markdown is
 * imported at build time and rendered through the same pipeline as article
 * bodies; the current .md and .docx are published to /spec/ by
 * scripts/copy-spec.mjs and offered here as downloads. Linked from the
 * bottom status bar. Kept current by keeping the source doc current.
 */
import specSource from '../../docs/ICJIA-Hub-20-rewrite-copperhead.md?raw'

// Drop the YAML frontmatter before rendering (title/subtitle/date block).
const body = specSource.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
const { html } = renderMarkdown(body)

const base = useRuntimeConfig().app.baseURL
const mdHref = `${base}spec/ICJIA-Hub-20-rewrite-copperhead.md`
const docxHref = `${base}spec/ICJIA-Hub-20-rewrite-copperhead.docx`
const version = useRuntimeConfig().public.version

useSeoMeta({
  title: 'Spec & Status — ICJIA Research Hub',
  description: 'The current specification and build status for Project Copperhead.',
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
          Specification &amp; Status
        </h1>
        <p class="mt-2 text-sm text-toned">
          The living spec for the new Research Hub. Kept current with every change.
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
          :to="docxHref"
          target="_blank"
          rel="noopener"
          color="primary"
          variant="outline"
          size="sm"
          icon="i-lucide-file-down"
          label="Download .docx"
        />
      </div>
    </div>

    <article
      class="article-body mt-8"
      v-html="html"
    />
  </div>
</template>
