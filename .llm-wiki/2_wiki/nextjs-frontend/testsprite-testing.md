# Testsprite Testing (Autonomous Testing Spec)
[วันที่อัปเดต: 2026-05-23]

## 1. Summary & Current Implementation
**Testsprite Testing** คือระบบและแผนการทดสอบอัตโนมัติแบบจำลองผู้ใช้จริง (Autonomous & E2E Testing) ที่ออกแบบมาเพื่อตรวจสอบ "Golden Path" และสิทธิ์การใช้งาน (RBAC) ของระบบจัดการ Rework QSMS โดยตัวการทดสอบเขียนขึ้นด้วยภาษา Python และใช้ห้องสมุด **Playwright** แบบอะซิงโครนัสในการขับเคลื่อนเบราว์เซอร์ Chromium ในโหมด headless เพื่อจำลองเวิร์กโฟลว์ผู้ใช้

ขอบเขตการทดสอบครอบคลุม:
1. การแยกแยะสิทธิ์เข้าถึง (RBAC) 3 บทบาทหลัก:
   - **Admin/QSMS**: เข้าถึงได้ทุกฟังก์ชัน (Dashboard, Add, Overall, Update, Delete)
   - **WFG (Warehouse)**: ดู Overall, เพิ่มเคส, อัปเดต Resolution
   - **Finance**: ดู Overall และอัปเดต Rework Cost ได้เท่านั้น (ห้ามเข้า Dashboard/Add Case)
2. การสร้างเคส Rework แบบหลายรายการเชื่อมโยงกัน (Multi-item & Cross-Item Linkage)
3. การตรวจสอบความถูกต้องของข้อมูล (Validation ของ Batch No. ต้องเป็นตัวเลข)
4. การเปลี่ยนสถานะตามเวิร์กโฟลว์โดยอัตโนมัติ (Pending → In-Progress → Awaiting Valuation → Completed)

---

## 2. Technical Code Snippet (Best Practice)

### ตัวอย่างสคริปต์ทดสอบ Playwright Python (จาก `testsprite_tests/RBAC001_...py`)
```python
import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    try:
        # เปิด session Playwright
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=["--window-size=1280,720", "--disable-dev-shm-usage", "--single-process"]
        )
        context = await browser.new_context()
        context.set_default_timeout(15000)  # ตั้งค่า timeout ป้องกันการติดกับดัก DOM desync
        page = await context.new_page()

        # ไปยังเว็บแอปพลิเคชัน
        await page.goto("http://localhost:3000")
        
        # กรอกข้อมูล Login
        await page.locator("xpath=/html/body/div/div/div[2]/div/form/div/input").nth(0).fill("QSMS")
        await page.locator("xpath=/html/body/div/div/div[2]/div/form/div[2]/div/input").nth(0).fill("Qsms123")
        await page.locator("xpath=/html/body/div/div/div[2]/div/form/button").nth(0).click()

        # รอหน้าจออัปเดตและตรวจ URL
        await asyncio.sleep(2)
        current_url = await page.evaluate("() => window.location.href")
        assert "localhost" in current_url, "Login failed"
        
    finally:
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
```

---

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[nextjs-frontend/testing-pipeline.md]] — ระบบการทดสอบโดยรวมและการทำ Mock API ใน E2E
- **Depends On**: [[nextjs-frontend/roles.md]] — ข้อกำหนดสิทธิ์และบทบาทผู้ใช้ในการใช้งาน
- **Impacted By**: [[lessons-learned/bugs-and-fixes.md]] — การแก้ไขบกพร่องเรื่อง Validation บาร์โค้ด สินค้า และการจัดเรียงสถานะ (BUG-011)

---
> 🔄 *สร้างเมื่อ 2026-05-23*: Ingested แผนทดสอบและวิธีรันจาก `1_raw/testsprite_spec.md` และประมวลจากชุดทดสอบจริงในโฟลเดอร์ `testsprite_tests/`
