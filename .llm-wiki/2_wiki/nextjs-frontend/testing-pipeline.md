# 🧪 Testing Pipeline — Vitest & Playwright Setup

ระบบการทดสอบ (Testing Pipeline) ของ QSMS Rework & Roster Management ถูกจัดตั้งขึ้นเพื่อรองรับการตรวจหาข้อผิดพลาดของโค้ดอย่างครอบคลุม ทั้งในระดับหน่วยย่อย (Unit Testing), การตรวจความเชื่อมโยงระบบ (Integration Testing), และการจำลองเสมือนจริงของฝั่งผู้ใช้ (End-to-End Testing)

---

## 🏗️ โครงสร้างระบบทดสอบ (Testing Stack)

ระบบการทดสอบแบ่งออกเป็น 2 เลเยอร์หลัก:
1.  **Vitest + React Testing Library:** สำหรับการทำ Unit Testing และ Integration Testing เพื่อทดสอบฟังก์ชันช่วยเหลือ (Helpers), โมเดลความถูกต้องของข้อมูล (Validation), และ Auth Service logic
2.  **Playwright:** สำหรับการทำ End-to-End (E2E) Testing เพื่อจำลองการทำงานของผู้ใช้บนเบราว์เซอร์จริง เช่น การกรอกฟอร์มล็อกอิน, การเปิดแอปย่อย, และการกรอกฟอร์มส่งข้อมูล Rework

---

## 📂 โครงสร้างโฟลเดอร์ไฟล์ทดสอบ

```
QSMS_project/
├── e2e/                           # โฟลเดอร์ E2E Tests (Playwright)
│   ├── auth.spec.ts               # ทดสอบระบบ Authentication & Guest Mode
│   ├── home.spec.ts               # ทดสอบการเรนเดอร์หน้าแรกเบื้องต้น
│   └── rework.spec.ts             # ทดสอบ Flow การใช้งาน Rework App และส่งแบบฟอร์ม
├── src/                           # โครงสร้างหลักโค้ดแอปพลิเคชัน
│   ├── services/
│   │   ├── auth.test.ts           # ทดสอบ Session management & Proxy API calls
│   │   └── validation.test.ts     # ทดสอบ Validation rules ทั้งหมดสำหรับฟอร์ม
│   └── utils/
│       └── helpers.test.ts        # ทดสอบการคำนวณสถิติและการจัดเรียงเคสตามสถานะ
├── playwright.config.ts           # การตั้งค่า Playwright E2E
├── vitest.config.ts               # การตั้งค่า Vitest
└── vitest-setup.ts                # ไฟล์ติดตั้ง Setup สำหรับ DOM environment
```

---

## 🧪 การทดสอบแต่ละส่วน

### 1. Unit & Integration Tests (Vitest)
มีทั้งหมด **51 Test Cases** ครอบคลุมการทำงานภายใน:
*   **ฟังก์ชันช่วยเหลือ (Helpers):** ทดสอบใน `helpers.test.ts`
    *   การประมวลผลคำนวณสถิติ เช่น ผลรวมเคส, อัตราความสำเร็จ (Completion Rate)
    *   การกรองข้อมูล และระบบการจัดเรียงสถานะ โดยเรียง `Pending` ขึ้นเป็นอันดับแรกสุด ตามด้วย `In-Progress`, `Awaiting Valuation` และ `Completed` ตามลำดับ (ได้รับการแก้ไขในรอบการอัปเดตล่าสุด)
*   **การวินิจฉัยฟอร์ม (Validation Rules):** ทดสอบใน `validation.test.ts`
    *   การตรวจสอบรหัสสินค้า (Item Code ต้องเป็นตัวเลขเท่านั้น)
    *   การตรวจสอบหมายเลขสินค้า (Item Number บาร์โค้ด)
    *   การตรวจสอบฟิลด์บังคับ เช่น ปริมาณ, สาเหตุที่พบ, และผู้รับผิดชอบ
