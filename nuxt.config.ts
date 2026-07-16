// Copperhead — ICJIA Research Hub 2.0 public frontend.
// Architecture baseline: docs/adr/0001-phase-0-architecture-baseline.md
// Critical values come from hub.config.mjs — the single source of truth.
import { hub } from './hub.config.mjs'
import pkg from './package.json' with { type: 'json' }

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/image'],

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
        // CMS media is cross-origin; connection setup would otherwise sit
        // on the LCP critical path for image-bearing pages.
        { rel: 'preconnect', href: hub.cms.origin, crossorigin: '' },
        { rel: 'dns-prefetch', href: hub.cms.origin },
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
      // Surfaced in the build badge (AppHeader). Sourced from package.json
      // so the chip and the release tag never drift.
      version: pkg.version,
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
      routes: ['/', '/articles', '/datasets', '/apps', '/centers', '/projects', '/publications', '/hub-staff', '/search', '/reader'],
      // A registered page that fails to render must fail the build.
      failOnError: true,
    },
  },

  typescript: {
    strict: true,
  },

  hooks: {
    // Register every content route explicitly — listings paginate client-side
    // past the first page, so link-crawling alone would miss the tail.
    async 'prerender:routes'(ctx) {
      const collections: [string, string][] = [
        ['articles', '/articles'],
        ['datasets', '/datasets'],
        ['apps', '/apps'],
        ['projects', '/projects'],
        // Generic CMS pages (hub-overview, dicra, hub-home, …) render at
        // /:slug — every authored page entry gets a route automatically.
        ['pages', ''],
      ]
      for (const [collection, prefix] of collections) {
        let page = 1
        for (;;) {
          const res = await fetch(
            `${hub.cms.origin}/api/${collection}?fields[0]=slug&pagination[pageSize]=100&pagination[page]=${page}`,
          )
          if (!res.ok) throw new Error(`${collection} slug fetch failed: HTTP ${res.status}`)
          const json = await res.json() as {
            data: { slug: string }[]
            meta: { pagination: { pageCount: number } }
          }
          for (const row of json.data) ctx.routes.add(`${prefix}/${row.slug}`)
          if (page >= json.meta.pagination.pageCount) break
          page++
        }
      }
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  icon: {
    // Icons ship in the bundle or not at all — the runtime iconify-API
    // fallback violates the CSP (connect-src) and adds a CDN dependency.
    // Dynamically-bound names (the color-mode toggle) evade the source
    // scan, so they are pinned explicitly.
    clientBundle: {
      scan: true,
      // loader-circle is Nuxt UI's button loading spinner; x, book-open and
      // external-link render inside programmatic toasts — none appear in
      // static templates, which is all the scan can see.
      icons: [
        'lucide:sun',
        'lucide:moon',
        'lucide:loader-circle',
        'lucide:x',
        'lucide:book-open',
        'lucide:external-link',
        // /reader toolbar + states (some render only mid-interaction).
        'lucide:arrow-left',
        'lucide:chevron-up',
        'lucide:chevron-down',
        'lucide:download',
        'lucide:file-x',
        'lucide:alert-triangle',
      ],
    },
    fallbackToApi: false,
  },

  image: {
    // Build-time optimization: prerendered pages reference same-origin
    // /_ipx assets (webp, sized) instead of cross-origin CMS originals —
    // no connection-setup penalty on the LCP path, roughly half the bytes.
    // provider is PINNED to static generation: on Netlify the module would
    // otherwise auto-switch to Netlify's runtime Image CDN, whose requests
    // 400 without remote-image authorization — and the deployed artifact
    // must be identical to the locally tested one (ADR 0001).
    provider: 'ipxStatic',
    domains: [new URL(hub.cms.origin).host],
    format: ['webp'],
    quality: 75,
  },
})
