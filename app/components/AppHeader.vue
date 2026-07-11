<script setup lang="ts">
const route = useRoute()

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

const agencyNav = [
  { label: 'About', href: 'https://icjia.illinois.gov/about/' },
  { label: 'Research', href: 'https://icjia.illinois.gov/research/' },
  { label: 'Grant Resources', href: 'https://icjia.illinois.gov/grants/' },
  { label: 'Partners', href: 'https://icjia.illinois.gov/partners/' },
]

const sectionNav = [
  { label: 'Research Hub', to: '/' },
  { label: 'Centers', to: '/centers' },
  { label: 'Articles', to: '/articles' },
  { label: 'Data', to: '/datasets' },
  { label: 'Projects', to: '/projects' },
]
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
          <span
            class="flex h-11 w-14 items-center justify-center rounded-sm bg-icjia-800 font-serif text-lg font-bold tracking-wide text-white"
            aria-hidden="true"
          >
            ICJIA
          </span>
          <span class="hidden text-xs leading-tight font-semibold tracking-wide text-highlighted uppercase sm:block">
            Illinois Criminal Justice<br>Information Authority
          </span>
          <span class="sr-only">Illinois Criminal Justice Information Authority home</span>
        </a>
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
        class="mx-auto flex max-w-7xl items-center justify-between px-4"
      >
        <div class="flex items-center">
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
        <div class="flex items-center gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
            label="Preview build"
          />
          <ColorModeToggle />
        </div>
      </nav>
    </div>
  </header>
</template>
