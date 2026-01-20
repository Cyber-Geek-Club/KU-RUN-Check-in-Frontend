import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  test.beforeEach(async ({ page }) => {
    // [FIX] Use a simple, valid Base64 payload for the token to avoid atob() errors in startSessionTimer
    // Payload: {"exp": 9999999999, "id": 1, "role": "student"} 
    // Base64: eyJleHAiOjk5OTk5OTk5OTksImlkIjoxLCJyb2xlIjoic3R1ZGVudCJ9
    const validToken = "header.eyJleHAiOjk5OTk5OTk5OTksImlkIjoxLCJyb2xlIjoic3R1ZGVudCJ9.signature";

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('app_lang', 'en'); 
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    }, validToken);

    // [FIX] Use Regex for robust route matching to handle any Base URL variations
    
    // 1. Mock Events API: Matches /api/events/ or /api/events
    await page.route(/\/api\/events\/?$/, async route => {
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

    // 2. Mock User Participation Status: Matches /api/participations/user/{id}
    await page.route(/\/api\/participations\/user\/\d+/, async route => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // 3. Mock Join API: Matches /api/participations/join
    await page.route(/\/api\/participations\/join\/?$/, async route => {
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
    
    // [FIX] Ensure input binding updates by filling and blurring
    await searchInput.fill('Coding');
    await searchInput.blur(); // Trigger change event
    
    // Verify input value is set
    await expect(searchInput).toHaveValue('Coding');

    // Wait for Svelte debounce (250ms) + rendering
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
    // Click register button on the first event (KU Run)
    // We use .first() or nth=0
    const registerBtn = page.locator('button.register-btn').first();
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toBeEnabled();
    await registerBtn.click();

    // Confirm SweetAlert dialog
    const confirmBtn = page.locator('.swal2-confirm');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Check for success message (Not Session Expired)
    await expect(page.locator('.swal2-title')).toContainText('Success');
    
    // Verify modal content details (optional but good for debugging)
    await expect(page.locator('.swal2-html-container')).toContainText('JOIN-123');
  });
});