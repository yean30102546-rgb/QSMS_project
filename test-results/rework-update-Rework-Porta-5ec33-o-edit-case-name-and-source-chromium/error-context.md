# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rework-update.spec.ts >> Rework Portal - Case Update >> should allow admin to edit case name and source
- Location: e2e\rework-update.spec.ts:73:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="เช่น 084"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e14]:
    - complementary [ref=e15]:
      - generic [ref=e16] [cursor=pointer]:
        - img "Excellence Logo" [ref=e18]
        - heading "QSMS REWORK" [level=1] [ref=e20]
      - navigation [ref=e21]:
        - button "ภาพรวม (Overall)" [ref=e22] [cursor=pointer]:
          - img [ref=e24]
          - generic [ref=e29]: ภาพรวม (Overall)
        - button "เพิ่มงานใหม่ (Add Case)" [ref=e30] [cursor=pointer]:
          - img [ref=e32]
          - generic [ref=e33]: เพิ่มงานใหม่ (Add Case)
        - button "กลับหน้าพอร์ทัล" [ref=e34] [cursor=pointer]:
          - img [ref=e36]
          - generic [ref=e38]: กลับหน้าพอร์ทัล
        - button "คู่มือการใช้งาน" [ref=e39] [cursor=pointer]:
          - img [ref=e41]
          - generic [ref=e44]: คู่มือการใช้งาน
      - button "แดชบอร์ด (Dashboard)" [ref=e46] [cursor=pointer]:
        - img [ref=e48]
        - generic [ref=e50]: แดชบอร์ด (Dashboard)
      - generic [ref=e51]:
        - generic "คลิกเพื่อดูสิทธิ์การใช้งาน" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]: T
          - generic [ref=e54]:
            - paragraph [ref=e55]: Test Admin
            - generic [ref=e56]: QSMS
        - button "Sign Out" [ref=e57]:
          - img [ref=e58]
          - text: Sign Out
    - main [ref=e61]:
      - generic [ref=e63]:
        - generic [ref=e65]:
          - generic [ref=e66]:
            - generic [ref=e67]:
              - paragraph [ref=e68]: วันจันทร์ที่ 20 ก.ค.
              - heading "สวัสดี แผนก QSMS" [level=1] [ref=e69]
            - button [ref=e72]:
              - img [ref=e73]
          - generic [ref=e78]:
            - generic [ref=e79]:
              - paragraph [ref=e80]: จำนวนงานทั้งหมด
              - heading "1" [level=3] [ref=e82]
            - generic [ref=e83]:
              - paragraph [ref=e84]: รอดำเนินการ
              - generic [ref=e85]:
                - heading "1" [level=3] [ref=e86]
                - generic [ref=e87]: 100%
            - generic [ref=e88]:
              - paragraph [ref=e89]: กำลังดำเนินการ
              - heading "0" [level=3] [ref=e91]
            - generic [ref=e92]:
              - paragraph [ref=e93]: เสร็จสิ้น
              - heading "0" [level=3] [ref=e95]
        - generic [ref=e98]:
          - generic [ref=e99]:
            - generic [ref=e100]:
              - heading "รายการงาน Rework ล่าสุด" [level=3] [ref=e101]
              - generic [ref=e102]:
                - generic [ref=e103]:
                  - img [ref=e104]
                  - textbox "ค้นหา..." [ref=e107]
                - button "ตัวกรอง" [ref=e108]:
                  - img [ref=e109]
                  - text: ตัวกรอง
            - generic [ref=e110]:
              - generic [ref=e111]: "สถานะ:"
              - button "ทั้งหมด 1" [ref=e112]:
                - text: ทั้งหมด
                - generic [ref=e113]: "1"
              - button "รอดำเนินการ 1" [ref=e114]:
                - text: รอดำเนินการ
                - generic [ref=e115]: "1"
              - button "กำลังดำเนินการ 0" [ref=e116]:
                - text: กำลังดำเนินการ
                - generic [ref=e117]: "0"
              - button "เสร็จสิ้น 0" [ref=e118]:
                - text: เสร็จสิ้น
                - generic [ref=e119]: "0"
          - generic [ref=e124] [cursor=pointer]:
            - generic [ref=e125]:
              - generic [ref=e126]:
                - generic [ref=e127]: RT084-2026
                - generic [ref=e128]: RT084-2026
              - generic [ref=e129]:
                - generic [ref=e130]: N/A
                - generic [ref=e131]: •
                - generic [ref=e132]:
                  - img [ref=e133]
                  - generic [ref=e135]: 20-07-2026
                - generic [ref=e136]: •
                - generic [ref=e137]: 15:04
                - generic [ref=e138]: •
                - generic [ref=e139]: "แหล่งที่มา: Customer"
                - generic [ref=e140]:
                  - img [ref=e141]
                  - text: ขาดไฟล์ OR
            - generic [ref=e143]:
              - paragraph [ref=e144]: 0 กล่อง
              - generic [ref=e146]:
                - generic [ref=e147]: 0/0
                - generic [ref=e148]: 0%
              - paragraph [ref=e150]: ไม่ระบุ
            - generic [ref=e151]: รอดำเนินการ
        - generic [ref=e152]:
          - generic [ref=e153]: หน้า 1 จาก 1 (1 รายการ)
          - generic [ref=e154]:
            - button "ย้อนกลับ" [disabled] [ref=e155]:
              - img [ref=e156]
            - button "1" [ref=e159]
            - button "ถัดไป" [disabled] [ref=e160]:
              - img [ref=e161]
  - generic [ref=e165]:
    - generic [ref=e166]:
      - generic [ref=e167]:
        - generic [ref=e168]:
          - img [ref=e169]
          - heading "โหมดแก้ไข" [level=1] [ref=e174]
        - paragraph [ref=e175]:
          - generic [ref=e176]: RT084-2026
          - button "คัดลอกไปยังคลิปบอร์ด" [ref=e177]:
            - img [ref=e178]
      - generic [ref=e181]:
        - generic [ref=e182]:
          - button "รอดำเนินการ" [ref=e183]
          - button "กำลังดำเนินการ" [ref=e184]
          - button "เสร็จสิ้น" [ref=e185]
        - button [ref=e186]:
          - img [ref=e187]
        - button "บันทึก" [ref=e190]
    - generic [ref=e191]:
      - generic [ref=e192]:
        - generic [ref=e193]: Source
        - combobox [ref=e194]:
          - option "SFC" [selected]
          - option "Customer"
      - generic [ref=e195]:
        - generic [ref=e196]: Case Number
        - generic [ref=e197]:
          - generic [ref=e198]: RW
          - textbox "084" [ref=e199]
          - generic [ref=e200]: "-26"
      - generic [ref=e201]:
        - generic [ref=e202]: Date
        - generic [ref=e203]: 2026-07-20T08:04:47.697Z
      - generic [ref=e204]:
        - generic [ref=e205]: รายการ
        - generic [ref=e206]: 0 รายการ
    - generic [ref=e208]:
      - generic [ref=e209]:
        - generic [ref=e210]:
          - img [ref=e211]
          - heading "เอกสาร OR" [level=3] [ref=e213]
        - generic [ref=e215] [cursor=pointer]: + เพิ่มไฟล์ OR
      - generic [ref=e217]:
        - img [ref=e218]
        - generic [ref=e221]: รายการสินค้า (0)
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Rework Portal - Case Update', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.route('/api/auth/me', async route => {
  6   |       await route.fulfill({
  7   |         json: {
  8   |           success: true,
  9   |           data: {
  10  |             user: {
  11  |               email: 'test@example.com',
  12  |               name: 'Test Admin',
  13  |               role: 'QSMS'
  14  |             }
  15  |           }
  16  |         }
  17  |       });
  18  |     });
  19  | 
  20  |     // Mock initial list of cases and updates
  21  |     await page.route('/api/rework', async route => {
  22  |       const method = route.request().method();
  23  |       if (method === 'POST') {
  24  |         const body = JSON.parse(route.request().postData() || '{}');
  25  |         
  26  |         if (body.action === 'fetchAllCases') {
  27  |           await route.fulfill({
  28  |             json: {
  29  |               success: true,
  30  |               data: [{
  31  |                 id: 'RT084-2026',
  32  |                 caseName: 'RT084-2026',
  33  |                 source: 'Customer',
  34  |                 date: new Date().toISOString(),
  35  |                 status: 'Pending',
  36  |                 items: [],
  37  |                 orFilesUrls: []
  38  |               }]
  39  |             }
  40  |           });
  41  |         } else if (body.action === 'updateCaseStatus' || body.action === 'updateCase') {
  42  |           await route.fulfill({
  43  |             json: {
  44  |               success: true,
  45  |               message: 'Google Sheets sync failed: fetch failed',
  46  |               data: {
  47  |                 caseId: body.updates?.caseName 
  48  |                   ? body.updates.caseName
  49  |                   : 'RT084-2026',
  50  |                 status: 'Pending',
  51  |                 orFilesUrls: []
  52  |               }
  53  |             }
  54  |           });
  55  |         } else {
  56  |           await route.fulfill({
  57  |             json: { success: true, data: {} }
  58  |           });
  59  |         }
  60  |       } else {
  61  |         await route.continue();
  62  |       }
  63  |     });
  64  | 
  65  |     // Bootstrapping view state via sessionStorage before app mounts
  66  |     await page.goto('/');
  67  |     await page.evaluate(() => {
  68  |       sessionStorage.setItem('currentView', 'rework');
  69  |     });
  70  |     await page.reload();
  71  |   });
  72  | 
  73  |   test('should allow admin to edit case name and source', async ({ page }) => {
  74  |     // 1. Wait for cases to load and click on the mocked case
  75  |     const caseCard = page.locator('text=RT084-2026').first();
  76  |     await expect(caseCard).toBeVisible();
  77  |     await caseCard.click();
  78  | 
  79  |     // 2. Expect modal to open
  80  |     await expect(page.locator('text=Update Status')).toBeVisible();
  81  |     await expect(page.locator('text=RT084-2026').first()).toBeVisible();
  82  | 
  83  |     // 3. Enter Edit Mode
  84  |     await page.getByRole('button', { name: 'แก้ไข' }).click();
  85  | 
  86  |     // 4. Check if dropdown for Source exists and change it to SFC
  87  |     const sourceDropdown = page.locator('select').first();
  88  |     await expect(sourceDropdown).toBeVisible();
  89  |     await sourceDropdown.selectOption('SFC');
  90  | 
  91  |     // 5. Change case number from 084 to 999
  92  |     const nameInput = page.locator('input[placeholder="เช่น 084"]');
> 93  |     await nameInput.fill('999');
      |                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  94  | 
  95  |     // 6. Handle the alert that will pop up
  96  |     page.on('dialog', async dialog => {
  97  |       expect(dialog.message()).toContain('บันทึกข้อมูลสำเร็จ แต่ไม่สามารถซิงค์ไปยัง Google Sheets ได้');
  98  |       await dialog.accept();
  99  |     });
  100 | 
  101 |     // 7. Click save
  102 |     await page.getByRole('button', { name: 'บันทึก' }).click();
  103 | 
  104 |     // 8. The modal should close
  105 |     await expect(page.locator('text=Update Status')).not.toBeVisible();
  106 |   });
  107 | });
  108 | 
```