import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { hub } from '../../hub.config.mjs'

// The annotation layer against a MOCKED Supabase (route interception) — the
// static-output test server has no network guarantees. One stateful row per
// test: POST stores it, later GETs return it, PATCH merges into it.
const REST = '**/rest/v1/copperhead_annotations*'

test.describe('manager annotations', () => {
  test.beforeEach(async ({ page }) => {
    let row: Record<string, unknown> | null = null
    await page.route(REST, async (route) => {
      const req = route.request()
      const method = req.method()
      if (method === 'GET') {
        await route.fulfill({ json: row ? [row] : [] })
      }
      else if (method === 'POST') {
        row = {
          ...JSON.parse(req.postData() ?? '{}'),
          id: '11111111-1111-4111-8111-111111111111',
          created_at: '2026-07-21T12:00:00Z',
        }
        await route.fulfill({ status: 201, json: [row] })
      }
      else if (method === 'PATCH') {
        row = { ...row, ...JSON.parse(req.postData() ?? '{}') }
        await route.fulfill({ json: [row] })
      }
      else {
        await route.fulfill({ status: 204, body: '' })
      }
    })
    await page.goto(hub.site.baseURL)
  })

  test('toolbar renders on every page and is axe-clean', async ({ page }) => {
    await expect(page.locator('[data-test="ann-arm"]')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('select text → composer (name + comment required) → mark + card; reply works', async ({ page }) => {
    // Arming opens the drawer too (studio behavior). From `lg` up the drawer
    // reserves page space (content shifts left) rather than overlaying, so
    // selecting text in main is unaffected.
    await page.locator('[data-test="ann-arm"]').click()
    await expect(page.locator('[data-test="ann-drawer"]')).toBeVisible()

    // Keyboard-create path: select the first substantial text node in main,
    // then blur (interactive/chrome targets never yield Enter to the create
    // path — the drawer's close button holds focus after opening).
    await page.evaluate(() => {
      const main = document.getElementById('main-content')!
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
      let node: Text | null = null
      while (walker.nextNode()) {
        const t = walker.currentNode as Text
        if (t.data.trim().length >= 20) {
          node = t
          break
        }
      }
      if (!node) throw new Error('no text node to select')
      const range = document.createRange()
      range.setStart(node, 0)
      range.setEnd(node, 15)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)
      ;(document.activeElement as HTMLElement | null)?.blur()
    })
    await page.keyboard.press('Enter')

    // Composer: save is disabled until BOTH fields are filled.
    const save = page.locator('[data-test="ann-save"]')
    await expect(save).toBeDisabled()
    await page.locator('[data-test="ann-name"]').fill('QA')
    await expect(save).toBeDisabled()
    await page.locator('.ann-composer textarea').fill('Looks good to me')
    await expect(save).toBeEnabled()
    await save.click()

    // Mark painted; the open drawer shows the thread.
    await expect(page.locator('mark.ann[data-ann-id]').first()).toBeVisible()
    const card = page.locator('[data-test="ann-card"]')
    await expect(card).toContainText('QA')
    await expect(card).toContainText('Looks good to me')

    // Axe with the drawer open.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])

    // Reply (name remembered from the composer — no per-card name input).
    await expect(page.locator('[data-test="ann-reply-name"]')).toHaveCount(0)
    await page.locator('[data-test="ann-reply-input"]').fill('Second thought: ship it')
    await page.locator('[data-test="ann-reply-send"]').click()
    await expect(card).toContainText('Second thought: ship it')
  })

  test('clean view hides all review chrome and the pill restores it', async ({ page }) => {
    await page.locator('[data-test="ann-clean-toggle"]').click()
    await expect(page.locator('[data-test="ann-arm"]')).toHaveCount(0)
    await expect(page.locator('mark.ann')).toHaveCount(0)
    const pill = page.locator('[data-test="ann-clean-exit"]')
    await expect(pill).toBeVisible()
    await pill.click()
    await expect(page.locator('[data-test="ann-arm"]')).toBeVisible()
  })
})