*   **บริการลงทะเบียน (Authentication Services):** ทดสอบใน `auth.test.ts`
    *   การตรวจสอบสิทธิ์บทบาทผู้ใช้ (Role-based Access Control) เช่น Finance ห้ามเข้าหน้า Add Case, WFG ห้ามเข้าหน้า Dashboard
    *   ระบบการรักษา Token และ Session ใน `sessionStorage`

### 2. End-to-End Tests (Playwright)
จำลองผู้ใช้งานจริงบน Chromium เบราว์เซอร์ โดยจำลองสภาพแวดล้อม API ผ่าน `page.route` เพื่อตัดการเชื่อมต่อกับ Google Sheets/Supabase จริง ทำให้รันทดสอบได้รวดเร็วและเป็นอิสระ:
*   **ระบบ Authentication (`auth.spec.ts`):** 
    *   ตรวจสอบความถูกต้องของหน้าผู้มาเยือน (Guest Mode)
    *   ทดสอบล็อกอินด้วยข้อมูลที่ผิดพลาดและตรวจข้อความแจ้งเตือนสีแดง
    *   ทดสอบล็อกอินด้วย PIN บัญชี `QSMS` (PDB/Operator Role) และตรวจเช็คโปรไฟล์หลังเข้าสู่ระบบสำเร็จ
    *   ทดสอบการทำงานของปุ่ม Sign Out
*   **ระบบ Rework Operations Flow (`rework.spec.ts`):**
    *   จำลองการสลับหน้าไปที่โมดูล **QSMS Rework** หลังเข้าสู่ระบบสำเร็จ
    *   การกรอกรายละเอียดสินค้า
    *   การกดตรวจสอบข้อมูลสินค้า (Verify Item API) เพื่อทดสอบฟีเจอร์ดึงข้อมูลชื่อสินค้าอัตโนมัติ (Autofill)
    *   การเลือกรายละเอียดเพิ่มเติมผ่านโมดอล เช่น สาเหตุการรั่วซึม และฝ่าย PDB เป็นผู้รับผิดชอบ
    *   กดส่งข้อมูลและตรวจดูการแจ้งเตือน "บันทึกสำเร็จ"

---

## 💻 คำสั่งสำหรับการรันทดสอบ (Execution Commands)

คุณสามารถเรียกใช้คำสั่งเหล่านี้ใน Terminal ของคุณ:

*   **รัน Unit & Integration Tests ทั้งหมด:**
    ```bash
    npm run test
    ```
    *สำหรับทดสอบทีละไฟล์ หรือแบบ interactive UI:*
    ```bash
    npx vitest src/services/validation.test.ts
    ```

*   **รัน End-to-End Tests ทั้งหมด:**
    ```bash
    npm run test:e2e
    ```
    *สำหรับเปิด Playwright UI Mode สำหรับดีบั๊กสเต็ปบนเบราว์เซอร์:*
    ```bash
    npx playwright test --ui
    ```

---

## 🛠️ Lessons Learned & Best Practices
*   **การทดสอบ E2E ด้วยระบบ Mock Route:** หลีกเลี่ยงการเชื่อมต่อ API ด้านหลังจริงโดยตรงเพื่อหลีกเลี่ยงผลกระทบต่อข้อมูลใน Google Sheets โดยใช้ `await page.route('**/api/rework', ...)`
*   **สัญญะของตัวชี้วัด (Ambiguous Selectors):** ควรระบุขอบเขตคอนเทนเนอร์ที่ชัดเจนเมื่อทำ E2E เช่น การใช้ `page.locator('div.space-y-2:has-text("ผู้รับผิดชอบ") button:has-text("เลือก")')` แทนการใช้ XPath คลำทางแบบเดิม เพื่อลดความคลุมเครือจากการมีปุ่มชื่อเดียวกันบนหน้าเว็บเดียวกัน
