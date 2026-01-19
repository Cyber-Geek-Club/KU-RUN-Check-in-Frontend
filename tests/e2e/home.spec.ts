import { test, expect } from '@playwright/test';

test('homepage shows app title', async ({ page }) => {
  await page.goto('/');
  // Check main header or app title exists
  const header = page.locator('text=KASETSART');
  await expect(header.first()).toBeVisible();
});
