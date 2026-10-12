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

    // Set the initial view before the client app hydrates.
    await page.addInitScript(() => {
      sessionStorage.setItem('currentView', 'rework');
    });
    await page.goto('/');
  });

  test('should be able to navigate to add case tab and fill basic info', async ({ page }) => {
    // Go to Add Case Tab
    await page.getByRole('button', { name: /เปิดเคสใหม่ \(Add Case\)/i }).click();

    // Ensure we are in the Add Case Form
    await expect(page.getByRole('heading', { name: /เปิดเคสใหม่ \(Case Initiation\)/i })).toBeVisible();
    await expect(page.getByText(/รหัสเคสอัตโนมัติ:/i)).toBeVisible();

    // Fill Item Name using click + pressSequentially for react-hook-form compatibility
    const itemNameInput = page.getByRole('textbox', { name: /ชื่อรายการ/i }).first();
    await itemNameInput.click();
    await itemNameInput.pressSequentially('Test Product', { delay: 20 });
    await expect(itemNameInput).toHaveValue('Test Product');

    // Try submitting disabled form
    const submitBtn = page.getByRole('button', { name: /เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์/i });
    await expect(submitBtn).toBeDisabled();
  });
});
