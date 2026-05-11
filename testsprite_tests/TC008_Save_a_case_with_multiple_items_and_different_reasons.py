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
        
        # -> Fill the username and password fields, then submit the login form.
        # text input placeholder="Enter Username"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QSMS")
        
        # -> Fill the username and password fields, then submit the login form.
        # password input placeholder="Enter Password"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/div[2]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Qsms123")
        
        # -> Fill the username and password fields, then submit the login form.
        # button "เข้าสู่ระบบ"
        elem = page.locator("xpath=/html/body/div/div/div[2]/div/form/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Open the 'เพิ่มงานใหม่ (Add Case)' form by clicking the Add Case button.
        # button "เพิ่มงานใหม่ (Add Case)"
        elem = page.locator("xpath=/html/body/div/div/aside/nav/button[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Open the 'เพิ่มงานใหม่ (Add Case)' form and observe all visible fields so the items can be added.
        # button "เพิ่มงานใหม่ (Add Case)"
        elem = page.locator("xpath=/html/body/div/div/aside/nav/button[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Fill the first item's Item Number field with a valid item number, then select the reason 'รั่ว' for that item.
        # text input placeholder="เช่น 60001234A"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div/div[3]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("60001234A")
        
        # -> Click the '+ เพิ่มรายการ' button to add a second item (Item 2).
        # button "[ + ] เพิ่มรายการ"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div[2]/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Fill the second item's Item Number field (Item 2) with a different valid item number so the item can be completed.
        # text input placeholder="เช่น 60001234A"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div[2]/div[3]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("60005678B")
        
        # -> Fill the second item's Item Number field (Item 2) with a different valid item number so the item can be completed.
        # text input placeholder="เช่น Bottle Plastic 250ml"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div/div[4]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Bottle Plastic 250ml")
        
        # -> Fill the second item's Item Number field (Item 2) with a different valid item number so the item can be completed.
        # text input placeholder="เช่น 240510"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div/div[4]/div[4]/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("240511")
        
        # -> Fill the second item's Item Number field (Item 2) with a different valid item number so the item can be completed.
        # text input placeholder="เช่น Bottle Plastic 250ml"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div[2]/div[4]/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Cap Plastic 10mm")
        
        # -> Fill Item 2 Batch no. field, set Item 2 Responsible to 'SFC', then submit (click Save).
        # text input placeholder="เช่น 240510"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div[2]/div[4]/div[4]/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("240512")
        
        # -> Fill Item 2 Batch no. field, set Item 2 Responsible to 'SFC', then submit (click Save).
        # button "บันทึกข้อมูลเข้าสู่ระบบ"
        elem = page.locator("xpath=/html/body/div/div/main/div[2]/div/div/div[2]/div[2]/div[3]/button[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # --> Test failed (AST guard fallback)
        raise AssertionError("Test failed during agent run: " + "TEST FAILURE Saving the case did not work \u2014 the Save button was not enabled and no confirmation or navigation occurred. Observations: - The Add Case form remained visible with both items filled. - The \"\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\" (Save) button is disabled. - No success message or redirect to a saved-case view was observed.")
        await asyncio.sleep(5)
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    