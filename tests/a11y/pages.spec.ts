import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Real, fully rendered routes — never placeholder URLs. The prior codebase
// audited literal "[slug]" paths, i.e., its own 404 page (plan, Appendix A, Q4).
// As routes land in later phases, add them (or their fixture slugs) here.
const ROUTES = [
  { name: 'home', path: '/researchhub/' },
  // The prerendered 404 page is served by Netlify for unknown paths.
  { name: '404 page', path: '/researchhub/404.html' },
]

for (const route of ROUTES) {
  test(`${route.name} (${route.path}) has no WCAG 2.1 A/AA violations`, async ({ page }) => {
    await page.goto(route.path)
    // The 404 route is an SPA-shell fallback — its content (and <title>)
    // renders client-side. Audit the page people actually see, not the shell.
    await page.waitForSelector('h1')

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
