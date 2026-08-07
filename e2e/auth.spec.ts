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

    // Fill username, name & employee_id
    const usernameInput = page.locator('input[placeholder="Username (สำหรับใช้ล็อกอิน)"]');
    const nameInput = page.locator('input[placeholder="ชื่อ-นามสกุลจริง"]');
    const employeeIdInput = page.locator('input[placeholder*="รหัสพนักงาน"]');
    const passwordInput = page.locator('input[placeholder="รหัสผ่าน"]');

    await usernameInput.fill('new_operator');
    await nameInput.fill('Somchai Newuser');
    await employeeIdInput.fill('EMP1002');

    // Fill weak password first
    await passwordInput.fill('weak');

    // Submit button should be disabled due to password strength policy
    const confirmBtn = page.getByRole('button', { name: /ยืนยันสร้างบัญชี/i });
    await expect(confirmBtn).toBeDisabled();

    // Fill valid strong password
    await passwordInput.fill('StrongPass123!');
    await expect(confirmBtn).toBeEnabled();
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

    await expect(page.locator('text=One login for Rework').first()).toBeVisible();

    // Click "ลืมรหัสผ่าน?"
    const forgotBtn = page.getByRole('button', { name: /ลืมรหัสผ่าน\?/i });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // Step 1: Verify Identity
    await expect(page.locator('text=ยืนยันตัวตน').first()).toBeVisible();
    await page.locator('input[placeholder*="Username"]').fill('qsms_operator');
    await page.locator('input[placeholder*="รหัสพนักงาน"]').fill('EMP1002');
    await page.getByRole('button', { name: /ยืนยันตัวตน/i }).click();

    // Step 2: Set New Password
    await expect(page.locator('text=ตั้งรหัสผ่านใหม่').first()).toBeVisible();
    await page.locator('input[placeholder*="อย่างน้อย 8 ตัวอักษร"]').fill('SecureP@ss2026');
    await page.locator('input[placeholder="ยืนยันรหัสผ่านใหม่"]').fill('SecureP@ss2026');

    const updateBtn = page.getByRole('button', { name: /อัปเดตรหัสผ่านใหม่/i });
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();
  });
});
