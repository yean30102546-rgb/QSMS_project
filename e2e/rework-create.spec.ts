import { test, expect } from '@playwright/test';

test.describe('Rework Portal - Case Initiation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              email: 'test@example.com',
              name: 'Test Admin',
              role: 'ADMIN'
            }
          }
        }
      });
    });

    // Mock the API responses
    await page.route('/api/rework', async route => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        
        if (body.action === 'fetchAllCases') {
          await route.fulfill({
            json: { success: true, data: [] }
          });
        } else if (body.action === 'insertCase') {
          await route.fulfill({
            json: {
              success: true,
              data: { caseId: 'RW999-2026', itemIds: ['item-1'] }
            }
          });
        } else {
          await route.fulfill({ json: { success: true, data: {} } });
        }
      } else {
        await route.continue();
      }
    });

    // Bootstrapping view state via sessionStorage before app mounts
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('currentView', 'rework');
    });
    await page.reload();
  });

  test('should be able to navigate to add case tab and fill basic info', async ({ page }) => {
    // Go to Add Case Tab
    await page.getByRole('button', { name: /เพิ่มงานใหม่/i }).click();

    // Ensure we are in the Add Case Form
    await expect(page.locator('text=บันทึกงาน Rework ใหม่')).toBeVisible();

    // Fill Case ID
    const caseInput = page.locator('input[placeholder="012"]');
    await caseInput.fill('999');
    await expect(caseInput).toHaveValue('999');

    // Fill Item Name
    const itemNameInput = page.getByRole('textbox', { name: /ชื่อรายการ/i }).first();
    await itemNameInput.fill('Test Product', { force: true });
    await expect(itemNameInput).toHaveValue('Test Product');

    // Try submitting disabled form
    const submitBtn = page.getByRole('button', { name: /บันทึกข้อมูลเข้าสู่ระบบ/i });
    await expect(submitBtn).toBeDisabled();
  });
});
