# Title: RBAC Enum Casing & Playwright Locators
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
การเปลี่ยนค่า Enum ของ `UserRole` เป็น Uppercase (เช่น `OPERATOR`, `FINANCE`) ทำให้เกิด Type Error ตอนรัน `npm run build` เนื่องจาก React components เดิมเช็คด้วยตัวพิมพ์เล็ก ต้องปรับเปลี่ยนทั้งหมดให้ตรงกับ Enum ปัจจุบัน
นอกจากนี้ได้ทำการลบบทบาท `ADMIN`, `WFG`, และ `PDB` โดยสิทธิ์แอดมินทั้งหมดไปอยู่ที่ `QSMS` ส่วนบทบาท `WFG` และ `PDB` ถูกทำระบบ Legacy Alias แมปสิทธิ์การทำงานย้อนหลังไปที่ `OPERATOR` แทนเพื่อความเข้ากันได้ของบัญชีเดิม ฝั่ง Playwright E2E Tests ที่ใช้ XPath (เช่น `/html/body/...`) พังเมื่อ UI เปลี่ยนเป็นสไตล์ Apple-Glassmorphism ให้เปลี่ยนมาใช้ Semantic Locators เพื่อความทนทาน (เช่น `get_by_placeholder`, `get_by_role`) และต้องเพิ่มการ Click 'เข้าสู่ระบบ' ที่ Workspace Portal ก่อน

## 2. Technical Code Snippet (Best Practice)
```typescript
// การเช็ค Role ด้วย Uppercase Enum และการรวมสิทธิ์ไปที่ QSMS
if (activeTab === 'dashboard' && userRole !== 'QSMS') {
  setActiveTab('overall');
}
```

```python
# Playwright: Semantic Locators
portal_login_btn = page.locator("header button").first
await portal_login_btn.click()

username_input = page.get_by_placeholder("Username")
await username_input.fill("QSMS")

login_btn = page.locator("button[type='submit']")
await login_btn.click()
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): ไม่มี (นี่คือการตั้งค่าหลักของ Role ในระบบ)
Impacted By (ได้รับผลกระทบจาก): การเปลี่ยน Design System จาก UI ธรรมดาเป็น Apple-Glassmorphism (กระทบ XPath ของ E2E Tests)
Contradicts (ข้อขัดแย้งที่เคยพบ): ในอดีต Component อาศัย Lowercase role (เช่น `finance`) ตอนนี้ต้องใช้ Uppercase ทั้งหมด (`FINANCE`) เพื่อป้องกัน Type Overlap Errors
