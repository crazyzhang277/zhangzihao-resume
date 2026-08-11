import { expect, test } from '@playwright/test'

test.describe('public resume smoke flow', () => {
  test('desktop keeps content, navigation, projects, and copy controls usable', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    await expect(page.locator('main section')).toHaveCount(7)
    expect(await page.locator('#projects .project-card').count()).toBeGreaterThan(0)
    await expect(page.getByRole('heading', { name: 'zeroaigen-auto-mention' })).toHaveCount(0)

    await page.getByRole('button', { name: 'View details' }).first().click()
    await expect(page.getByRole('button', { name: 'Hide details' }).first()).toBeVisible()
    await page.getByRole('link', { name: 'Contact' }).click()
    await expect(page.locator('#contact')).toBeInViewport()

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(consoleErrors).toEqual([])
  })

  test('keeps the chromatic background visibly animating', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    await expect(page.getByTestId('chromatic-flow-field')).toHaveAttribute('data-motion-state', 'running')
    const before = await page.screenshot({ animations: 'allow' })
    await page.waitForTimeout(650)
    const after = await page.screenshot({ animations: 'allow' })

    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('mobile navigation and contact actions remain available without scroll locking', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('navigation', { name: 'Resume sections' })).toBeVisible()
    await page.getByRole('link', { name: 'Contact' }).click()
    await expect(page.getByRole('button', { name: 'Print resume' })).toBeVisible()

    const mobileState = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
    }))
    expect(mobileState.horizontalOverflow).toBe(false)
    expect(mobileState.bodyOverflowY).not.toBe('hidden')
  })

  test('reduced motion hides the canvas but keeps the resume content visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Zhang Zihao AIGC Resume' })).toBeVisible()
    await expect(page.getByTestId('chromatic-flow-field')).toBeHidden()
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible()
  })
})

test('admin route reports its unconfigured state without exposing owner controls', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Admin is unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run GitHub sync' })).toHaveCount(0)
})
