# Title: Backend and Frontend Validation Alignment (Optional Fields)
[วันที่อัปเดต: 2026-05-27]

## 1. Summary & Current Implementation
พบปัญหาผู้ใช้งานบันทึกเคสไม่สำเร็จและได้รับข้อความ `Google Drive sync failed: Validation failed for X item(s)` จากฝั่ง Backend สาเหตุเกิดจากความไม่สอดคล้องกัน (Mismatch) ของกฎการตรวจสอบความถูกต้องระหว่าง Frontend และ Backend โดยที่ Frontend (`validation.ts`) อนุญาตให้บางฟิลด์เว้นว่างได้ (Optional) เช่น เลขกล่อง หรือ แบทช์ แต่ Backend (`Code.gs`) บังคับให้ต้องกรอกข้อมูล (Required)

การแก้ไขคือปรับโค้ดในฟังก์ชันการตรวจสอบของ `Code.gs` (เช่น `validateBatchNo`, `validateBoxNumber`, `validateItemNumber`, และ `validateAmount`) ให้ส่งคืน `{ valid: true }` หากข้อมูลเป็นค่าว่าง เพื่อให้สอดคล้องกับโครงสร้างและพฤติกรรมบน Frontend 100%

## 2. Technical Code Snippet (Best Practice)
```javascript
// ตัวอย่างการทำ Optional Field ในฝั่ง Backend (gas/Code.gs)
function validateBoxNumber(boxNumber) {
  if (!boxNumber || String(boxNumber).trim() === '') {
    return { valid: true }; // อนุญาตให้เป็นค่าว่างได้ (Optional) ตามที่ Frontend กำหนด
  }
  
  const str = String(boxNumber).trim();
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'เลขกล่อง (Box Number) ต้องเป็นตัวเลขเท่านั้น' };
  }
  
  return { valid: true };
}
```

## 3. Knowledge Relationships
Depends On: [[duplicate-items-validation.md]] (มักพบปัญหานี้ร่วมกันเมื่อผู้ใช้งานตั้งใจเว้นฟิลด์เพื่อทดสอบฟอร์ม)

Impacted By: [[nextjs-frontend/rework-module.md]]

Contradicts: ในอดีต Backend เข้มงวดบังคับกรอกทุกฟิลด์ ทำให้ข้อมูลไม่สอดคล้องกับการออกแบบของ Client ที่อนุญาตให้เว้นว่างได้
