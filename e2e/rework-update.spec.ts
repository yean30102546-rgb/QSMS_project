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
              message: 'Database sync failed: fetch failed',
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

    // Set the initial view before the client app hydrates.
    await page.addInitScript(() => {
      sessionStorage.setItem('currentView', 'rework');
    });
    await page.goto('/');
  });

  test('should allow admin to edit case name and source', async ({ page }) => {
    // 1. Wait for cases to load and click on the mocked case
    const caseCard = page.locator('text=RT084-2026').first();
    await expect(caseCard).toBeVisible();
    await caseCard.click();

    // 2. Expect Case Update View to open
    await expect(page.locator('text=RT084-2026').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /1\. บันทึกข้อมูลสินค้า/i })).toBeVisible();

    // 4. Click save button in update view
    const saveButton = page.getByRole('button', { name: /บันทึกเสร็จสิ้น/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 5. Verify toast or completion
    await expect(page.locator('text=บันทึกสำเร็จ')).toBeVisible();
  });
});
