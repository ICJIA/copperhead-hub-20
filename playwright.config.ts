import { defineConfig, devices } from '@playwright/test'

// Accessibility suite. Runs against the statically generated site in
// .output/public — the exact artifact Netlify serves — never against a
// dev server. `pnpm generate` must run first (CI does this).
export default defineConfig({
  testDir: 'tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    // Both color schemes: the theme tokens differ per mode (main.css), and a
    // shade that passes AA on light surfaces can fail on dark ones.
    {
      name: 'chromium-light',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'chromium-dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
  ],
  webServer: {
    command: 'npx http-server .output/public -p 4173 --silent',
    url: 'http://localhost:4173/researchhub/',
    reuseExistingServer: !process.env.CI,
  },
})
