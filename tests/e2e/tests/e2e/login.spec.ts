import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  
  // ไปที่หน้า Login ก่อนเริ่มแต่ละ test
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // ตรวจสอบ Title
    await expect(page.locator('h1.main-title')).toContainText('NISITLOGIN TO ACCOUNT');
    
    // ตรวจสอบว่ามี input ครบ
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button.login-button')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    const loginButton = page.locator('button.login-button');

    // Case 1: ไม่กรอกอะไรเลย
    await loginButton.click();
    await expect(page.locator('.message-container.error')).toContainText('Please enter your email.');

    // Case 2: กรอก Email ผิดรูปแบบ
    await page.fill('#email', 'invalid-email');
    await loginButton.click();
    await expect(page.locator('.message-container.error')).toContainText('Invalid email format.');

    // Case 3: กรอก Email ถูก แต่ไม่กรอก Password
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', ''); // เคลียร์ password
    await loginButton.click();
    await expect(page.locator('.message-container.error')).toContainText('Please enter your password.');
  });

  test('should handle failed login (API error)', async ({ page }) => {
    // จำลอง (Mock) API Response ว่า Login ไม่ผ่าน (401)
    await page.route('**/api/users/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Incorrect email or password' }),
      });
    });

    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button.login-button');

    // ตรวจสอบว่าแสดง Error message จาก API
    await expect(page.locator('.message-container.error')).toContainText('Incorrect email or password');
  });

  test('should redirect to student page on successful login', async ({ page }) => {
    // จำลอง (Mock) API Response ว่า Login สำเร็จ เป็น Role Student
    await page.route('**/api/users/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          refresh_token: 'fake-refresh-token',
          role: 'student',
          user: {
            id: 1,
            email: 'student@example.com',
            name: 'Test Student'
          }
        }),
      });
    });

    await page.fill('#email', 'student@example.com');
    await page.fill('#password', 'password123');
    await page.click('button.login-button');

    // ตรวจสอบว่า redirect ไปหน้าของ Student ตาม logic ใน getRoleHome
    await expect(page).toHaveURL(/\/student\/event-list/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('.toggle-password');

    // เริ่มต้นต้องเป็น type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // กดปุ่มลูกตา
    await toggleButton.click();
    
    // ต้องเปลี่ยนเป็น type="text"
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // กดอีกครั้งต้องกลับเป็น password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});