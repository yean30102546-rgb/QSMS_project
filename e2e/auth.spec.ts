import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({ status: 401, json: { success: false, error: 'Unauthenticated' } });
    });
    // Set the initial view before the client app hydrates.
    await page.addInitScript(() => {
      window.sessionStorage.setItem('currentView', 'login');
    });
    await page.goto('/');
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

    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible();

    // Fill invalid credentials
    const usernameInput = page.locator('input[placeholder="ระบุชื่อผู้ใช้งาน"]');
    const passwordInput = page.locator('input[placeholder="ระบุรหัสผ่าน"]');
    await usernameInput.fill('nonexistent_user');
    await passwordInput.fill('WrongPass123!');

    // Submit
    const submitBtn = page.getByRole('button', { name: /เข้าสู่ระบบ/i });
    await submitBtn.click();

    // Verify error message toast/card
    await expect(page.locator('text=รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง')).toBeVisible();
  });

  test('does not expose self-registration on the login screen', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible();
    await expect(page.getByText(/ระบบนี้ไม่อนุญาตให้ลงทะเบียนด้วยตนเอง/)).toBeVisible();
    await expect(page.getByRole('button', { name: /สร้างบัญชีใหม่/i })).toHaveCount(0);
  });

  test('should allow user to navigate to forgot password view and progress through 2-step reset flow', async ({ page }) => {
    // Mock reset API response
    await page.route('/api/auth/reset-password', async route => {
      const payload = route.request().postDataJSON();
      if (payload.action === 'request_reset') {
        await route.fulfill({
          json: { success: true, message: 'ยืนยันข้อมูลเรียบร้อยแล้ว', token: 'TOKEN_849201' }
        });
      } else if (payload.action === 'update_password') {
        await route.fulfill({
          json: { success: true, message: 'รีเซ็ทรหัสผ่านเรียบร้อยแล้ว' }
        });
      }
    });

    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible();

    // Click "ลืมรหัสผ่าน?"
    const forgotBtn = page.getByRole('button', { name: /ลืมรหัสผ่าน\?/i });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // Step 1: Verify Identity
    await expect(page.locator('text=ยืนยันตัวตน').first()).toBeVisible();
    await page.locator('input[placeholder="Username (ชื่อผู้ใช้งาน)"]').fill('qsms_operator');
    await page.locator('input[placeholder*="รหัสพนักงาน"]').fill('EMP1002');
    await page.getByRole('button', { name: /ยืนยันตัวตน/i }).click();

    // Step 2: Set New Password
    await expect(page.locator('text=ตั้งรหัสผ่านใหม่').first()).toBeVisible();
    await page.locator('input[placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"]').fill('SecureP@ss2026');
    await page.locator('input[placeholder="ยืนยันรหัสผ่านใหม่"]').fill('SecureP@ss2026');

    const updateBtn = page.getByRole('button', { name: /อัปเดตรหัสผ่านใหม่/i });
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();
  });
});
