<script setup lang="ts">
// Figma block: Citation section with DOI link (anchor target for the
// "Cite Article" action).
const props = defineProps<{
  citationHtml: string
  doi?: string
}>()

const doiHref = computed(() => {
  if (!props.doi) return undefined
  return props.doi.startsWith('http') ? props.doi : `https://doi.org/${props.doi}`
})
</script>

<template>
  <section
    v-if="citationHtml"
    id="citation"
    aria-labelledby="citation-heading"
    class="mt-12 scroll-mt-20"
  >
    <h2
      id="citation-heading"
      class="text-xl font-bold text-highlighted"
    >
      Citation
    </h2>
    <div
      class="mt-2 text-sm leading-relaxed text-toned"
      v-html="citationHtml"
    />
    <p
      v-if="doiHref"
      class="mt-2 text-sm"
    >
      DOI:
      <a
        :href="doiHref"
        target="_blank"
        rel="noopener"
        class="text-primary underline"
      >{{ doi }}</a>
    </p>
  </section>
</template>
