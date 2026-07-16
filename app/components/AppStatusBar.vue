<script setup lang="ts">
/**
 * Bottom status bar for managers/reviewers: the deployed version plus links
 * to the living project docs. Always current — the version comes from
 * package.json (runtimeConfig) and the doc links point at the canonical
 * sources, so this bar reflects the app's actual state at any time.
 */
const version = useRuntimeConfig().public.version
const repoUrl = 'https://github.com/ICJIA/copperhead-hub-20'
const changelogUrl = `${repoUrl}/blob/main/CHANGELOG.md`
const roadmapUrl = `${repoUrl}/blob/main/ROADMAP.md`
</script>

<template>
  <div class="border-t border-white/10 bg-icjia-900 text-icjia-200">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-xs">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white">
        <span
          class="size-1.5 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
        Copperhead build v{{ version }}
      </span>
      <nav
        class="flex flex-wrap items-center gap-x-5 gap-y-1"
        aria-label="Project status and documentation"
      >
        <NuxtLink
          to="/spec"
          class="hover:text-white hover:underline"
        >
          Spec &amp; status
        </NuxtLink>
        <a
          :href="changelogUrl"
          target="_blank"
          rel="noopener"
          class="hover:text-white hover:underline"
        >
          Changelog
        </a>
        <a
          :href="roadmapUrl"
          target="_blank"
          rel="noopener"
          class="hover:text-white hover:underline"
        >
          Roadmap
        </a>
        <a
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 hover:text-white hover:underline"
        >
          <UIcon
            name="i-lucide-github"
            class="size-3.5"
            aria-hidden="true"
          />
          Repository
        </a>
      </nav>
    </div>
  </div>
</template>
