# Title: ปัญหา Case ID ถูกแทนที่โดย Google Apps Script Backend
[วันที่อัปเดต: 2026-05-27]

## 1. Summary & Current Implementation
พบปัญหาว่าเมื่อผู้ใช้บันทึกเคสโดยกำหนดรหัสเคสเองผ่าน UI หน้าบ้าน (เช่น `RT012-2026`) รหัสที่บันทึกสำเร็จกลับกลายเป็นตัวเลข 18 หลัก (เช่น `RW2605271051...`) 
สาเหตุเกิดจาก GAS Backend (`gas/Code.gs`) มีฟังก์ชัน `generateCaseId()` ที่ทำการสร้าง ID ใหม่อัตโนมัติและแทนที่ ID ที่ส่งมาจาก Frontend เสมอ
การแก้ไขคือ ส่งค่า `caseId` ใน `route.ts` และปรับให้ `Code.gs` ตรวจสอบ `payload.caseId` ก่อน หากมีค่าส่งมาให้ใช้ค่านั้นแทนการสร้างใหม่

## 2. Technical Code Snippet (Best Practice)
```javascript
// ใน gas/Code.gs เมื่อทำการบันทึก
// Use custom case ID if provided, otherwise generate a unique one.
const caseId = payload.caseId || generateCaseId(existingCaseIds);

if (existingCaseIds.has(caseId)) {
  if (lock) { lock.releaseLock(); lock = null; }
  return { success: false, error: 'Case ID already exists: ' + caseId, errorCode: 'DUPLICATE_CASE_ID' };
}
```

```typescript
// ใน src/app/api/rework/route.ts เราต้องระบุ caseId ลงไปใน payload ก่อนส่งไป proxyToGAS
const gasPayload = {
  ...body,
  action: 'insert',
  items: caseData.items,
  source: caseData.source,
  orFiles: caseData.orFiles,
  caseId: caseData.id // ต้องเพิ่มบรรทัดนี้
};
```

## 3. Knowledge Relationships
- **Depends On**: `gas/Code.gs` สำหรับการตรวจสอบสิทธิ์และ insert ข้อมูล
- **Depends On**: `src/app/api/rework/route.ts` เป็น Proxy ส่งต่อข้อมูลไปยัง GAS
- **Impacted By**: การแก้ไของค์ประกอบนี้ฝั่ง Frontend จะไม่มีผลจนกว่าผู้ใช้จะคัดลอกโค้ดจาก `gas/Code.gs` ไปอัปเดตและ Deploy ใน Google Apps Script Environment ใหม่
