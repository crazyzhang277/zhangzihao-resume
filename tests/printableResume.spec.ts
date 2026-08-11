import { expect, test } from '@playwright/test'

test('prints the resume as one A4 page without the screen shell', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })

  const printLayout = await page.getByTestId('printable-resume').evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return {
      height: bounds.height,
      width: bounds.width,
      scrollHeight: element.scrollHeight,
      screenShellDisplay: getComputedStyle(document.querySelector('.resume-shell')!).display,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []

  expect(printLayout.screenShellDisplay).toBe('none')
  expect(printLayout.width).toBeCloseTo(718, 0)
  expect(printLayout.height).toBeCloseTo(1061, 0)
  expect(printLayout.scrollHeight).toBeLessThanOrEqual(Math.ceil(printLayout.height) + 1)
  expect(printLayout.scrollWidth).toBeLessThanOrEqual(Math.ceil(printLayout.width))
  expect(pages).toHaveLength(1)
})
