import { test, expect } from '@playwright/test';

test.describe('Student Event List', () => {
  
  // Setup Authentication State & Mock Data
  test.beforeEach(async ({ page }) => {
    // 1. Set localStorage for logged in user
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-token');
      localStorage.setItem('user_info', JSON.stringify({ id: 1, role: 'student', name: 'Test User' }));
    });

    // 2. Mock Events API
    await page.route('**/api/events/', async route => {
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

    // 3. Mock User Participation Status (Update Status)
    await page.route('**/api/participations/user/*', async route => {
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
    await searchInput.fill('Coding');
    
    // Wait for debounce
    await page.waitForTimeout(300);

    // Should only show 1 event
    await expect(page.locator('.event-card')).toHaveCount(1);
    await expect(page.locator('h3.card-title')).toContainText('Coding Bootcamp');
  });

  test('should handle logout', async ({ page }) => {
    // Click logout button
    await page.click('button.logout-btn');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Verify localStorage is cleared (check if token is gone)
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });

  test('should handle register modal flow', async ({ page }) => {
    // Mock Join API
    await page.route('**/api/participations/join', async route => {
        await route.fulfill({ 
            status: 200, 
            body: JSON.stringify({ id: 101, join_code: 'JOIN-123' }) 
        });
    });

    // Click Register on the first event
    await page.click('button.register-btn:has-text("Register") >> nth=0');

    // Confirm SweetAlert dialog
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.click('.swal2-confirm');

    // Check for success message
    await expect(page.locator('.swal2-title')).toContainText('Success');
  });
});