<script setup lang="ts">
const route = useRoute()

// Public assets live at the app baseURL (/researchhub/), so build the logo
// path from it rather than a root-absolute src that would 404 (same as footer).
const logoSrc = `${useRuntimeConfig().app.baseURL}icjia-logo.png`

// Breadcrumb trail for the navy band. "Home" is the main agency site;
// everything under /researchhub/ is this app.
const crumbs = computed(() => {
  const trail: { label: string, to?: string, external?: boolean }[] = [
    { label: 'Home', to: 'https://icjia.illinois.gov/', external: true },
    { label: 'Research and Analysis Unit' },
  ]
  if (route.path.startsWith('/articles')) {
    trail.push({ label: 'Articles & Reports', to: '/articles' })
  }
  else if (route.path.startsWith('/datasets') || route.path.startsWith('/apps')) {
    trail.push({ label: 'Analytics & Data', to: '/datasets' })
  }
  else if (route.path.startsWith('/centers')) {
    trail.push({ label: 'Centers', to: '/centers' })
  }
  else if (route.path.startsWith('/projects')) {
    trail.push({ label: 'Projects', to: '/projects' })
  }
  else {
    trail.push({ label: 'Research Hub', to: '/' })
  }
  return trail
})

// Mirrors the main site's global nav — every target verified against the
// live sitemap (Partners is a main-site dropdown with no landing page and
// is omitted; the real global chrome is the main site's job at launch).
const agencyNav = [
  { label: 'About', href: 'https://icjia.illinois.gov/about/about-the-authority/' },
  { label: 'Research', href: 'https://icjia.illinois.gov/researchhub/' },
  { label: 'Grant Resources', href: 'https://icjia.illinois.gov/grants/funding/' },
]

const sectionNav = [
  { label: 'Research Hub', to: '/' },
  { label: 'Centers', to: '/centers' },
  { label: 'Articles', to: '/articles' },
  { label: 'Data', to: '/datasets' },
  { label: 'Projects', to: '/projects' },
]

// Build badge: shows the deployed version and links to the changelog.
const version = useRuntimeConfig().public.version
const changelogUrl = 'https://github.com/ICJIA/copperhead-hub-20/blob/main/CHANGELOG.md'
</script>

<template>
  <header>
    <!-- Agency bar -->
    <div class="border-b border-default bg-default">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <a
          href="https://icjia.illinois.gov/"
          class="flex items-center gap-3"
        >
          <img
            :src="logoSrc"
            width="250"
            height="175"
            alt=""
            aria-hidden="true"
            class="h-11 w-auto rounded-sm"
            decoding="async"
          >
          <span class="hidden text-xs leading-tight font-semibold tracking-wide text-highlighted uppercase sm:block">
            Illinois Criminal Justice<br>Information Authority
          </span>
          <span class="sr-only">Illinois Criminal Justice Information Authority home</span>
        </a>
        <div class="flex items-center gap-5">
          <nav
            aria-label="Agency"
            class="hidden items-center gap-6 md:flex"
          >
            <a
              v-for="item in agencyNav"
              :key="item.label"
              :href="item.href"
              class="text-xs font-semibold tracking-wider text-toned uppercase hover:text-primary"
            >
              {{ item.label }}
            </a>
          </nav>
          <!-- Figma: square navy search control at the agency bar's right -->
          <NuxtLink
            to="/search"
            class="flex size-9 items-center justify-center rounded-md bg-icjia-800 text-white hover:bg-icjia-700"
            aria-label="Search the Research Hub"
          >
            <UIcon
              name="i-lucide-search"
              class="size-4.5"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Breadcrumb band -->
    <div class="bg-icjia-800">
      <nav
        aria-label="Breadcrumb"
        class="mx-auto max-w-7xl px-4 py-2"
      >
        <ol class="flex flex-wrap items-center gap-1 text-sm text-icjia-100">
          <li
            v-for="(crumb, index) in crumbs"
            :key="crumb.label"
            class="flex items-center gap-1"
          >
            <UIcon
              v-if="index > 0"
              name="i-lucide-chevron-right"
              class="size-3.5 text-icjia-300"
              aria-hidden="true"
            />
            <a
              v-if="crumb.external && crumb.to"
              :href="crumb.to"
              class="hover:text-white hover:underline"
            >{{ crumb.label }}</a>
            <NuxtLink
              v-else-if="crumb.to"
              :to="crumb.to"
              class="hover:text-white hover:underline"
            >{{ crumb.label }}</NuxtLink>
            <span
              v-else
              class="text-icjia-200"
            >{{ crumb.label }}</span>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Section nav -->
    <div class="border-b border-default bg-default">
      <nav
        aria-label="Research Hub sections"
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4"
      >
        <!-- Horizontal scroll at narrow widths (WCAG 1.4.10 reflow) -->
        <div class="flex max-w-full items-center overflow-x-auto">
          <NuxtLink
            v-for="item in sectionNav"
            :key="item.to"
            :to="item.to"
            class="px-4 py-3.5 text-xs font-bold tracking-widest text-toned uppercase hover:text-primary"
            :class="{ 'text-primary': route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) }"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <a
            :href="changelogUrl"
            target="_blank"
            rel="noopener"
            :aria-label="`Copperhead build · v${version} — open changelog in a new tab`"
            class="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <UBadge
              color="neutral"
              variant="subtle"
              :label="`Copperhead build · v${version}`"
              class="cursor-pointer transition-colors hover:bg-accented"
            />
          </a>
          <!-- The manager-annotation review toggle teleports into this slot
               when the feature is enabled; empty (kill-switch safe) otherwise. -->
          <div
            id="review-toggle-slot"
            class="flex items-center"
          />
          <ColorModeToggle />
        </div>
      </nav>
    </div>
  </header>
</template>
