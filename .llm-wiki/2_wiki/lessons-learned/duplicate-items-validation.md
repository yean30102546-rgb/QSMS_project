# Title: Duplicate Items Validation & Warning Banner
[วันที่อัปเดต: 2026-05-27]

## 1. Summary & Current Implementation
เมื่อสร้างเคส Rework ใหม่ที่มีหลายรายการสินค้า (Multi-item Rework Case) หากมีการกรอกข้อมูลสินค้าที่มีคีย์ซ้ำกัน (บาร์โค้ดเดียวกัน + สาเหตุเดียวกัน + รูปแบบสาเหตุย่อยเดียวกัน + เลขกล่องเดียวกัน + แม่พิมพ์เดียวกัน + ไลน์เดียวกัน) ระบบ Backend (Google Sheets/GAS) จะส่งข้อผิดพลาดกลับมาบล็อกการบันทึกเคส เพื่อป้องกันข้อมูลทับซ้อน

ปัจจุบันได้ทำการย้ายการตรวจสอบนี้มาที่ Frontend และปิดการทำงานของปุ่มบันทึกเมื่อมีข้อมูลซ้ำซ้อนกันในฟอร์ม พร้อมทั้งเรนเดอร์ Banner สีแดงแจ้งเตือนให้ผู้ใช้รับทราบและแก้ไขได้ทันที

## 2. Technical Code Snippet (Best Practice)
```typescript
// ตรวจหาไอเทมซ้ำซ้อนในฟอร์ม (src/services/validation.ts)
export function findDuplicateItemNumbers(
  items: Array<{ 
    itemNumber?: string | number; 
    reason?: string;
    reasonSubtype?: string;
    boxNumber?: string;
    mold?: string;
    line?: string;
  }>
): { hasDuplicates: boolean; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  items.forEach((item) => {
    const itemNumber = String(item.itemNumber || '').trim();
    const reason = String(item.reason || '').trim();
    const reasonSubtype = String(item.reasonSubtype || '').trim();
    const boxNumber = String(item.boxNumber || '').trim();
    const mold = String(item.mold || '').trim();
    const line = String(item.line || '').trim();
    
    if (!itemNumber || !reason) return;

    const compositeKey = `${itemNumber}||${reason}||${reasonSubtype}||${boxNumber}||${mold}||${line}`;
    const duplicateLabel = `${itemNumber} (${reason}${reasonSubtype ? ` - ${reasonSubtype}` : ''}) - Box: ${boxNumber || '-'}, Mold: ${mold || '-'}, Line: ${line || '-'}`;

    if (seen.has(compositeKey) && !duplicates.includes(duplicateLabel)) {
      duplicates.push(duplicateLabel);
    }
    seen.add(compositeKey);
  });

  return { hasDuplicates: duplicates.length > 0, duplicates };
}
```

## 3. Knowledge Relationships
Depends On: [[nextjs-frontend/rework-module.md]]

Impacted By: [[lessons-learned/box-number-binding-and-jwt-e2e.md]]

Contradicts: ในอดีตไม่ได้ตรวจสอบข้อมูลซ้ำซ้อนในฝั่ง Client ทำให้ปล่อยข้อมูลซ้ำขึ้นไปยัง API และเกิดข้อผิดพลาด Google Drive sync failed จาก GAS Backend
