/**
 * hub.config.mjs — the single source of truth for Copperhead's critical
 * values. Every other file (nuxt.config.ts, app code, build scripts,
 * test configs) imports from here; none of these values may be written
 * as literals anywhere else.
 *
 * Plain ESM so Node scripts (.mjs), TypeScript configs, and app code can
 * all import it. Exception: lighthouserc.cjs is CommonJS (LHCI requirement)
 * and mirrors two values by hand — keep it in sync when changing baseURL.
 */

/**
 * Manager-annotation KILL SWITCH. Flip to `false` before go-live: the
 * annotation layer, its CSS, and every Supabase reference are then dropped
 * from the build. The layer is a build-time-conditional import (tree-shaken
 * via the `__ANN_ENABLED__` Vite constant in nuxt.config.ts), and the
 * `supabase` block below becomes `null` so its URL/key literals fall out of
 * the shared config chunk. Verified by the grep proof in the README runbook.
 * Also remove the Supabase origin from netlify.toml connect-src.
 */
const ANNOTATIONS_ENABLED = true

export const hub = {
  site: {
    /** Public product name (the codename never appears on the site). */
    name: 'ICJIA Research Hub',
    codename: 'Copperhead',
    description:
      'Research articles, datasets, and data dashboards published by the Illinois Criminal Justice Information Authority.',
    /**
     * URL-parity contract: every route lives under this path, exactly as on
     * the live hub. The main website proxies this path to the standalone
     * deployment at launch.
     */
    baseURL: '/researchhub/',
    /** baseURL without slashes — the directory name in the static output. */
    basePath: 'researchhub',
    /** Where the Hub lives in production (via the main-site proxy). */
    productionOrigin: 'https://icjia.illinois.gov',
    /** Standalone Netlify deployment (crawl-blocked until launch). */
    previewOrigin: 'https://copperhead-hub-20.netlify.app',
  },

  cms: {
    /** Strapi 5 — migrated, verified. Override: NUXT_PUBLIC_STRAPI_URL. */
    origin: 'https://v2.hub.icjia-api.cloud',
    /** Strapi 3 — end-of-life; kept for redirect/parity decisions only. */
    legacyOrigin: 'https://researchhub.icjia-api.cloud',
    /** List fetches paginate to completion at this page size. */
    pageSize: 100,
    retries: 2,
    retryDelayMs: 500,
  },

  content: {
    /** "Latest publications" strip on the home page. */
    homeLatestCount: 3,
    /** Hub 1.0 parity: listings load 42 items per page. */
    listingPageSize: 42,
  },

  colorMode: {
    /** Light is the product default; dark is a persisted user choice. */
    preference: 'light',
    fallback: 'light',
  },

  netlify: {
    siteName: 'copperhead-hub-20',
    siteId: '0a3b53a9-46eb-487a-81cb-4cc13d8540da',
  },

  analytics: {
    /** Self-hosted Plausible instance. */
    plausibleHost: 'https://plausible.icjia.cloud',
    /**
     * The reporting property. The loader only activates when the page is
     * actually served from this hostname, so preview/branch deploys never
     * pollute production statistics.
     */
    domain: 'icjia.illinois.gov',
  },

  annotations: {
    /**
     * Manager review annotations (spec: docs/superpowers/specs/
     * 2026-07-21-manager-annotations-design.md). Toggle with the
     * ANNOTATIONS_ENABLED kill switch at the top of this file.
     */
    enabled: ANNOTATIONS_ENABLED,
    /**
     * `null` when the kill switch is off, so the URL/key literals tree-shake
     * out of the client bundle. The publishable key is safe to commit by
     * design (it ships in the client bundle while enabled); RLS is the
     * security boundary. Overridable per environment via
     * NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY (see .env.example).
     */
    supabase: ANNOTATIONS_ENABLED
      ? {
          // Project "holdem-simulator" (efgevsdftkrancswojcz), us-east-1.
          url: 'https://efgevsdftkrancswojcz.supabase.co',
          publishableKey: 'sb_publishable_xYEjTCTxp-UaYGsFQMay6g_HA7BM9cn',
          table: 'copperhead_annotations',
        }
      : null,
  },
}

export default hub
