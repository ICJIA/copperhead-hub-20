import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests only — Playwright owns tests/a11y/**.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
