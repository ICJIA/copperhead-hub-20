<template>
  <div class="flex min-h-screen flex-col bg-elevated/50">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-inverted"
    >
      Skip to main content
    </a>

    <AppHeader />

    <main
      id="main-content"
      class="w-full flex-1"
    >
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
