import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  test.beforeEach(async ({ page }) => {
    // [FIX] 1. ใช้ Token ที่มี Padding ถูกต้อง (==) เพื่อป้องกัน atob error
    // Header.Payload(exp=9999999999).Signature
    const futureToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ==.somesignature";

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('app_lang', 'en'); 
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    }, futureToken);

    // [FIX] 2. ใช้ Regex ในการดัก Route เพื่อความแม่นยำสูงสุด (ป้องกัน case base url ไม่ตรง)
    await page.route(/\/api\/events\/?(\?.*)?$/, async route => {
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

    // Mock User Participation Status
    await page.route(/\/api\/participations\/user\/.*/, async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/student/event-list');
  });

  test('should display events correctly', async ({ page }) => {
    await expect(page.locator('.event-card')).toHaveCount(2);
    await expect(page.locator('h3.card-title').first()).toContainText('KU Run 2026');
  });

  test('should filter events using search bar', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    
    // [FIX] 3. พิมพ์ช้าๆ เพื่อให้ Svelte Bind ทำงานทัน และรอ Debounce นานขึ้น
    await searchInput.pressSequentially('Coding', { delay: 100 });
    
    // ตรวจสอบว่าค่าใน Input เปลี่ยนจริง
    await expect(searchInput).toHaveValue('Coding');

    // รอ Debounce (250ms) + Processing time
    await page.waitForTimeout(1000);

    // Should only show 1 event
    await expect(page.locator('.event-card')).toHaveCount(1);
    await expect(page.locator('h3.card-title')).toContainText('Coding Bootcamp');
  });

  test('should handle logout', async ({ page }) => {
    await page.click('button.logout-btn');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Check for login UI element instead of localStorage
    await expect(page.locator('h1.main-title')).toContainText('LOGIN');
  });

  test('should handle register modal flow', async ({ page }) => {
    // Mock Join API
    await page.route(/\/api\/participations\/join\/?$/, async route => {
        await route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            body: JSON.stringify({ id: 101, join_code: 'JOIN-123' }) 
        });
    });

    // Click register button
    await page.locator('button.register-btn').first().click();

    // Confirm SweetAlert dialog
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.click('.swal2-confirm');

    // Check for success message
    await expect(page.locator('.swal2-title')).toContainText('Success');
  });
});