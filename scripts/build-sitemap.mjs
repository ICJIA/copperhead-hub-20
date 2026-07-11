/**
 * Emit /researchhub/sitemap.xml from the generated output — every
 * prerendered public page, none of the attachment stubs or fallbacks.
 * The main site's sitemap index references this file at launch.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hub } from '../hub.config.mjs'

const siteDir = fileURLToPath(new URL(`../.output/public/${hub.site.basePath}/`, import.meta.url))
const EXCLUDE = new Set(['attachments', 'pagefind', '_nuxt'])

function collectPages(dir) {
  const pages = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!EXCLUDE.has(entry)) pages.push(...collectPages(full))
    }
    else if (entry === 'index.html') {
      pages.push(relative(siteDir, dir))
    }
  }
  return pages
}

const paths = collectPages(siteDir)
  .map(p => (p === '' ? '' : `${p.replace(/\\/g, '/')}/`))
  .sort()

const today = new Date().toISOString().slice(0, 10)
const urls = paths
  .map(path =>
    `  <url><loc>${hub.site.productionOrigin}${hub.site.baseURL}${path}</loc><lastmod>${today}</lastmod></url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

writeFileSync(join(siteDir, 'sitemap.xml'), xml)
console.log(`✓ sitemap: ${paths.length} URLs → ${hub.site.baseURL}sitemap.xml`)
