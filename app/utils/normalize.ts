/**
 * The single place raw Strapi 5 responses become domain models.
 *
 * Quirks absorbed here (and only here):
 * - relative media URLs (`/uploads/…`) → absolute against the CMS origin
 * - field-casing drift between content types (`Title`/`SubTitle`/`Body`/
 *   `Author(s)` on projects/centers vs lowercase everywhere else)
 * - authors/contributors arriving as `{ title, description }` components
 * - optional fields arriving as `null` vs missing vs empty string
 */
import type {
  App,
  Article,
  ArticleSummary,
  Author,
  Center,
  Dataset,
  LinkedRef,
  MediaFile,
  Page,
  Project,
} from '../types/content'

/* Raw Strapi rows are untyped by design; all narrowing happens here. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>

function s(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function sOpt(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(v => typeof v === 'string') : []
}

export function absolutizeMediaUrl(url: string, origin: string): string {
  if (!url) return ''
  return url.startsWith('/') ? `${origin}${url}` : url
}

export function normalizeMedia(raw: Raw | null | undefined, origin: string): MediaFile | undefined {
  if (!raw || typeof raw !== 'object' || !raw.url) return undefined
  const formats: MediaFile['formats'] = {}
  if (raw.formats && typeof raw.formats === 'object') {
    for (const [key, f] of Object.entries(raw.formats as Raw)) {
      if (f && typeof f === 'object' && (f as Raw).url) {
        formats[key] = {
          url: absolutizeMediaUrl(s((f as Raw).url), origin),
          width: Number((f as Raw).width) || 0,
          height: Number((f as Raw).height) || 0,
        }
      }
    }
  }
  return {
    documentId: s(raw.documentId),
    name: s(raw.name),
    url: absolutizeMediaUrl(s(raw.url), origin),
    alternativeText: s(raw.alternativeText),
    mime: s(raw.mime),
    ext: s(raw.ext),
    sizeKb: Number(raw.size) || 0,
    width: typeof raw.width === 'number' ? raw.width : undefined,
    height: typeof raw.height === 'number' ? raw.height : undefined,
    formats: Object.keys(formats).length ? formats : undefined,
  }
}

/** Authors/contributors arrive as `{ title, description }` components. */
export function normalizeAuthors(value: unknown): Author[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') return { name: entry }
      if (entry && typeof entry === 'object') {
        const name = s((entry as Raw).title) || s((entry as Raw).name)
        const bio = sOpt((entry as Raw).description)
        return name ? { name, ...(bio ? { bio } : {}) } : null
      }
      return null
    })
    .filter((a): a is Author => a !== null)
}

function linkedRefs(value: unknown): LinkedRef[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const r = entry as Raw
      const documentId = s(r.documentId)
      const slug = s(r.slug)
      const title = s(r.title)
      return documentId && slug ? { documentId, slug, title } : null
    })
    .filter((r): r is LinkedRef => r !== null)
}

export function normalizeArticleSummary(raw: Raw, origin: string): ArticleSummary {
  return {
    documentId: s(raw.documentId),
    slug: s(raw.slug),
    title: s(raw.title),
    type: sOpt(raw.type),
    status: s(raw.status) || 'published',
    date: s(raw.date),
    external: raw.external === true,
    categories: stringArray(raw.categories),
    tags: stringArray(raw.tags),
    abstract: s(raw.abstract),
    thumbnail: normalizeMedia(raw.thumbnail, origin),
  }
}

export function normalizeArticle(raw: Raw, origin: string): Article {
  return {
    documentId: s(raw.documentId),
    legacyId: sOpt(raw.legacyId),
    slug: s(raw.slug),
    title: s(raw.title),
    type: sOpt(raw.type),
    status: s(raw.status) || 'published',
    date: s(raw.date),
    publishedAt: sOpt(raw.publishedAt),
    updatedAt: sOpt(raw.updatedAt),
    external: raw.external === true,
    categories: stringArray(raw.categories),
    tags: stringArray(raw.tags),
    authors: normalizeAuthors(raw.authors),
    abstract: s(raw.abstract),
    markdown: s(raw.markdown),
    funding: sOpt(raw.funding),
    citation: sOpt(raw.citation),
    doi: sOpt(raw.doi),
    hideFromBanner: raw.hideFromBanner === true,
    splash: normalizeMedia(raw.splash, origin),
    thumbnail: normalizeMedia(raw.thumbnail, origin),
    mainfile: normalizeMedia(raw.mainfile, origin),
    mainfiletype: sOpt(raw.mainfiletype),
    extrafile: normalizeMedia(raw.extrafile, origin),
    relatedApps: linkedRefs(raw.apps),
    relatedDatasets: linkedRefs(raw.datasets),
  }
}

