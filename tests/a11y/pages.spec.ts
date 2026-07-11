import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hub } from '../../hub.config.mjs'
import articlesFixture from '../fixtures/articles.json' with { type: 'json' }
import datasetsFixture from '../fixtures/datasets.json' with { type: 'json' }
import appsFixture from '../fixtures/apps.json' with { type: 'json' }

// Real, fully rendered routes — never placeholder URLs. The prior codebase
// audited literal "[slug]" paths, i.e., its own 404 page (plan, Appendix A, Q4).
// Detail pages use real slugs from the committed fixtures.
const ARTICLE_SLUG = articlesFixture.data[0]!.slug
const DATASET_SLUG = datasetsFixture.data[0]!.slug
const APP_SLUG = appsFixture.data[0]!.slug

const ROUTES = [
  { name: 'home', path: hub.site.baseURL },
  { name: 'articles listing', path: `${hub.site.baseURL}articles/` },
  { name: 'article detail', path: `${hub.site.baseURL}articles/${ARTICLE_SLUG}/` },
  { name: 'datasets listing', path: `${hub.site.baseURL}datasets/` },
  { name: 'dataset detail', path: `${hub.site.baseURL}datasets/${DATASET_SLUG}/` },
  { name: 'apps listing', path: `${hub.site.baseURL}apps/` },
  { name: 'app detail', path: `${hub.site.baseURL}apps/${APP_SLUG}/` },
  // The prerendered 404 page is served by Netlify for unknown paths.
  { name: '404 page', path: `${hub.site.baseURL}404.html` },
]

// The site defaults to light regardless of OS preference; dark mode is a
// persisted user choice. The dark project seeds that choice so the audit
// exercises the real dark theme, and asserts it actually engaged.
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name.includes('dark')) {
    await page.addInitScript(() => localStorage.setItem('nuxt-color-mode', 'dark'))
  }
})

for (const route of ROUTES) {
  test(`${route.name} (${route.path}) has no WCAG 2.1 A/AA violations`, async ({ page }, testInfo) => {
    await page.goto(route.path)
    // The 404 route is an SPA-shell fallback — its content (and <title>)
    // renders client-side. Audit the page people actually see, not the shell.
    await page.waitForSelector('h1')

    if (testInfo.project.name.includes('dark')) {
      await expect(page.locator('html')).toHaveClass(/dark/)
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(
      results.violations,
      results.violations
        .map(v => `${v.id}: ${v.description} (${v.nodes.length} nodes)`)
        .join('\n'),
    ).toEqual([])
  })
}
