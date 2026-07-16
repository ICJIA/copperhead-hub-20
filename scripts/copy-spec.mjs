#!/usr/bin/env node
/**
 * Publish the manager-facing spec so it can be downloaded from the app.
 *
 * Copies docs/ICJIA-Hub-20-rewrite-copperhead.{md,docx} into the built
 * site under /<basePath>/spec/. The /spec route renders the .md inline;
 * these copies back its "Download .md / .docx" buttons. Run as part of
 * `generate` / `generate:full`, so the downloads are always the versions
 * that shipped with the build.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { hub } from '../hub.config.mjs'

const outDir = fileURLToPath(new URL(`../.output/public/${hub.site.basePath}/spec/`, import.meta.url))
mkdirSync(outDir, { recursive: true })

const files = [
  'ICJIA-Hub-20-rewrite-copperhead.md',
  'ICJIA-Hub-20-rewrite-copperhead.docx',
]

let copied = 0
const missing = []
for (const file of files) {
  const src = fileURLToPath(new URL(`../docs/${file}`, import.meta.url))
  if (existsSync(src)) {
    copyFileSync(src, `${outDir}${file}`)
    copied++
  }
  else {
    missing.push(file)
  }
}

console.log(`✓ spec: ${copied} file(s) published to /${hub.site.basePath}/spec/`)
for (const file of missing) console.warn(`  ⚠ spec source missing: docs/${file}`)
