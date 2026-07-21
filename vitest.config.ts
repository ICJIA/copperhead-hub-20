import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Match Nuxt's `~` → app/ alias so ported studio modules and their
    // tests resolve identically here and in the app build.
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
  test: {
    // Unit tests only — Playwright owns tests/a11y/**.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
