#!/usr/bin/env node
/**
 * Publish the manager-facing docs so they can be downloaded from the app.
 *
 * Copies docs/ICJIA-Hub-20-rewrite-copperhead.{md,docx} into /<basePath>/spec/
 * and ROADMAP.md into /<basePath>/roadmap/. The /spec and /roadmap routes
 * render the .md inline; these copies back their "Download" buttons. Run as
 * part of `generate` / `generate:full`, so the downloads are always the
 * versions that shipped with the build.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hub } from '../hub.config.mjs'

// [repo-relative source file, destination subdir under the built site]
const publish = [
  ['docs/ICJIA-Hub-20-rewrite-copperhead.md', 'spec'],
  ['docs/ICJIA-Hub-20-rewrite-copperhead.docx', 'spec'],
  ['ROADMAP.md', 'roadmap'],
]

let copied = 0
const missing = []
for (const [rel, subdir] of publish) {
  const src = fileURLToPath(new URL(`../${rel}`, import.meta.url))
  if (!existsSync(src)) {
    missing.push(rel)
    continue
  }
  const outDir = fileURLToPath(new URL(`../.output/public/${hub.site.basePath}/${subdir}/`, import.meta.url))
  mkdirSync(outDir, { recursive: true })
  copyFileSync(src, `${outDir}${rel.split('/').pop()}`)
  copied++
}

console.log(`✓ manager docs: ${copied} file(s) published (spec + roadmap)`)
for (const rel of missing) console.warn(`  ⚠ source missing: ${rel}`)
