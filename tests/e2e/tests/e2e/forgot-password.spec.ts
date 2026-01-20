import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('#email', 'not-an-email');
    await page.click('button:has-text("SEND LINK")');
    await expect(page.locator('.message-container.error')).toContainText('Invalid email format');
  });

  test('should show success screen on valid email', async ({ page }) => {
    // Mock API success
    await page.route('**/api/users/forgot-password', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.fill('#email', 'user@example.com');
    await page.click('button:has-text("SEND LINK")');

    // Expect UI transition to success step
    await expect(page.locator('h1.main-title')).toContainText('CHECK YOUR EMAIL');
    await expect(page.locator('text=user@example.com')).toBeVisible();
  });
});