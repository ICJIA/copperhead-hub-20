<template>
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-inverted"
    >
      Skip to main content
    </a>

    <header class="border-b border-default">
      <nav
        aria-label="Primary"
        class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
      >
        <NuxtLink
          to="/"
          class="text-lg font-semibold text-highlighted"
        >
          ICJIA Research Hub
        </NuxtLink>
        <div class="flex items-center gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
            label="Preview build"
          />
          <ColorModeToggle />
        </div>
      </nav>
    </header>

    <main
      id="main-content"
      class="mx-auto w-full max-w-5xl flex-1 px-4 py-10"
    >
      <slot />
    </main>

    <footer class="border-t border-default">
      <div class="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        <p>Illinois Criminal Justice Information Authority — Research &amp; Analysis Unit</p>
      </div>
    </footer>
  </div>
</template>
