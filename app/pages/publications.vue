<script setup lang="ts">
// PLACEHOLDER PAGE — Hub 1.0 serves /researchhub/publications from the
// main agency site's publications data, which has no Hub-CMS equivalent
// yet. The route exists to honor the URL contract; the content source is
// a Phase 4 decision (agency publications feed vs. article-type filter).
useSeoMeta({
  title: 'Publications — ICJIA Research Hub',
  description: 'ICJIA publications, reports, and research articles.',
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <h1 class="text-3xl font-bold text-highlighted">
      Publications
    </h1>
    <p class="mt-4 max-w-2xl leading-relaxed text-toned">
      Research Hub publications — articles, reports, evaluations, and
      briefs — are available in the articles catalog. Agency-wide
      publications are on the main ICJIA website.
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <UButton
        to="/articles"
        color="primary"
        icon="i-lucide-files"
        label="Browse Research Hub articles"
      />
      <UButton
        to="https://icjia.illinois.gov/about/publications/"
        target="_blank"
        rel="noopener"
        color="neutral"
        variant="outline"
        icon="i-lucide-external-link"
        trailing
        label="Agency publications (icjia.illinois.gov)"
      />
    </div>
  </div>
</template>
