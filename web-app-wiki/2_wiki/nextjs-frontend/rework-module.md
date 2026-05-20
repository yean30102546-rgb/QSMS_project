# Rework Module — QSMS
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Module หลักของระบบ อยู่ที่ `src/modules/rework/ReworkApp.tsx`
มี 3 Tab หลัก: **Overall** (ดูเคส) | **Add Case** (เพิ่มเคส) | **Dashboard** (Analytics)
ข้อมูลผ่าน `src/services/api.ts` → `/api/rework` → GAS

## 2. Tab Structure
```
ReworkApp.tsx
├── Tab: ภาพรวม (Overall)     → แสดงรายการเคสทั้งหมด, ค้นหา, คลิกเปิด Modal
├── Tab: เพิ่มงานใหม่ (Add Case) → ฟอร์มเพิ่มเคส, หลาย items ต่อ 1 เคส, อัปโหลดรูป
└── Tab: Dashboard              → Analytics: Total, Pending, Completion Rate, Defect Chart
```

## 3. API Service (src/services/api.ts)
```typescript
// Pattern การเรียก API จาก ReworkApp
const GAS_WEB_APP_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

insertCase(source, items, imageData)   // POST → action: insertCase
fetchAllCases()                         // POST → action: fetchAllCases
updateCase(caseId, updates)            // POST → action: updateCase
fetchDashboardStats()                  // POST → action: fetchDashboardStats
```

## 4. Status Workflow
```
Pending → In-Progress → Completed
```
- เรียงอัตโนมัติ: Pending → In-Progress → Completed
- อัปเดตผ่าน UpdateModal (ไม่ redirect หน้า)

## 5. Image Upload
- สูงสุด 5 รูป/item — component: `src/components/ImageUpload.tsx`
- ขนาดสูงสุด: 10MB/รูป, รูปแบบ: PNG, JPG, GIF
- URL เก็บใน Sheet คอลัมน์ `Image URLs` คั่นด้วย `|`

## 6. Data Validation (src/services/validation.ts)
| Field | กฎ |
|---|---|
| Item Number | ตัวเลขเท่านั้น, บังคับกรอก |
| Item Name | บังคับกรอก |
| Amount (Box) | ตัวเลข > 0, บังคับกรอก |
| Reason | บังคับกรอก |
| Responsible | บังคับกรอก |
| Item Code | ตัวเลขเท่านั้น (ไม่บังคับ) |

## 7. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — ทุก action ผ่าน GAS
- **Depends On**: [[google-sheets/schema.md]] — ข้อมูลต้องตรงกับ column schema
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — ต้อง login ก่อนใช้งาน
- **Depends On**: [[nextjs-frontend/roles.md]] — บาง action ต้องการ permission
