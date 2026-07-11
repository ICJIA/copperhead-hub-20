/**
 * URL-parity check — the launch gate (plan §9 Phase 4, success criterion 1).
 *
 * Verifies that every URL in the archived Hub 1.0 snapshot
 * (docs/parity/hub-sitemap-2026-07-11.txt) exists in the generated output
 * as a real page (index.html containing an <h1>) or is covered by a
 * redirect in public/_redirects.
 *
 * Advisory by default (reports, exit 0) because content added to Hub 1.0
 * after the March migration won't exist in Strapi 5 until the cutover
 * incremental sync runs. PARITY_STRICT=1 makes misses fatal — that is the
 * launch-day mode.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const publicDir = join(root, '.output/public')

const snapshot = readFileSync(join(root, 'docs/parity/hub-sitemap-2026-07-11.txt'), 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)

const redirects = new Set(
  readFileSync(join(root, 'public/_redirects'), 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split(/\s+/)[0]),
)

const misses = []
for (const url of snapshot) {
  const path = new URL(url).pathname
  if (redirects.has(path)) continue
  const file = join(publicDir, decodeURIComponent(path), 'index.html')
  if (!existsSync(file)) {
    misses.push(`${path} (no page generated)`)
    continue
  }
  const html = readFileSync(file, 'utf8')
  if (!html.includes('<h1')) misses.push(`${path} (page has no <h1> content)`)
}

const passed = snapshot.length - misses.length
console.log(`URL parity: ${passed}/${snapshot.length} archived Hub 1.0 URLs resolve`)
for (const miss of misses) console.log(`  ✗ ${miss}`)

if (misses.length && process.env.PARITY_STRICT === '1') {
  console.error(`\nPARITY_STRICT: ${misses.length} archived URLs unresolved — failing.`)
  process.exit(1)
}
if (misses.length) {
  console.log(`\n(advisory mode — ${misses.length} unresolved; expected before the cutover content sync. PARITY_STRICT=1 enforces.)`)
}
