<script setup lang="ts">
// "Stay Informed" band per the design. The design shows an inline email
// form; a static site needs a subscription backend for that, so until
// that integration is decided (Phase 4 item) this links to the agency's
// existing signup — no fake form fields.
</script>

<template>
  <section
    aria-labelledby="newsletter-heading"
    class="bg-icjia-900"
  >
    <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-12 text-center">
      <span
        class="flex size-12 items-center justify-center rounded-full bg-white/10"
        aria-hidden="true"
      >
        <UIcon
          name="i-lucide-mail"
          class="size-6 text-white"
        />
      </span>
      <h2
        id="newsletter-heading"
        class="text-2xl font-bold text-white"
      >
        Stay Informed
      </h2>
      <p class="max-w-xl text-sm leading-relaxed text-icjia-100">
        Get the latest ICJIA news, grant announcements, and new research
        publications delivered directly to your inbox.
      </p>
      <UButton
        to="https://icjia.illinois.gov/news/"
        target="_blank"
        rel="noopener"
        color="neutral"
        variant="solid"
        size="lg"
        icon="i-lucide-mail-plus"
        label="Subscribe to ICJIA News"
      />
    </div>
  </section>
</template>
