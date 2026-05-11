const { chromium } = require('playwright');

async function verifyRole(role, password, expectedTabs, unexpectedTabs) {
  console.log(`\n--- Testing Role: ${role} ---`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.new_context();
  const page = await context.new_page();

  try {
    await page.goto('http://localhost:3000');
    
    // Login
    await page.selectOption('select', role);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("เข้าสู่ระบบ")');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    const content = await page.textContent('body');
    
    for (const tab of expectedTabs) {
      const isVisible = await page.isVisible(`button:has-text("${tab}")`) || await page.isVisible(`div:has-text("${tab}")`);
      console.log(`[ASSERT] Tab "${tab}" visible: ${isVisible ? 'PASS' : 'FAIL'}`);
    }
    
    for (const tab of unexpectedTabs) {
      const isVisible = await page.isVisible(`button:has-text("${tab}")`) || await page.isVisible(`div:has-text("${tab}")`);
      console.log(`[ASSERT] Tab "${tab}" hidden: ${!isVisible ? 'PASS' : 'FAIL'}`);
    }

  } catch (e) {
    console.log(`Error: ${e.message}`);
  } finally {
    await browser.close();
  }
}

async function run() {
  // QSMS: Overall, Add Case, Dashboard
  await verifyRole('QSMS', 'Qsms123', 
    ['ภาพรวม (Overall)', 'เพิ่มงานใหม่ (Add Case)', 'แดชบอร์ด (Dashboard)'], 
    []
  );
  
  // WFG: Overall, Add Case
  await verifyRole('WFG', 'Wfg123', 
    ['ภาพรวม (Overall)', 'เพิ่มงานใหม่ (Add Case)'], 
    ['แดชบอร์ด (Dashboard)']
  );
  
  // FINANCE: Overall
  await verifyRole('FINANCE', 'Finance123', 
    ['ภาพรวม (Overall)'], 
    ['เพิ่มงานใหม่ (Add Case)', 'แดชบอร์ด (Dashboard)']
  );
}

run();
