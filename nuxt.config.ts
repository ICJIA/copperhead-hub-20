// Copperhead — ICJIA Research Hub 2.0 public frontend.
// Architecture baseline: docs/adr/0001-phase-0-architecture-baseline.md
// Critical values come from hub.config.mjs — the single source of truth.
import { hub } from './hub.config.mjs'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  devtools: { enabled: true },

  app: {
    baseURL: hub.site.baseURL,
    head: {
      htmlAttrs: { lang: 'en' },
      // Default title is baked into every generated document — including the
      // SPA-fallback 404 shell, which must not ship an empty <title>.
      title: hub.site.name,
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${hub.site.baseURL}favicon.svg` },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: hub.colorMode.preference,
    fallback: hub.colorMode.fallback,
  },

  runtimeConfig: {
    // Optional read-only CMS token (NUXT_STRAPI_TOKEN). Server-only; the
    // public role currently allows tokenless reads, so this may stay empty.
    // Defaults are placeholders by design — real values come from env vars,
    // never from this file (predecessor defect S2/S4).
    strapiToken: '',
    public: {
      // Override with NUXT_PUBLIC_STRAPI_URL if the CMS moves.
      strapiUrl: hub.cms.origin,
    },
  },

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
