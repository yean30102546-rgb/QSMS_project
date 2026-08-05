import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Bootstrap view state to login
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('currentView', 'login');
    });
    await page.reload();
  });

  test('should display login view and reject invalid credentials with error message', async ({ page }) => {
    // Mock login API response for invalid credentials
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        json: {
          success: false,
          error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง'
        }
      });
    });

    await expect(page.locator('text=One login for Rework').first()).toBeVisible();

    // Fill invalid credentials
    const usernameInput = page.locator('input[placeholder="Username"]');
    const passwordInput = page.locator('input[placeholder="Password"]');
    await usernameInput.fill('nonexistent_user');
    await passwordInput.fill('WrongPass123!');

    // Submit
    const submitBtn = page.getByRole('button', { name: /เข้าสู่ระบบ/i }).last();
    await submitBtn.click();

    // Verify error message toast/card
    await expect(page.locator('text=รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง')).toBeVisible();
  });

  test('should allow user to navigate to register view and enforce password strength checks', async ({ page }) => {
    await expect(page.locator('text=One login for Rework').first()).toBeVisible();

    // Click "สร้างบัญชีใหม่" button to open Register view
    const registerBtn = page.getByRole('button', { name: /สร้างบัญชีใหม่/i });
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Verify Register View title
    await expect(page.locator('text=สร้างบัญชีใหม่').first()).toBeVisible();

    // Fill username & name
    const usernameInput = page.locator('input[placeholder="Username (สำหรับใช้ล็อกอิน)"]');
    const nameInput = page.locator('input[placeholder="ชื่อ-นามสกุลจริง"]');
    const passwordInput = page.locator('input[placeholder="รหัสผ่าน"]');

    await usernameInput.fill('new_operator');
    await nameInput.fill('Somchai Newuser');

    // Fill weak password first
    await passwordInput.fill('weak');

    // Submit button should be disabled due to password strength policy
    const confirmBtn = page.getByRole('button', { name: /ยืนยันสร้างบัญชี/i });
    await expect(confirmBtn).toBeDisabled();

    // Fill valid strong password
    await passwordInput.fill('StrongPass123!');
    await expect(confirmBtn).toBeEnabled();
  });
});
