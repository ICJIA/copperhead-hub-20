<script setup lang="ts">
// PLACEHOLDER PAGE — Hub 1.0's staff page draws on agency biography data
// that has no Hub-CMS equivalent yet. The route exists to honor the URL
// contract; a staff collection (or hub-staff page entry) in Strapi will
// replace this copy when authored.
useSeoMeta({
  title: 'Research & Analysis Staff — ICJIA Research Hub',
  description: 'The staff of the ICJIA Research & Analysis Unit.',
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <h1 class="text-3xl font-bold text-highlighted">
      Research &amp; Analysis Staff
    </h1>
    <p class="mt-4 max-w-2xl leading-relaxed text-toned">
      The Research &amp; Analysis Unit is staffed by researchers, analysts,
      and data specialists across its centers. Staff biographies are
      available on the main ICJIA website.
    </p>
    <div class="mt-8">
      <UButton
        to="https://icjia.illinois.gov/about/icjia-staff/"
        target="_blank"
        rel="noopener"
        color="primary"
        icon="i-lucide-external-link"
        trailing
        label="Staff biographies (icjia.illinois.gov)"
      />
    </div>
  </div>
</template>