export function normalizeDataset(raw: Raw, origin: string): Dataset {
  const timeperiod = raw.timeperiod && typeof raw.timeperiod === 'object'
    ? {
        yeartype: sOpt((raw.timeperiod as Raw).yeartype),
        yearmin: Number((raw.timeperiod as Raw).yearmin) || undefined,
        yearmax: Number((raw.timeperiod as Raw).yearmax) || undefined,
      }
    : undefined
  return {
    documentId: s(raw.documentId),
    legacyId: sOpt(raw.legacyId),
    slug: s(raw.slug),
    title: s(raw.title),
    status: s(raw.status) || 'published',
    date: s(raw.date),
    external: raw.external === true,
    categories: stringArray(raw.categories),
    tags: stringArray(raw.tags),
    description: s(raw.description),
    sources: Array.isArray(raw.sources)
      ? (raw.sources as Raw[])
          .filter(src => src && s(src.title))
          .map(src => ({ title: s(src.title), url: sOpt(src.url) }))
      : [],
    unit: sOpt(raw.unit),
    timeperiod,
    notes: stringArray(raw.notes),
    variables: Array.isArray(raw.variables)
      ? (raw.variables as Raw[])
          .filter(v => v && s(v.name))
          .map(v => ({ name: s(v.name), type: sOpt(v.type), definition: sOpt(v.definition) }))
      : [],
    funding: sOpt(raw.funding),
    citation: sOpt(raw.citation),
    datafile: normalizeMedia(raw.datafile, origin),
    relatedApps: linkedRefs(raw.apps),
    relatedArticles: linkedRefs(raw.articles),
  }
}

export function normalizeApp(raw: Raw, origin: string): App {
  return {
    documentId: s(raw.documentId),
    legacyId: sOpt(raw.legacyId),
    slug: s(raw.slug),
    title: s(raw.title),
    status: s(raw.status) || 'published',
    date: s(raw.date),
    external: raw.external === true,
    categories: stringArray(raw.categories),
    tags: stringArray(raw.tags),
    contributors: normalizeAuthors(raw.contributors),
    description: s(raw.description),
    url: sOpt(raw.url),
    funding: sOpt(raw.funding),
    citation: sOpt(raw.citation),
    image: normalizeMedia(raw.image, origin),
    relatedDatasets: linkedRefs(raw.datasets),
    relatedArticles: linkedRefs(raw.articles),
  }
}

/** Projects use PascalCase fields in the CMS (Title, SubTitle, Body, Authors). */
export function normalizeProject(raw: Raw): Project {
  return {
    documentId: s(raw.documentId),
    slug: s(raw.slug),
    title: s(raw.Title) || s(raw.title),
    subtitle: sOpt(raw.SubTitle) ?? sOpt(raw.subtitle),
    body: s(raw.Body) || s(raw.body),
    description: sOpt(raw.description),
    authors: stringArray(raw.Authors ?? raw.authors),
    date: sOpt(raw.date),
    category: sOpt(raw.category),
    bullets: stringArray(raw.bullets),
    order: typeof raw.order === 'number' ? raw.order : undefined,
    email: sOpt(raw.email),
    headerBgRaw: sOpt(raw.headerBg),
    iconRaw: sOpt(raw.icon),
  }
}

/** Centers use PascalCase fields in the CMS (Title, Author, Description). */
export function normalizeCenter(raw: Raw): Center {
  return {
    documentId: s(raw.documentId),
    title: s(raw.Title) || s(raw.title),
    author: sOpt(raw.Author) ?? sOpt(raw.author),
    description: s(raw.Description) || s(raw.description),
  }
}

export function normalizePage(raw: Raw): Page {
  return {
    documentId: s(raw.documentId),
    slug: s(raw.slug),
    title: s(raw.title),
    summary: sOpt(raw.summary),
    body: s(raw.body),
  }
}
