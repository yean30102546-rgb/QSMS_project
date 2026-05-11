import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )
        context = await browser.new_context()
        context.set_default_timeout(15000)
        page = await context.new_page()
        # -> navigate
        await page.goto("http://localhost:4173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill username 'QSMS' and password 'Qsms123', then submit the login form.
        # text input placeholder="Enter Username"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QSMS")
        
        # -> Fill username 'QSMS' and password 'Qsms123', then submit the login form.
        # password input placeholder="Enter Password"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div[2]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Qsms123")
        
        # -> Fill username 'QSMS' and password 'Qsms123', then submit the login form.
        # button "เข้าสู่ระบบ"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Search for 'RW2604291352' in the search box, apply the status filter 'รอดำเนินการ', and open the matching case to verify the case detail view.
        # text input placeholder="ค้นหา..."
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div/div/div/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("RW2604291352")
        
        # -> Search for 'RW2604291352' in the search box, apply the status filter 'รอดำเนินการ', and open the matching case to verify the case detail view.
        # button "รอดำเนินการ
18"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div/div[2]/button[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Search for 'RW2604291352' in the search box, apply the status filter 'รอดำเนินการ', and open the matching case to verify the case detail view.
        # "M_VALVOLINE ALL FLEET PREMIUM 15W-40 CI-..."
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div[2]/div/div/div/div[1]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Clear all filters so the case list is visible, then re-run the search and open the matching case detail.
        # button "ล้างตัวกรองทั้งหมด"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div[3]/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click the matching case entry (the visible case card for RW2604291352) to open the case detail view, then verify the detail view shows the same case number RW2604291352.
        # "M_VALVOLINE ALL FLEET PREMIUM 15W-40 CI-..."
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        await asyncio.sleep(5)
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    