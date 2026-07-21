import { test, expect } from '@playwright/test';

test.describe('Rework Portal - Case Update', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              email: 'test@example.com',
              name: 'Test Admin',
              role: 'QSMS'
            }
          }
        }
      });
    });

    // Mock initial list of cases and updates
    await page.route('/api/rework', async route => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        
        if (body.action === 'fetchAllCases') {
          await route.fulfill({
            json: {
              success: true,
              data: [{
                id: 'RT084-2026',
                caseName: 'RT084-2026',
                source: 'Customer',
                date: new Date().toISOString(),
                status: 'Pending',
                items: [],
                orFilesUrls: []
              }]
            }
          });
        } else if (body.action === 'updateCaseStatus' || body.action === 'updateCase') {
          await route.fulfill({
            json: {
              success: true,
              message: 'Google Sheets sync failed: fetch failed',
              data: {
                caseId: body.updates?.caseName 
                  ? body.updates.caseName
                  : 'RT084-2026',
                status: 'Pending',
                orFilesUrls: []
              }
            }
          });
        } else {
          await route.fulfill({
            json: { success: true, data: {} }
          });
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

  test('should allow admin to edit case name and source', async ({ page }) => {
    // 1. Wait for cases to load and click on the mocked case
    const caseCard = page.locator('text=RT084-2026').first();
    await expect(caseCard).toBeVisible();
    await caseCard.click();

    // 2. Expect modal to open
    await expect(page.locator('text=Update Status')).toBeVisible();
    await expect(page.locator('text=RT084-2026').first()).toBeVisible();

    // 3. Enter Edit Mode
    await page.getByRole('button', { name: 'แก้ไข' }).click();

    // 4. Check if dropdown for Source exists and change it to SFC
    const sourceDropdown = page.locator('select').first();
    await expect(sourceDropdown).toBeVisible();
    await sourceDropdown.selectOption('SFC');

    // 5. Change case number from 084 to 999
    const nameInput = page.locator('input[placeholder="เช่น 084"]');
    await nameInput.fill('999');

    // 6. Handle the alert that will pop up
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('บันทึกข้อมูลสำเร็จ แต่ไม่สามารถซิงค์ไปยัง Google Sheets ได้');
      await dialog.accept();
    });

    // 7. Click save
    await page.getByRole('button', { name: 'บันทึก' }).click();

    // 8. The modal should close
    await expect(page.locator('text=Update Status')).not.toBeVisible();
  });
});
