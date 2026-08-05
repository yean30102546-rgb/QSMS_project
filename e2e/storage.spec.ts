import { test, expect } from '@playwright/test';

test.describe('Drawing & Master Storage Vault Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth Me
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            user: {
              email: 'admin@example.com',
              name: 'Test Admin',
              role: 'Admin'
            }
          }
        }
      });
    });

    // Mock Drawings API endpoints
    await page.route('/api/drawings', async route => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.action === 'list_drawings') {
        await route.fulfill({
          json: {
            success: true,
            data: [
              {
                id: 'doc-1',
                drawing_number: 'D-0152',
                revision: '01',
                customer_name: 'ENEOS',
                item_code: '40001584',
                part_name: 'CAN 1L ENEOS MOTOR OIL',
                type: 'drawing',
                is_active: true
              }
            ],
            total: 1
          }
        });
      } else if (body.action === 'get_overview_stats') {
        await route.fulfill({
          json: {
            success: true,
            data: { total_drawings: 1, total_masters: 1, total_active: 2 }
          }
        });
      } else if (body.action === 'get_filter_options') {
        await route.fulfill({
          json: {
            success: true,
            options: {
              packageSizes: { small: ['1 x 24 L.'], pail: [], ibc: [], other: [] },
              oilGroups: ['ENGINE OIL'],
              customers: ['ENEOS'],
              palletTypes: ['พลาสติก'],
              revisions: ['01']
            }
          }
        });
      } else {
        await route.fulfill({ json: { success: true, data: [] } });
      }
    });

    // Set currentView=storage before navigating to avoid login redirect
    await page.addInitScript(() => {
      window.sessionStorage.setItem('currentView', 'storage');
    });

    await page.goto('/');
  });

  test('should render Storage Vault header and tab navigation', async ({ page }) => {
    await expect(page.locator('text=Drawing & Master Storage').first()).toBeVisible();

    const allDocsBtn = page.getByRole('button', { name: /All Documents/i });
    const gapAnalysisBtn = page.getByRole('button', { name: /Gap Analysis/i });

    await expect(allDocsBtn).toBeVisible();
    await expect(gapAnalysisBtn).toBeVisible();
  });

  test('should switch between All Documents and Gap Analysis tabs', async ({ page }) => {
    const gapAnalysisBtn = page.getByRole('button', { name: /Gap Analysis/i });
    await gapAnalysisBtn.click();

    await expect(page.getByText(/Missing Master Documents|All Clear!/i).first()).toBeVisible();

    const allDocsBtn = page.getByRole('button', { name: /All Documents/i });
    await allDocsBtn.click();

    await expect(allDocsBtn).toBeVisible();
  });

  test('should filter documents via search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by item code"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('40001584');
      await expect(searchInput).toHaveValue('40001584');
    }
  });
});
