import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should switch roles between Student and Officer', async ({ page }) => {
    // Default is Student
    await expect(page.locator('text=Nisit ID')).toBeVisible();
    
    // [FIX] Specific locator for the Faculty LABEL to avoid matching the "Select Faculty" button text
    await expect(page.locator('label:has-text("Faculty")')).toBeVisible();

    // Switch to Officer
    await page.click('button:has-text("Officer")');
    await expect(page.locator('text=Nisit ID')).toBeHidden();
    await expect(page.locator('text=Department')).toBeVisible();

    // Switch back to Student
    await page.click('button:has-text("Student")');
    await expect(page.locator('text=Nisit ID')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("SIGN UP")');
    
    // Check for validation messages (checking the toast/message container)
    await expect(page.locator('.message-container.error')).toBeVisible();
    // Or check specific field highlight classes if needed
    await expect(page.locator('.select-trigger').first()).toHaveClass(/error/); // Title field
  });

  test('should handle password mismatch', async ({ page }) => {
    await page.click('button:has-text("Officer")'); // Switch to simple form
    
    // Fill basic info
    await page.click('button:has-text("Title")');
    await page.click('button:has-text("Mr.")');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'test@example.com');
    await page.click('button:has-text("Select Department")');
    await page.click('button:has-text("IT Support Center")');

    // Fill mismatch passwords
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'Password999');
    
    await page.click('button:has-text("SIGN UP")');
    await expect(page.locator('.message-container.error')).toContainText('Passwords do not match');
  });

  test('should register successfully as Student (with Mock APIs)', async ({ page }) => {
    // 1. Mock Nisit ID API (External)
    await page.route('https://regis.src.ku.ac.th/res/api/gen_user_endcode.php?id=*', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ "std_id": "6412345678" }) });
    });

    // 2. Mock Internal Register API
    await page.route('**/api/users/register/student', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Fill Form
    await page.click('button:has-text("Title")');
    await page.click('button:has-text("Mr.")');
    await page.fill('#firstName', 'Somchai');
    await page.fill('#lastName', 'Jaidee');
    await page.fill('#email', 'somchai@ku.th');
    
    // Student Specifics
    await page.fill('input[placeholder="Nisit ID"]', '6412345678');
    
    await page.click('button:has-text("Select Faculty")');
    await page.click('button:has-text("Science at Sriracha")');
    
    await page.click('button:has-text("Select Major")');
    await page.click('button:has-text("Computer Science")');

    await page.fill('#password', 'Pass1234');
    await page.fill('#confirmPassword', 'Pass1234');

    await page.click('button:has-text("SIGN UP")');

    // Check Success State
    await expect(page.locator('h2.success-title')).toContainText('Check your inbox');
  });
});