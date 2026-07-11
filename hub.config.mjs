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
}

export default hub
