import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Setup Valid Token
    const validToken = "header.eyJleHAiOjk5OTk5OTk5OTksImlkIjoxLCJyb2xlIjoic3R1ZGVudCJ9==.signature";

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('app_lang', 'en'); 
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    }, validToken);

    // 2. Mock API Routes using Regex (More robust than glob patterns)
    
    // Mock Events API: Matches any URL containing /api/events
    await page.route(/\/api\/events/, async route => {
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

    // Mock User Participation Status: Matches /api/participations/user... including query params
    await page.route(/\/api\/participations\/user/, async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock Join API: Matches /api/participations/join
    await page.route(/\/api\/participations\/join/, async route => {
        await route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            body: JSON.stringify({ id: 101, join_code: 'JOIN-123' }) 
        });
    });

    // Fallback: catch any other /api/ requests and return empty JSON (prevents unexpected 401s)
    await page.route(/\/api\//, async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/student/event-list');
  });

  test('should display events correctly', async ({ page }) => {
    await expect(page.locator('.event-card')).toHaveCount(2);
    await expect(page.locator('h3.card-title').first()).toContainText('KU Run 2026');
  });

  test('should filter events using search bar', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    
    // [FIX] Force update input value using DOM manipulation ensures Svelte binding triggers
    await page.$eval('.search-input', (el: any) => {
        el.value = 'Coding';
        el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Wait for Svelte debounce (250ms) + rendering time
    await page.waitForTimeout(1000);

    // Verify filter result
    await expect(page.locator('.event-card')).toHaveCount(1);
    await expect(page.locator('h3.card-title')).toContainText('Coding Bootcamp');
  });

  test('should handle logout', async ({ page }) => {
    await page.click('button.logout-btn');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('h1.main-title')).toContainText('LOGIN');
  });

  test('should handle register modal flow', async ({ page }) => {
    // 1. Ensure no "Session Expired" alert exists initially
    await expect(page.locator('text=Session Expired')).toBeHidden();

    // 2. Click register on the first event
    const registerBtn = page.locator('button.register-btn:has-text("Register")').first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // 3. Confirm SweetAlert dialog
    const confirmBtn = page.locator('.swal2-confirm');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 4. Verify Success Message
    // Note: If this fails with "Session Expired", it means one of the initial fetch requests failed 
    // and cleared the token. The regex routes in beforeEach fixes this.
    await expect(page.locator('.swal2-title')).toContainText('Success');
    
    // 5. Verify Join Code in details
    await expect(page.locator('.swal2-html-container')).toContainText('JOIN-123');
  });
});