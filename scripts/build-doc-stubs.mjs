/**
 * Document search stubs — makes words INSIDE published files findable.
 *
 * For every supported attachment in the CMS (article main/extra files,
 * dataset data files: pdf/docx/pptx/xlsx), extract its text with
 * @icjia/pdf-search-index and write a minimal HTML stub into the static
 * output. Pagefind then indexes the stubs like any page, so document
 * matches load on demand from Pagefind's chunked index — no multi-MB
 * JSON shipped to browsers. Stub metadata (kind/parentUrl/parentTitle/
 * fileUrl/fileType) lets the search page group file hits under their
 * parent item.
 *
 * Extraction is cached in node_modules/.cache/copperhead-docs (persisted
 * by Netlify's dependency cache), so only new/changed files re-download.
 *
 * Run via `pnpm generate:full` (Netlify). DOC_LIMIT=n processes only the
 * first n documents (local smoke tests).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDocumentText } from '@icjia/pdf-search-index'
import { hub } from '../hub.config.mjs'

const SUPPORTED = new Set(['.pdf', '.docx', '.pptx', '.xlsx'])
const MAX_CHARS = 40_000
const LIMIT = Number(process.env.DOC_LIMIT) || Infinity

const outDir = fileURLToPath(new URL(`../.output/public/${hub.site.basePath}/attachments/`, import.meta.url))
const cacheDir = fileURLToPath(new URL('../node_modules/.cache/copperhead-docs/', import.meta.url))
mkdirSync(outDir, { recursive: true })
mkdirSync(cacheDir, { recursive: true })

function sha1(value) {
  return createHash('sha1').update(value).digest('hex')
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return await res.json()
}

async function fetchAll(collection, query) {
  const rows = []
  let page = 1
  for (;;) {
    const json = await fetchJson(
      `${hub.cms.origin}/api/${collection}?${query}&pagination[pageSize]=100&pagination[page]=${page}`,
    )
    rows.push(...json.data)
    if (page >= json.meta.pagination.pageCount) break
    page++
  }
  return rows
}

function mediaUrl(media) {
  const url = media?.url
  if (!url) return null
  return url.startsWith('/') ? `${hub.cms.origin}${url}` : url
}

/** Inventory: every supported attachment with its parent page. */
async function collectDocuments() {
  const documents = []
  const articles = await fetchAll(
    'articles',
    'fields[0]=slug&fields[1]=title&populate[0]=mainfile&populate[1]=extrafile',
  )
  for (const article of articles) {
    for (const media of [article.mainfile, article.extrafile]) {
      const url = mediaUrl(media)
      if (url) {
        documents.push({
          url,
          name: media.name || 'attachment',
          parentUrl: `/articles/${article.slug}/`,
          parentTitle: article.title,
        })
      }
    }
  }
  const datasets = await fetchAll('datasets', 'fields[0]=slug&fields[1]=title&populate[0]=datafile')
  for (const dataset of datasets) {
    const url = mediaUrl(dataset.datafile)
    if (url) {
      documents.push({
        url,
        name: dataset.datafile.name || 'data file',
        parentUrl: `/datasets/${dataset.slug}/`,
        parentTitle: dataset.title,
      })
    }
  }
  return documents.filter(doc =>
    SUPPORTED.has((doc.url.match(/\.[a-z0-9]+$/i)?.[0] ?? '').toLowerCase()),
  )
}

async function extractCached(url) {
  const cacheFile = join(cacheDir, `${sha1(url)}.txt`)
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8')
  const text = await extractDocumentText(url)
  const trimmed = (text ?? '').slice(0, MAX_CHARS)
  writeFileSync(cacheFile, trimmed)
  return trimmed
}

const documents = (await collectDocuments()).slice(0, LIMIT)
console.log(`⚙ document stubs: ${documents.length} supported attachments${Number.isFinite(LIMIT) ? ` (DOC_LIMIT=${LIMIT})` : ''}`)

let written = 0
const failures = []
for (const doc of documents) {
  try {
    const text = await extractCached(doc.url)
    if (!text.trim()) {
      failures.push(`${doc.url} (no extractable text)`)
      continue
    }
    const ext = (doc.url.match(/\.[a-z0-9]+$/i)?.[0] ?? '').replace('.', '').toUpperCase()
    const stub = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(doc.parentTitle)} — ${esc(doc.name)}</title>
<meta name="robots" content="noindex">
</head><body>
<h1>${esc(doc.parentTitle)} — ${esc(doc.name)}</h1>
<span data-pagefind-meta="kind[data-v]" data-v="attachment"></span>
<span data-pagefind-meta="parentUrl[data-v]" data-v="${esc(doc.parentUrl)}"></span>
<span data-pagefind-meta="parentTitle[data-v]" data-v="${esc(doc.parentTitle)}"></span>
<span data-pagefind-meta="fileUrl[data-v]" data-v="${esc(doc.url)}"></span>
<span data-pagefind-meta="fileType[data-v]" data-v="${esc(ext)}"></span>
<main>${esc(text)}</main>
</body></html>\n`
    writeFileSync(join(outDir, `${sha1(doc.url)}.html`), stub)
    written++
  }
  catch (error) {
    failures.push(`${doc.url} (${error.message})`)
  }
}

console.log(`✓ document stubs: ${written} written, ${failures.length} skipped`)
// No silent caps: name what was dropped so incomplete coverage is visible.
for (const failure of failures) console.warn(`  ⚠ skipped: ${failure}`)
