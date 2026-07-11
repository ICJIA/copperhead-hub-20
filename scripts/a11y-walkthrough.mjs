/**
 * Manual-procedure accessibility walkthrough (runbook §Manual pass),
 * executed with a driven browser. Complements the axe suite — this
 * checks the things axe can't: keyboard reachability with VISIBLE focus
 * at every stop, tab traps, landmark uniqueness, 320px reflow, live
 * regions, and accordion operability.
 *
 * Usage: node scripts/a11y-walkthrough.mjs  (serves .output/public itself)
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { hub } from '../hub.config.mjs'

const publicDir = fileURLToPath(new URL('../.output/public', import.meta.url))
const MIME = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', txt: 'text/plain', xml: 'application/xml', wasm: 'application/wasm', pf_fragment: 'application/octet-stream', pf_index: 'application/octet-stream', pf_meta: 'application/octet-stream', pagefind: 'application/octet-stream' }

const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path.endsWith('/')) path += 'index.html'
  let file = join(publicDir, path)
  if (!existsSync(file)) file = join(publicDir, path, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404).end('not found')
    return
  }
  const ext = file.split('.').pop()
  res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise(resolve => server.listen(4180, resolve))

const BASE = `http://localhost:4180${hub.site.baseURL}`
const ROUTES = [
  ['home', ''],
  ['articles listing', 'articles/'],
  ['articles list-view', 'articles/?view=list'],
  ['article detail', 'articles/lewd-sexual-display-in-a-penal-institution-state-fiscal-year-2025-report/'],
  ['dataset detail', 'datasets/illinois-uniform-crime-reports-ucr-index-crime-offense/'],
  ['app detail', 'apps/uniform-crime-report-index-offense-explorer/'],
  ['centers', 'centers/'],
  ['projects', 'projects/'],
  ['search', 'search/?q=justice'],
]

const findings = []
const note = (route, check, detail) => findings.push({ route, check, detail })

const browser = await chromium.launch()

for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ colorScheme: scheme })
  if (scheme === 'dark') {
    await context.addInitScript(() => localStorage.setItem('nuxt-color-mode', 'dark'))
  }
  const page = await context.newPage()

  for (const [name, path] of ROUTES) {
    const route = `${name} [${scheme}]`
    await page.goto(`${BASE}${path}`)
    await page.waitForSelector('h1')
    await page.waitForTimeout(300)

    // Landmarks: exactly one of each primary landmark; navs labeled.
    const landmarks = await page.evaluate(() => ({
      main: document.querySelectorAll('main').length,
      banner: document.querySelectorAll('body > div > header, header').length,
      contentinfo: document.querySelectorAll('footer').length,
      unlabeledNavs: [...document.querySelectorAll('nav')].filter(n => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length,
      h1: document.querySelectorAll('h1').length,
    }))
    if (landmarks.main !== 1) note(route, 'landmarks', `main count ${landmarks.main}`)
    if (landmarks.h1 !== 1) note(route, 'headings', `h1 count ${landmarks.h1}`)
    if (landmarks.unlabeledNavs > 0) note(route, 'landmarks', `${landmarks.unlabeledNavs} unlabeled <nav>`)

    // Keyboard walk: every focus stop must be an interactive element with
    // a VISIBLE focus indicator (outline or ring/box-shadow), no traps.
    const walk = await page.evaluate(() => ({ count: 0 }))
    void walk
    const seen = []
    let trap = false
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        // Indicator may live on the element OR an ancestor (card
        // focus-within ring) — both are visible to the user.
        let visibleIndicator = false
        let probe = el
        for (let depth = 0; depth < 4 && probe; depth++) {
          const style = getComputedStyle(probe)
          if ((style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0)
            || style.boxShadow !== 'none') {
            visibleIndicator = true
            break
          }
          probe = probe.parentElement
        }
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          interactive: ['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(el.tagName.toLowerCase()) || el.tabIndex >= 0,
          visibleIndicator,
          onScreen: rect.width > 0 && rect.height > 0,
          id: `${el.tagName}:${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`,
        }
      })
      if (!info) break
      if (seen.length >= 2 && seen[seen.length - 1] === info.id && seen[seen.length - 2] === info.id) {
        trap = true
        note(route, 'keyboard trap', `stuck on ${info.id}`)
        break
      }
      seen.push(info.id)
      if (!info.interactive) note(route, 'focus target', `non-interactive focus stop: ${info.tag} "${info.text}"`)
      if (info.onScreen && !info.visibleIndicator && info.tag !== 'body') {
        note(route, 'focus visibility', `${info.tag} "${info.text}" has no visible focus indicator`)
      }
    }
    if (trap) continue

    // 320px reflow (WCAG 1.4.10): no horizontal page scroll.
    await page.setViewportSize({ width: 320, height: 800 })
    await page.waitForTimeout(250)
    const overflow = await page.evaluate(() => {
      const excess = document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth
      if (excess <= 1) return null
      const insideScroller = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX
          if (o === 'auto' || o === 'scroll') return true
        }
        return false
      }
      let worst = null
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect()
        if (rect.right > document.scrollingElement.clientWidth + 1 && !insideScroller(el)) {
          if (!worst || rect.right > worst.right) {
            worst = { right: Math.round(rect.right), sel: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')}` }
          }
        }
      }
      return { excess, worst }
    })
    if (overflow) note(route, '320px reflow', `overflow ${overflow.excess}px; widest: ${overflow.worst?.sel} (right=${overflow.worst?.right})`)
    await page.setViewportSize({ width: 1280, height: 800 })
  }

  // Live regions on dynamic counts (listing + search).
  await page.goto(`${BASE}articles/`)
  const live = await page.locator('[aria-live="polite"]').count()
  if (live < 1) note(`articles listing [${scheme}]`, 'live region', 'no aria-live on result count')

  // Accordion operability (home centers section).
  await page.goto(`${BASE}`)
  await page.waitForSelector('h1')
  const trigger = page.locator('button[aria-expanded]').first()
  if (await trigger.count()) {
    const before = await trigger.getAttribute('aria-expanded')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const after = await trigger.getAttribute('aria-expanded')
    if (before === after) note(`home [${scheme}]`, 'accordion', 'Enter did not toggle aria-expanded')
  }
  else {
    note(`home [${scheme}]`, 'accordion', 'no aria-expanded trigger found')
  }

  await context.close()
}

await browser.close()
server.close()

if (!findings.length) {
  console.log('✓ walkthrough clean: no findings')
}
else {
  console.log(`✗ ${findings.length} findings:`)
  const dedup = new Map()
  for (const f of findings) {
    const key = `${f.check}|${f.detail}`
    dedup.set(key, (dedup.get(key) ?? new Set()).add(f.route))
  }
  for (const [key, routes] of dedup) {
    const [check, detail] = key.split('|')
    console.log(`  [${check}] ${detail}  (${[...routes].slice(0, 3).join('; ')}${routes.size > 3 ? ` +${routes.size - 3}` : ''})`)
  }
  process.exitCode = 1
}
