import { test, expect } from '@playwright/test';

test.describe('QSMS User Guide Presentation Deck Flow', () => {
  test.beforeEach(async ({ page }) => {
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

    await page.addInitScript(() => {
      window.sessionStorage.setItem('currentView', 'guide');
    });

    await page.goto('/');
  });

  test('should render introduction slide and presentation badge', async ({ page }) => {
    await expect(page.locator('text=01 / INTRODUCTION').first()).toBeVisible();
    await expect(page.locator('text=QSMS Presentation Deck').first()).toBeVisible();
  });

  test('should advance to next slide using ArrowRight key', async ({ page }) => {
    await expect(page.locator('text=01 / INTRODUCTION').first()).toBeVisible();

    await page.keyboard.press('ArrowRight');

    await expect(page.locator('text=02 / OBJECTIVES').first()).toBeVisible();
  });

  test('should filter slides by Drawing & Master category', async ({ page }) => {
    await page.click('button:has-text("Drawing & Master")');
    await expect(page.locator('text=06 / DRAWING & MASTER MODULE').first()).toBeVisible();
    
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('text=07 / DRAWING WORKFLOW').first()).toBeVisible();
    await expect(page.locator('text=Drawing & Master Storage').first()).toBeVisible();
  });

  test('should filter slides by DocAI RAG category', async ({ page }) => {
    await page.click('button:has-text("DocAI RAG")');
    await expect(page.locator('text=08 / DOCAI RAG MODULE').first()).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('text=09 / DOCAI WORKFLOW').first()).toBeVisible();
    await expect(page.locator('text=QSMS DocAI RAG Engine').first()).toBeVisible();
  });
});
