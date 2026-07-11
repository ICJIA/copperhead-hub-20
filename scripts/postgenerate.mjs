/**
 * Restructure the static output for subpath hosting.
 *
 * `nuxt generate` with `app.baseURL = '/researchhub/'` emits pages at the
 * output root while every URL inside them points at /researchhub/... — the
 * artifact is built to be SERVED from that subpath. This script makes the
 * published directory match: everything moves under researchhub/, except
 *   - robots.txt        (domain-root file)
 *   - 404.html          (copied to the root — Netlify reads it there)
 *
 * Runs as part of `pnpm generate`. Idempotent.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDir = fileURLToPath(new URL('../.output/public/', import.meta.url))
const target = join(publicDir, 'researchhub')

if (existsSync(join(target, 'index.html'))) {
  console.log('✓ postgenerate: output already restructured, nothing to do')
  process.exit(0)
}

const KEEP_AT_ROOT = new Set(['robots.txt', 'researchhub'])

mkdirSync(target, { recursive: true })

let moved = 0
for (const entry of readdirSync(publicDir)) {
  if (KEEP_AT_ROOT.has(entry)) continue
  renameSync(join(publicDir, entry), join(target, entry))
  moved++
}

// Netlify serves the custom 404 from the publish root; the page's absolute
// asset URLs (/researchhub/_nuxt/...) still resolve after the move.
copyFileSync(join(target, '404.html'), join(publicDir, '404.html'))

console.log(`✓ postgenerate: moved ${moved} entries under /researchhub/, root 404.html in place`)
