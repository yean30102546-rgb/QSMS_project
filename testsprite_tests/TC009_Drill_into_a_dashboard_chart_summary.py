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
        
        # -> Fill the username and password fields and submit the login form to reach the dashboard.
        # text input placeholder="Enter Username"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QSMS")
        
        # -> Fill the username and password fields and submit the login form to reach the dashboard.
        # password input placeholder="Enter Password"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div[2]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Qsms123")
        
        # -> Fill the username and password fields and submit the login form to reach the dashboard.
        # button "เข้าสู่ระบบ"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click a dashboard summary/card element to open its drill-down summary and verify the summary panel and details appear.
        # button
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div/header/div[2]/div/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click the 'รอดำเนินการ' status filter button to update the dashboard list (interactive element index 248) and then inspect the page for any drill-down or summary details.
        # button "รอดำเนินการ
18"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div/div[2]/button[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click the first rework list item to open its drill-down summary and verify that the related summary panel and drill-down details appear.
        # "M_PTT_GL-5_80W-90_NP_(45L)
7 วัน
29 เม.ย..."
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div[2]/div/div/div[3]/div/div/div/div").nth(0)
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
    