// Copperhead — ICJIA Research Hub 2.0 public frontend.
// Architecture baseline: docs/adr/0001-phase-0-architecture-baseline.md
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  devtools: { enabled: true },

  app: {
    // URL-parity contract: every route lives under /researchhub/, exactly as
    // on the live hub. The main website proxies /researchhub/* to this site.
    baseURL: '/researchhub/',
    head: {
      htmlAttrs: { lang: 'en' },
      // Default title is baked into every generated document — including the
      // SPA-fallback 404 shell, which must not ship an empty <title>.
      title: 'ICJIA Research Hub',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/researchhub/favicon.svg' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-07-11',

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
