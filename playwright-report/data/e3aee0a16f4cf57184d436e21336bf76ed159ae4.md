# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rework-create.spec.ts >> Rework Portal - Case Initiation >> should be able to navigate to add case tab and fill basic info
- Location: e2e\rework-create.spec.ts:51:3

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('textbox', { name: /ชื่อรายการ/i }).first()
Expected: "Test Product"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for getByRole('textbox', { name: /ชื่อรายการ/i }).first()
    14 × locator resolved to <input id="_r_10_" name="items.0.itemName" class="block w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none "/>
       - unexpected value ""

```

```yaml
- textbox "ชื่อรายการ (Item Name) *"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Rework Portal - Case Initiation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Mock the API responses
  6  |     await page.route('/api/rework', async route => {
  7  |       const method = route.request().method();
  8  |       if (method === 'POST') {
  9  |         const body = JSON.parse(route.request().postData() || '{}');
  10 |         
  11 |         if (body.action === 'fetchAllCases') {
  12 |           await route.fulfill({
  13 |             json: { success: true, data: [] }
  14 |           });
  15 |         } else if (body.action === 'insertCase') {
  16 |           await route.fulfill({
  17 |             json: {
  18 |               success: true,
  19 |               data: { caseId: 'RW999-2026', itemIds: ['item-1'] }
  20 |             }
  21 |           });
  22 |         } else {
  23 |           await route.fulfill({ json: { success: true, data: {} } });
  24 |         }
  25 |       } else {
  26 |         await route.continue();
  27 |       }
  28 |     });
  29 | 
  30 |     // Bootstrapping auth & view state via sessionStorage before app mounts
  31 |     await page.goto('/');
  32 |     await page.evaluate(() => {
  33 |       const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  34 |       const tokenPayload = btoa(JSON.stringify({ sub: 'test@example.com', profile: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }));
  35 |       const tokenSignature = 'dummysignature';
  36 |       const dummyToken = `${tokenHeader}.${tokenPayload}.${tokenSignature}`;
  37 |       
  38 |       sessionStorage.setItem('qsms_token', dummyToken);
  39 |       sessionStorage.setItem('qsms_user', JSON.stringify({
  40 |         email: 'test@example.com',
  41 |         name: 'Test Admin',
  42 |         role: 'ADMIN'
  43 |       }));
  44 |       sessionStorage.setItem('qsms_role', 'ADMIN');
  45 |       sessionStorage.setItem('qsms_token_expiry', (Date.now() + 3600000).toString());
  46 |       sessionStorage.setItem('currentView', 'rework');
  47 |     });
  48 |     await page.reload();
  49 |   });
  50 | 
  51 |   test('should be able to navigate to add case tab and fill basic info', async ({ page }) => {
  52 |     // Go to Add Case Tab
  53 |     await page.getByRole('button', { name: /เพิ่มงานใหม่/i }).click();
  54 | 
  55 |     // Ensure we are in the Add Case Form
  56 |     await expect(page.locator('text=บันทึกงาน Rework ใหม่')).toBeVisible();
  57 | 
  58 |     // Fill Case ID
  59 |     const caseInput = page.locator('input[placeholder="012"]');
  60 |     await caseInput.fill('999');
  61 |     await expect(caseInput).toHaveValue('999');
  62 | 
  63 |     // Fill Item Name
  64 |     const itemNameInput = page.getByRole('textbox', { name: /ชื่อรายการ/i }).first();
  65 |     await itemNameInput.fill('Test Product', { force: true });
> 66 |     await expect(itemNameInput).toHaveValue('Test Product');
     |                                 ^ Error: expect(locator).toHaveValue(expected) failed
  67 | 
  68 |     // Try submitting disabled form
  69 |     const submitBtn = page.getByRole('button', { name: /บันทึกข้อมูลเข้าสู่ระบบ/i });
  70 |     await expect(submitBtn).toBeDisabled();
  71 |   });
  72 | });
  73 | 
```