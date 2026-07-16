#!/usr/bin/env node
/**
 * Apply the nine footnote content fixes (docs/footnote-fixes/*.md) to
 * Strapi 5 — safely, verifiably, one field per article.
 *
 * Dry run (default):   node scripts/apply-footnote-fixes.mjs
 * Apply for real:      node scripts/apply-footnote-fixes.mjs --apply
 *
 * Requires env (e.g. via `set -a && source .env`):
 *   NUXT_PUBLIC_STRAPI_URL    Strapi origin
 *   NUXT_STRAPI_WRITE_TOKEN   token with articles update+publish
 *                             (falls back to NUXT_STRAPI_TOKEN, which is
 *                             read-only in this project and will 403)
 *
 * Safety model, per article:
 *   1. Skip if the published markdown already equals the fix (APPLIED).
 *   2. Skip if updatedAt is after 2026-07-12 — the fixes were generated
 *      from a 2026-07-11 snapshot; later edits mean apply by hand from
 *      docs/footnote-content-fixes.md (EDITED-SINCE).
 *   3. Skip if the draft diverges from the published version — publishing
 *      would push someone's unfinished draft live (DRAFT-DIVERGES).
 *   4. Back up the current published markdown before writing.
 *   5. PUT only the `markdown` field with ?status=published, then re-GET
 *      and verify the stored value matches the fix byte-for-byte.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const FIXES_DIR = 'docs/footnote-fixes'
const SNAPSHOT_CUTOFF = '2026-07-12'
const APPLY = process.argv.includes('--apply')

const origin = process.env.NUXT_PUBLIC_STRAPI_URL
const token = process.env.NUXT_STRAPI_WRITE_TOKEN || process.env.NUXT_STRAPI_TOKEN
if (!origin || !token) {
  console.error('Missing NUXT_PUBLIC_STRAPI_URL / NUXT_STRAPI_WRITE_TOKEN in env.')
  process.exit(1)
}
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

async function getArticle(slug, status) {
  const url = new URL(`${origin}/api/articles`)
  url.searchParams.set('filters[slug][$eq]', slug)
  url.searchParams.set('status', status)
  ;['slug', 'title', 'updatedAt', 'markdown'].forEach((f, i) =>
    url.searchParams.set(`fields[${i}]`, f))
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GET ${slug} (${status}): HTTP ${res.status}`)
  return (await res.json()).data?.[0] ?? null
}

const backupDir = path.join(FIXES_DIR, `backups-${new Date().toISOString().slice(0, 10)}`)
const files = (await readdir(FIXES_DIR)).filter(f => f.endsWith('.md') && f !== 'README.md')
const results = []

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  const short = slug.slice(0, 52)
  const fixed = await readFile(path.join(FIXES_DIR, file), 'utf8')

  const published = await getArticle(slug, 'published')
  if (!published) {
    results.push(['MISSING', short])
    continue
  }
  if ((published.markdown ?? '').trim() === fixed.trim()) {
    results.push(['APPLIED', short])
    continue
  }
  if (published.updatedAt > SNAPSHOT_CUTOFF) {
    results.push(['EDITED-SINCE → apply by hand', short])
    continue
  }
  let draft = null
  try {
    draft = await getArticle(slug, 'draft')
  }
  catch { /* draft read not permitted — fall through to updatedAt guard */ }
  if (draft && (draft.markdown ?? '') !== (published.markdown ?? '')) {
    results.push(['DRAFT-DIVERGES → apply by hand', short])
    continue
  }

  if (!APPLY) {
    results.push(['WOULD APPLY (dry run)', short])
    continue
  }

  await mkdir(backupDir, { recursive: true })
  await writeFile(path.join(backupDir, file), published.markdown ?? '', 'utf8')

  const res = await fetch(`${origin}/api/articles/${published.documentId}?status=published`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { markdown: fixed } }),
  })
  if (!res.ok) {
    results.push([`PUT FAILED HTTP ${res.status}`, short])
    continue
  }
  const after = await getArticle(slug, 'published')
  const verified = (after?.markdown ?? '').trim() === fixed.trim()
  results.push([verified ? 'APPLIED ✓ (verified)' : 'VERIFY FAILED — inspect!', short])
}

console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} — ${results.length} articles`)
for (const [status, slug] of results) console.log(`  ${status.padEnd(30)} ${slug}`)
if (APPLY) console.log(`\nBackups of prior published markdown: ${backupDir}/`)

const bad = results.filter(([s]) => s.includes('FAILED') || s.includes('MISSING'))
process.exit(bad.length ? 1 : 0)
