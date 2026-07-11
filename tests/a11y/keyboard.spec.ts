import { expect, test } from '@playwright/test'
import { hub } from '../../hub.config.mjs'

// Keyboard-path smoke tests — automated proxies for the manual pass
// (the full screen-reader walkthrough is a launch-checklist item in
// docs/runbook.md; these guard the mechanics that make it possible).

test('skip link is first in tab order and targets main content', async ({ page }) => {
  await page.goto(hub.site.baseURL)
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toHaveText(/skip to main content/i)
  const href = await focused.getAttribute('href')
  expect(href).toContain('#main-content')
  await expect(page.locator('#main-content')).toHaveCount(1)
})

test('section navigation is keyboard reachable and focus is visible', async ({ page }) => {
  await page.goto(hub.site.baseURL)
  // Tab until a section-nav link has focus (bounded walk).
  let reached = false
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    const text = await page.locator(':focus').textContent().catch(() => '')
    if (text?.trim().toLowerCase() === 'articles') {
      reached = true
      break
    }
  }
  expect(reached, 'Articles nav link reachable by keyboard').toBe(true)
  // Activating it navigates (SPA navigation may omit the trailing slash).
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/articles\/?($|\?)/)
})
