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

  nitro: {
    prerender: {
      // Routes are registered explicitly (see hooks below) — deterministic
      // and complete. Crawling is off because CMS article bodies contain
      // legacy links to slugs that no longer exist; those must 404 at
      // click-time (correct) rather than fail the build (Phase 4's link
      // audit reports them to the content team).
      crawlLinks: false,
      routes: ['/', '/articles'],
      // A registered page that fails to render must fail the build.
      failOnError: true,
    },
  },

  typescript: {
    strict: true,
  },

  hooks: {
    // Register every article route explicitly — listings paginate client-side
    // past the first page, so link-crawling alone would miss the tail.
    async 'prerender:routes'(ctx) {
      let page = 1
      for (;;) {
        const res = await fetch(
          `${hub.cms.origin}/api/articles?fields[0]=slug&pagination[pageSize]=100&pagination[page]=${page}`,
        )
        if (!res.ok) throw new Error(`Article slug fetch failed: HTTP ${res.status}`)
        const json = await res.json() as {
          data: { slug: string }[]
          meta: { pagination: { pageCount: number } }
        }
        for (const row of json.data) ctx.routes.add(`/articles/${row.slug}`)
        if (page >= json.meta.pagination.pageCount) break
        page++
      }
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
