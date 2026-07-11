/**
 * Typed content service — every CMS read goes through here.
 *
 * - Content is fetched at build time (prerender) and embedded in payloads;
 *   the deployed static site makes no CMS requests.
 * - Reads are public; NUXT_STRAPI_TOKEN is optional and only attached
 *   server-side when configured (never shipped to the browser).
 * - List fetches paginate to completion — no silent result caps.
 * - Missing slugs throw a real 404 (`createError`), never a generic Error.
 *
 * Context rule: `useRuntimeConfig()` is only valid synchronously inside a
 * Nuxt context, so every exported function captures config ONCE at entry
 * (before any await) and threads it through — calling it after an await
 * throws "composable called outside of a plugin" during prerender.
 */
import { hub } from '../../hub.config.mjs'
import type { App, Article, ArticleSummary, Center, Dataset, Page, Project } from '../types/content'

const PAGE_SIZE = hub.cms.pageSize

interface StrapiListResponse {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: Record<string, any>[]
  meta: { pagination: { page: number, pageCount: number, total: number } }
}

interface CmsConfig {
  origin: string
  headers: Record<string, string>
}

/** Must be called synchronously at the top of each exported function. */
function cmsConfig(): CmsConfig {
  const config = useRuntimeConfig()
  // Server-only key: empty string in the browser, so no header is sent there.
  const token = config.strapiToken
  return {
    origin: config.public.strapiUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }
}

async function fetchPage(cms: CmsConfig, path: string, query: Record<string, string | number>): Promise<StrapiListResponse> {
  return await $fetch<StrapiListResponse>(`${cms.origin}/api/${path}`, {
    query,
    headers: cms.headers,
    retry: hub.cms.retries,
    retryDelay: hub.cms.retryDelayMs,
  })
}

/** Fetch every page of a collection — never a silently truncated subset. */
async function fetchAll(cms: CmsConfig, path: string, query: Record<string, string | number> = {}) {
  const first = await fetchPage(cms, path, {
    ...query,
    'pagination[page]': 1,
    'pagination[pageSize]': PAGE_SIZE,
  })
  const rows = [...first.data]
  const { pageCount } = first.meta.pagination
  for (let page = 2; page <= pageCount; page++) {
    const next = await fetchPage(cms, path, {
      ...query,
      'pagination[page]': page,
      'pagination[pageSize]': PAGE_SIZE,
    })
    rows.push(...next.data)
  }
  return rows
}

async function fetchBySlug(cms: CmsConfig, path: string, slug: string) {
  const res = await fetchPage(cms, path, {
    'filters[slug][$eq]': slug,
    'populate': '*',
    'pagination[pageSize]': 1,
  })
  const row = res.data[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: `Not found: ${path}/${slug}` })
  }
  return row
}

export async function fetchAllArticles(): Promise<Article[]> {
  const cms = cmsConfig()
  const rows = await fetchAll(cms, 'articles', { populate: '*', sort: 'date:desc' })
  return rows.map(row => normalizeArticle(row, cms.origin))
}

/** Slim rows for the listing page — scalars + thumbnail only, all pages. */
export async function fetchArticleSummaries(): Promise<ArticleSummary[]> {
  const cms = cmsConfig()
  const fields = ['title', 'slug', 'date', 'abstract', 'type', 'categories', 'tags', 'external', 'status']
  const query: Record<string, string | number> = { 'sort': 'date:desc', 'populate[0]': 'thumbnail' }
  fields.forEach((field, i) => {
    query[`fields[${i}]`] = field
  })
  const rows = await fetchAll(cms, 'articles', query)
  return rows.map(row => normalizeArticleSummary(row, cms.origin))
}

export async function fetchLatestArticles(count: number): Promise<Article[]> {
  const cms = cmsConfig()
  const res = await fetchPage(cms, 'articles', {
    'populate': '*',
    'sort': 'date:desc',
    'pagination[pageSize]': count,
  })
  return res.data.map(row => normalizeArticle(row, cms.origin))
}

export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const cms = cmsConfig()
  return normalizeArticle(await fetchBySlug(cms, 'articles', slug), cms.origin)
}

export async function fetchAllDatasets(): Promise<Dataset[]> {
  const cms = cmsConfig()
  const rows = await fetchAll(cms, 'datasets', { populate: '*', sort: 'date:desc' })
  return rows.map(row => normalizeDataset(row, cms.origin))
}

export async function fetchDatasetBySlug(slug: string): Promise<Dataset> {
  const cms = cmsConfig()
  return normalizeDataset(await fetchBySlug(cms, 'datasets', slug), cms.origin)
}

export async function fetchAllApps(): Promise<App[]> {
  const cms = cmsConfig()
  const rows = await fetchAll(cms, 'apps', { populate: '*', sort: 'date:desc' })
  return rows.map(row => normalizeApp(row, cms.origin))
}

export async function fetchAppBySlug(slug: string): Promise<App> {
  const cms = cmsConfig()
  return normalizeApp(await fetchBySlug(cms, 'apps', slug), cms.origin)
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  const cms = cmsConfig()
  return normalizeProject(await fetchBySlug(cms, 'projects', slug))
}

export async function fetchAllProjects(): Promise<Project[]> {
  const cms = cmsConfig()
  const rows = await fetchAll(cms, 'projects', { populate: '*', sort: 'order:asc' })
  return rows.map(row => normalizeProject(row))
}

export async function fetchAllCenters(): Promise<Center[]> {
  const cms = cmsConfig()
  const rows = await fetchAll(cms, 'centers', { sort: 'Title:asc' })
  return rows.map(row => normalizeCenter(row))
}

export async function fetchPageBySlug(slug: string): Promise<Page> {
  const cms = cmsConfig()
  return normalizePage(await fetchBySlug(cms, 'pages', slug))
}
