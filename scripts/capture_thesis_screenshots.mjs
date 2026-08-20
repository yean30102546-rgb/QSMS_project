import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const assetsDir = path.resolve('c:/Workplace/Mytask/Projects/QSMS_project/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('Launching browser with correct auth format...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // Mock /api/auth/me matching exact structure expected by restoreSession()
  await page.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'admin-id-1',
            name: 'สพลฎณัย ชัยพงษ์',
            email: 'sapondanai@pim.ac.th',
            role: 'QSMS',
            department: 'Quality Assurance'
          }
        }
      })
    });
  });

  // 1. Workspace Portal
  console.log('1. Capturing Workspace Portal...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => sessionStorage.setItem('currentView', 'portal'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(assetsDir, 'ui_workspace.png') });

  // 2. Rework Module
  console.log('2. Capturing Rework Module...');
  await page.evaluate(() => sessionStorage.setItem('currentView', 'rework'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(assetsDir, 'ui_rework.png') });

  // 3. Storage / Drawings Module
  console.log('3. Capturing Drawings & Master Module...');
  await page.evaluate(() => sessionStorage.setItem('currentView', 'storage'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(assetsDir, 'ui_drawings.png') });

  // 4. DocAI RAG Module
  console.log('4. Capturing DocAI RAG Module...');
  await page.evaluate(() => sessionStorage.setItem('currentView', 'rag'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(assetsDir, 'ui_rag.png') });

  // 5. Guide / Presentation Deck Module
  console.log('5. Capturing Guide Presentation Deck...');
  await page.evaluate(() => sessionStorage.setItem('currentView', 'guide'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(assetsDir, 'ui_guide.png') });

  await browser.close();
  console.log('All real UI screenshots successfully captured with authentic layouts!');
}

captureScreenshots().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
