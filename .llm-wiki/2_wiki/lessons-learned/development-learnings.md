# Development Learnings (React, Next.js, & Google Apps Script)
[วันที่อัปเดต: 2026-05-23]

## 1. Summary & Current Implementation
เอกสารนี้รวบรวมแนวคิดและวิธีแก้ไขปัญหาสำคัญที่พบในกระบวนการพัฒนาระบบ QSMS Rework & ShiftHub Roster ครอบคลุมทั้งฝั่ง Frontend (React 19, Next.js, Tailwind v4) และ Backend (Google Apps Script, Google Sheets Database) เพื่อป้องกันการเกิดปัญหาซ้ำซ้อนในการปรับปรุงระบบครั้งหน้า

---

## 2. Technical Code Snippets (Best Practices)

### การจัดการอินพุตตัวเลขเพื่อหลีกเลี่ยง NaN และลบค่าเหลือว่างใน React Form
```typescript
// หลีกเลี่ยงค่า NaN แสดงบนจอและคงสภาพ UI ที่ตอบสนองลื่นไหล
const handleNumericChange = (val: string) => {
  // สรุปค่าเป็น string ว่างสำหรับการลบตัวเลขเพื่อพิมพ์ใหม่
  const numericValue = val === '' ? '' : (Number(val) || 0);
  setFieldValue(numericValue);
};

// เวลาคำนวณยอดรวม ใช้ fallback 0 เสมอ
const totalCost = Number(fieldValue) || 0;
```

### การอ่านข้อมูลแถวใน Google Sheets แบบยืดหยุ่นและปลอดภัย (Backward-Compatible)
```javascript
// ตรวจสอบขนาดของอาร์เรย์และค่า undefined ก่อนแปลงค่าเสมอ เพื่อรองรับการเพิ่มคอลัมน์ใหม่ในสกีมา
function parseRowDefensive(row) {
  const laborCountIndex = 27;
  const laborCount = (laborCountIndex < row.length && row[laborCountIndex] !== undefined)
    ? Number(row[laborCountIndex])
    : 0;
  return laborCount;
}
```

### การย่อการเรียกเขียนทับชีตแบบครั้งเดียว (Single-Transaction Batch Updates)
```javascript
// แทนการวนลูปเรียก API บันทึกทีละรายการ (ประหยัดเวลาเน็ตเวิร์ก)
function upsertOverrideRows(employeeId, overridesList, updatedBy) {
  var sheet = getSheet("Overrides");
  var allData = sheet.getDataRange().getValues();
  // สะสมการอัปเดตลงในหน่วยความจำ แล้วเขียนคืนแผ่นงานครั้งเดียว
  // ...
  sheet.getRange(1, 1, newValues.length, newValues[0].length).setValues(newValues);
}
```

### การตั้งค่า dynamic dynamic dynamic เพื่อป้องกัน Hydration Mismatch ใน Next.js
```typescript
import dynamic from 'next/dynamic';

// โหลด App Component ที่เป็น client-side SPA เข้าสู่หน้าหลักโดยข้ามการทำ Server-Side Rendering (SSR)
const App = dynamic(
  () => import('../App'),
  { ssr: false, loading: () => <div className="spinner">กำลังโหลด...</div> }
);
```

---

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[architecture/system-architecture.md]] — โครงสร้างสถาปัตยกรรมรวมของ Next.js และ GAS
- **Depends On**: [[gas-backend/gas-api.md]] — การพัฒนา API และเวิร์กฟลว์การเรียกใช้บน Apps Script
- **Depends On**: [[nextjs-frontend/roles.md]] — การจัดสิทธิ์บทบาทและสกีมาความปลอดภัย
- **Impacted By**: [[lessons-learned/bugs-and-fixes.md]] — บันทึกบั๊กสำคัญของระบบ

---
> 🔄 *สร้างเมื่อ 2026-05-23*: Ingested และสังเคราะห์ความรู้รวม 36 รายการในอดีตจาก `1_raw/ForLearning.md`
