# Title: Box Number Binding & JWT E2E Mock Validation Fixes
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
พบและแก้ไขปัญหาในส่วนของ UI State Binding และ Testing ดังนี้:
1. **Box Number State Mismatch:** ช่องกรอกข้อมูล "เลขกล่อง (Box Number)" ในหน้า Add Case ถูกผูก State เข้ากับ `item.packagingDate` แทนที่จะเป็น `item.boxNumber` ส่งผลให้ไม่ผ่านการตรวจสอบข้อมูลเนื่องจาก `boxNumber` เป็นฟิลด์บังคับ (Required) ทำให้ปุ่มบันทึกโดน Disable ถาวร ได้แก้ไขให้ผูกกับ `item.boxNumber` ให้ถูกต้อง
2. **Legacy UserRole.PDB in Tests:** โค้ดทดสอบ Unit Test (`auth.test.ts`) ยังคงอ้างอิงถึงบทบาท `UserRole.PDB` ซึ่งเดิมถูกนำออกและยุบรวมเข้ากับ `UserRole.OPERATOR` ไปแล้ว ได้แก้ไขให้เรียกใช้ `UserRole.OPERATOR` ให้สอดคล้องกัน
3. **Invalid Mock JWT in E2E:** ระบบ Backend/Next.js API proxy มีการถอดรหัส Token และพบว่าในการทดสอบ E2E มีการส่ง mock token เป็น `'mock.jwt.token'` ซึ่งมีรูปแบบไม่ถูกต้อง ส่งผลให้การถอดรหัสด้วย `atob` แครชและเกิด Error 500 บน WebServer ได้เปลี่ยน mock token ให้เป็น JWT mock ที่มีรูปแบบ base64 payload ที่สมบูรณ์
4. **Stale Verification Check in E2E:** E2E test ได้ทำการกรอกบาร์โค้ดแล้วกรอกรหัสสินค้าทีหลัง ซึ่งทำให้ `lastActiveField` ของแบบฟอร์มกลายเป็น `itemCode` แต่ในขั้นตอนกดตรวจสอบ ข้อมูลทดสอบดันไปสั่งคลิกปุ่มของบาร์โค้ดแทน ทำให้ระบบคัดกรองทิ้งเป็นผลลัพธ์ที่หมดอายุ (Stale) ได้ปรับปรุงให้ E2E test กดตรวจสอบทางฝั่งปุ่มรหัสสินค้าแทนเพื่อให้สัมพันธ์กับฟิลด์ล่าสุด

## 2. Technical Code Snippet (Best Practice)
```tsx
// การผูก State ที่ถูกต้องสำหรับ Box Number
<InputField
  label="เลขกล่อง (Box Number) *"
  type="text"
  value={item.boxNumber || ''}
  onChange={(v) => updateFormItem(item.id, 'boxNumber', v)}
  placeholder="เช่น 001"
  disabled={isSaving}
/>
```

```typescript
// รูปแบบ Mock JWT Token ที่ถูกต้องสำหรับทดสอบ E2E เพื่อให้ถอดรหัส Base64 สำเร็จ
const mockJwt = 'header.eyJzdWIiOiJxc21zQGV4YW1wbGUuY29tIiwicHJvZmlsZSI6Im9wZXJhdG9yIn0=.signature';
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[nextjs-frontend/rework-module.md]] (โครงสร้างแบบฟอร์มและการ Verify)

Impacted By (ได้รับผลกระทบจาก): [[lessons-learned/rbac-casing-and-e2e.md]] (การยุบรวม Role PDB เป็น OPERATOR)

Contradicts (ข้อขัดแย้งที่เคยพบ): ในอดีตไม่ได้มีการถอดรหัส Base64 ของ JWT token ที่ฝั่ง Next.js API Middleware แต่ปัจจุบันมีการตรวจสอบอย่างละเอียด จึงไม่สามารถส่ง raw string ทั่วไปเป็น Token ใน E2E ได้
