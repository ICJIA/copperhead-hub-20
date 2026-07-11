/**
 * Domain models for Research Hub content.
 *
 * These are the shapes the application works with everywhere. Raw Strapi
 * responses (inconsistent casing, relative media URLs, single-vs-array
 * quirks) are converted exactly once, in app/utils/normalize.ts — nothing
 * outside that file touches a raw CMS response.
 */

export interface MediaFile {
  documentId: string
  name: string
  /** Absolute URL (normalization prefixes the CMS origin onto /uploads/…). */
  url: string
  alternativeText: string
  mime: string
  ext: string
  /** Size in kilobytes as reported by Strapi. */
  sizeKb: number
  width?: number
  height?: number
  formats?: Record<string, { url: string, width: number, height: number }>
}

export interface Author {
  name: string
  bio?: string
}

/** Minimal reference to a related content item (for cross-links). */
export interface LinkedRef {
  documentId: string
  slug: string
  title: string
}

/** Editorial status carried over from Hub 1.0 ('published' | 'archived'). */
export type HubStatus = string

export interface Article {
  documentId: string
  legacyId?: string
  slug: string
  title: string
  /** Publication type (report, update, evaluation, …). */
  type?: string
  status: HubStatus
  /** Display date (YYYY-MM-DD). */
  date: string
  publishedAt?: string
  updatedAt?: string
  external: boolean
  categories: string[]
  tags: string[]
  authors: Author[]
  abstract: string
  /** Raw markdown body — render via renderMarkdown() only. */
  markdown: string
  funding?: string
  citation?: string
  doi?: string
  hideFromBanner: boolean
  splash?: MediaFile
  thumbnail?: MediaFile
  mainfile?: MediaFile
  mainfiletype?: string
  extrafile?: MediaFile
  relatedApps: LinkedRef[]
  relatedDatasets: LinkedRef[]
}

export interface DatasetSource {
  title: string
  url?: string
}

export interface DatasetVariable {
  name: string
  type?: string
  definition?: string
}

export interface Dataset {
  documentId: string
  legacyId?: string
  slug: string
  title: string
  status: HubStatus
  date: string
  external: boolean
  categories: string[]
  tags: string[]
  description: string
  sources: DatasetSource[]
  unit?: string
  timeperiod?: { yeartype?: string, yearmin?: number, yearmax?: number }
  notes: string[]
  variables: DatasetVariable[]
  funding?: string
  citation?: string
  datafile?: MediaFile
  relatedApps: LinkedRef[]
  relatedArticles: LinkedRef[]
}

export interface App {
  documentId: string
  legacyId?: string
  slug: string
  title: string
  status: HubStatus
  date: string
  external: boolean
  categories: string[]
  tags: string[]
  contributors: Author[]
  description: string
  /** External dashboard URL (apps are hosted outside the Hub). */
  url?: string
  funding?: string
  citation?: string
  image?: MediaFile
  relatedDatasets: LinkedRef[]
  relatedArticles: LinkedRef[]
}

export interface Project {
  documentId: string
  slug: string
  title: string
  subtitle?: string
  body: string
  description?: string
  authors: string[]
  date?: string
  category?: string
  bullets: string[]
  order?: number
  email?: string
  /**
   * Presentation hints stored in the CMS (Tailwind class string / icon name).
   * Carried through for reference but NEVER bound directly as classes —
   * Phase 2 maps them to a safelisted token set.
   */
  headerBgRaw?: string
  iconRaw?: string
}

export interface Center {
  documentId: string
  title: string
  author?: string
  description: string
}

export interface Page {
  documentId: string
  slug: string
  title: string
  summary?: string
  body: string
}
