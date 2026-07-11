/**
 * Refresh tests/fixtures/*.json from the live Strapi 5 API.
 *
 * Unit tests never touch the network — they run against these committed
 * snapshots. Re-run this script deliberately (and review the diff) when the
 * CMS schema changes:  node scripts/update-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.NUXT_PUBLIC_STRAPI_URL || 'https://v2.hub.icjia-api.cloud'
const outDir = fileURLToPath(new URL('../tests/fixtures/', import.meta.url))
mkdirSync(outDir, { recursive: true })

async function get(path, query) {
  const url = new URL(`${BASE}/api/${path}`)
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return await res.json()
}

/** Trim huge text fields so fixtures stay reviewable in diffs. */
function trim(row) {
  const copy = { ...row }
  for (const key of ['markdown', 'Body', 'body', 'description', 'Description', 'abstract']) {
    if (typeof copy[key] === 'string' && copy[key].length > 600) {
      copy[key] = copy[key].slice(0, 600)
    }
  }
  return copy
}

const targets = [
  ['articles', { 'populate': '*', 'sort': 'date:desc', 'pagination[pageSize]': 2 }],
  ['datasets', { 'populate': '*', 'pagination[pageSize]': 1 }],
  ['apps', { 'populate': '*', 'pagination[pageSize]': 1 }],
  ['projects', { 'populate': '*', 'pagination[pageSize]': 1 }],
  ['centers', { 'pagination[pageSize]': 1 }],
  ['pages', { 'pagination[pageSize]': 1 }],
]

for (const [path, query] of targets) {
  const res = await get(path, query)
  const fixture = { data: res.data.map(trim), meta: res.meta }
  writeFileSync(join(outDir, `${path}.json`), `${JSON.stringify(fixture, null, 2)}\n`)
  console.log(`✓ tests/fixtures/${path}.json (${res.data.length} rows)`)
}
