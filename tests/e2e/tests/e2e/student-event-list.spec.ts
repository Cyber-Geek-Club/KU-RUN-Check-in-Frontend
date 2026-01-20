import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  test.beforeEach(async ({ page }) => {
    // [FIX] 1. ใช้ Token ที่ถูกต้องตามมาตรฐาน JWT (มี Padding)
    // Header.Payload(exp=9999999999).Signature
    const futureToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ==.somesignature";

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('app_lang', 'en'); 
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    }, futureToken);

    // [FIX] 2. ใช้ Glob Pattern (**) เพื่อให้ดักจับ URL ได้ครอบคลุมกว่า Regex
    
    // Mock Events API
    await page.route('**/api/events/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'KU Run 2026',
            description: 'Annual running event',
            location: 'Kasetsart Sriracha',
            distance_km: 10,
            participant_count: 50,
            max_participants: 100,
            event_date: '2026-01-20',
            event_end_date: '2026-01-20',
            is_active: true,
            is_published: true,
            event_type: 'single_day'
          },
          {
            id: 2,
            title: 'Coding Bootcamp',
            description: 'Learn SvelteKit',
            location: 'Lab 505',
            distance_km: 0,
            participant_count: 10,
            max_participants: 20,
            event_date: '2026-02-01',
            event_end_date: '2026-02-01',
            is_active: true,
            is_published: true,
            event_type: 'single_day'
          }
        ])
      });
    });

    // Mock User Participation Status (Handle query params automatically with glob)
    await page.route('**/api/participations/user/**', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Join API
    await page.route('**/api/participations/join', async route => {
        await route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            body: JSON.stringify({ id: 101, join_code: 'JOIN-123' }) 
        });
    });

    await page.goto('/student/event-list');
  });

  test('should display events correctly', async ({ page }) => {
    await expect(page.locator('.event-card')).toHaveCount(2);
    await expect(page.locator('h3.card-title').first()).toContainText('KU Run 2026');
  });

  test('should filter events using search bar', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    
    // [FIX] 3. Fill + Dispatch Event เพื่อความชัวร์ใน Svelte binding
    await searchInput.fill('Coding');
    await searchInput.dispatchEvent('input');
    
    // รอ Debounce และการ Render
    await page.waitForTimeout(1000);

    // Should only show 1 event
    await expect(page.locator('.event-card')).toHaveCount(1);
    await expect(page.locator('h3.card-title')).toContainText('Coding Bootcamp');
  });

  test('should handle logout', async ({ page }) => {
    await page.click('button.logout-btn');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check for login UI
    await expect(page.locator('h1.main-title')).toContainText('LOGIN');
  });

  test('should handle register modal flow', async ({ page }) => {
    // Click register button (nth=0 is KU Run)
    await page.locator('button.register-btn').first().click();

    // Confirm SweetAlert dialog
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.click('.swal2-confirm');

    // Check for success message
    await expect(page.locator('.swal2-title')).toContainText('Success');
  });
});