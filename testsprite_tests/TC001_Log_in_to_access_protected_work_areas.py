import asyncio
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
                "--disable-dev-shm-usage"
            ],
        )

        context = await browser.new_context()
        context.set_default_timeout(15000)

        page = await context.new_page()

        print("Navigating to http://localhost:3000")
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
            
        print("Clicking login on portal...")
        # The login button on portal is the first button
        portal_login_btn = page.locator("header button").first
        await portal_login_btn.wait_for(state="visible", timeout=10000)
        await portal_login_btn.click()
        
        # Wait for the login page to animate in
        await page.wait_for_timeout(1000)
        
        # Fill username
        username_input = page.get_by_placeholder("Username")
        await username_input.wait_for(state="visible", timeout=10000)
        await username_input.fill("QSMS")
        
        # Fill password
        password_input = page.get_by_placeholder("Password")
        await password_input.wait_for(state="visible", timeout=10000)
        await password_input.fill("Qsms123")
        
        # Click login button (the submit button)
        login_btn = page.locator("button[type='submit']")
        await login_btn.wait_for(state="visible", timeout=10000)
        await login_btn.click()
        
        # Verify authenticated area (e.g. portal apps appear)
        print("Waiting for Portal or Rework App to load...")
        # After login, it should show Central Workspace apps and the 'ออกจากระบบ' (Sign Out) button
        logout_btn = page.locator("button:has-text('ออกจากระบบ')")
        await expect(logout_btn).to_be_visible(timeout=15000)
        
        current_url = await page.evaluate("() => window.location.href")
        print(f"Login successful, current URL: {current_url}")
        
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

if __name__ == "__main__":
    asyncio.run(run_test())