import { test, expect } from '@playwright/test'

test('home page loads with hero content', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Psychologists with time for you and your needs',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start matching' })).toBeVisible()
})
