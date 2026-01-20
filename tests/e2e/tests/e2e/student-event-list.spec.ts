import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  test.beforeEach(async ({ page }) => {
    // [FIX] 1. ใช้ Token ที่ถูกต้อง (มี Padding ==) เพื่อป้องกัน atob error
    // Payload: {"exp": 9999999999, "id": 1, "role": "student"}
    const validToken = "header.eyJleHAiOjk5OTk5OTk5OTksImlkIjoxLCJyb2xlIjoic3R1ZGVudCJ9==.signature";

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('app_lang', 'en'); 
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    }, validToken);

    // [FIX] 2. ใช้ Glob Pattern (**) ดักจับทุก URL ที่มี path นี้ โดยไม่สน Base URL หรือ Query Params
    
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

    // Mock User Participation Status
    await page.route('**/api/participations/user/**', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Join API
    await page.route('**/api/participations/join**', async route => {
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
    
    // [FIX] 3. ใช้ pressSequentially เพื่อพิมพ์ทีละตัว (เสมือนจริง) กระตุ้น Svelte binding ได้ดีกว่า
    await searchInput.pressSequentially('Coding', { delay: 100 });
    
    // ตรวจสอบว่าค่าถูกพิมพ์ลงไปจริง
    await expect(searchInput).toHaveValue('Coding');

    // รอ Debounce (250ms) + เวลาประมวลผล
    await page.waitForTimeout(1000);

    // ต้องเหลือแค่ 1 Event
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
    // Click register button on the first event
    // ใช้วิธีหาปุ่ม Register ตัวแรกสุดที่กดได้
    const registerBtn = page.locator('button.register-btn:has-text("Register")').first();
    
    // รอให้ปุ่มพร้อมกด
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Confirm SweetAlert dialog
    const confirmBtn = page.locator('.swal2-confirm');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // [FIX] 4. ตรวจสอบ Success Message (ถ้า Mock join ทำงานถูกต้อง จะไม่ขึ้น Session Expired)
    await expect(page.locator('.swal2-title')).toContainText('Success');
    
    // Optional: เช็ครายละเอียดใน Modal
    await expect(page.locator('.swal2-html-container')).toContainText('JOIN-123');
  });
});