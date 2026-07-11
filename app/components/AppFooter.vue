<script setup lang="ts">
const columns = [
  {
    heading: 'Overview',
    links: [
      { label: 'About', href: 'https://icjia.illinois.gov/about/' },
      { label: 'Events', href: 'https://icjia.illinois.gov/events/' },
      { label: 'Press', href: 'https://icjia.illinois.gov/press/' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Funding', href: 'https://icjia.illinois.gov/funding/' },
      { label: 'Research', href: 'https://icjia.illinois.gov/research/' },
      { label: 'Employment', href: 'https://icjia.illinois.gov/employment/' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: 'Contact Us', href: 'https://icjia.illinois.gov/contact/' },
      { label: 'Grant Status Request', href: 'https://icjia.illinois.gov/grant-status-request/' },
      { label: 'News & Information', href: 'https://icjia.illinois.gov/news/' },
    ],
  },
]
</script>

<template>
  <footer class="bg-icjia-800 text-icjia-100">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <span
          class="inline-flex h-12 w-16 items-center justify-center rounded-sm bg-white/10 font-serif text-xl font-bold tracking-wide text-white"
          aria-hidden="true"
        >
          ICJIA
        </span>
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
            href="https://icjia.illinois.gov/privacy/"
            class="hover:text-white hover:underline"
          >Privacy Policy</a>
          <a
            href="https://icjia.illinois.gov/accessibility/"
            class="hover:text-white hover:underline"
          >Accessibility</a>
        </div>
      </div>
    </div>
  </footer>
</template>
