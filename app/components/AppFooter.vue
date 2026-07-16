<script setup lang="ts">
// Public assets live at the app baseURL (/researchhub/), so build the
// logo path from it rather than a root-absolute src that would 404.
const logoSrc = `${useRuntimeConfig().app.baseURL}icjia-logo.png`

// Every target verified against the main site's live sitemap (no dead
// links; "Grant Status Request" and "Terms of Use" from the design have
// no existing pages and are omitted until the main site adds them).
const columns = [
  {
    heading: 'Overview',
    links: [
      { label: 'About', href: 'https://icjia.illinois.gov/about/about-the-authority/' },
      { label: 'Events', href: 'https://icjia.illinois.gov/events/' },
      { label: 'News', href: 'https://icjia.illinois.gov/news/' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Funding', href: 'https://icjia.illinois.gov/grants/funding/' },
      { label: 'Publications', href: 'https://icjia.illinois.gov/about/publications/' },
      { label: 'Employment', href: 'https://icjia.illinois.gov/about/employment/' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: 'Contact Us', href: 'https://icjia.illinois.gov/about/contact/' },
      { label: 'ICJIA Staff', href: 'https://icjia.illinois.gov/about/icjia-staff/' },
      { label: 'Subscribe to ICJIA News', href: 'https://icjia.illinois.gov/news/' },
    ],
  },
]
</script>

<template>
  <footer class="bg-icjia-800 text-icjia-100">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <img
          :src="logoSrc"
          width="250"
          height="175"
          alt="ICJIA"
          class="h-16 w-auto rounded-sm"
          decoding="async"
        >
        <p class="mt-4 text-xs leading-relaxed font-semibold tracking-wide uppercase">
          Illinois Criminal Justice<br>Information Authority
        </p>
      </div>
      <nav
        v-for="column in columns"
        :key="column.heading"
        :aria-label="`Footer — ${column.heading}`"
      >
        <h2 class="mb-4 text-sm font-bold text-white">
          {{ column.heading }}
        </h2>
        <ul class="space-y-2.5">
          <li
            v-for="link in column.links"
            :key="link.label"
          >
            <a
              :href="link.href"
              class="text-sm text-icjia-200 hover:text-white hover:underline"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </nav>
    </div>
    <div class="border-t border-white/15">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-icjia-300 sm:flex-row">
        <p>© {{ new Date().getFullYear() }} Illinois Criminal Justice Information Authority. All rights reserved.</p>
        <div class="flex gap-4">
          <a
            href="https://icjia.illinois.gov/about/privacy/"
            class="hover:text-white hover:underline"
          >Privacy Policy</a>
          <a
            href="https://icjia.illinois.gov/about/policies/"
            class="hover:text-white hover:underline"
          >Policies &amp; Accessibility</a>
        </div>
      </div>
    </div>
  </footer>
</template>
