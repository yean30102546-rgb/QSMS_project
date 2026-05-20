# GAS Backend API — QSMS Rework Management
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Backend ทั้งหมดรันบน Google Apps Script (`gas/Code.gs` และ `gas/gas_calendar.gs`)
Next.js ไม่เรียก GAS โดยตรงจาก client — ผ่าน Next.js API Route เป็น Proxy เสมอ

**Data Flow:**
```
Browser → POST /api/rework → Next.js Route → POST GAS_WEB_APP_URL → Google Sheets
Browser → POST /api/roster → Next.js Route → POST GAS_CALENDAR_URL → Google Sheets
```

## 2. API Actions (doPost via action field)

### Rework Actions (`gas/Code.gs`)
| action | คำอธิบาย |
|---|---|
| `loginWithPassword` | ตรวจ PIN, ออก JWT Token |
| `insert` | เพิ่มเคสใหม่พร้อม items หลายรายการ |
| `readAll` | ดึงเคสทั้งหมดจากชีต |
| `update` | แก้ไขสถานะหรือรายละเอียดเคส |
| `dashboardStats` | ดึง stats สรุปสำหรับ Dashboard |
| `getItemMaster` | ดึง ItemMaster ทั้งหมด (สร้างชีตอัตโนมัติถ้าไม่มี) |
| `saveItemMaster` | บันทึก Item ใหม่ลง ItemMaster sheet |
| `uploadImage` | อัปโหลดรูปภาพไปยัง Google Drive |

> ⚠️ **หมายเหตุ**: `insertCase`/`fetchAllCases`/`updateCase` (camelCase) คือชื่อฟังก์ชัน TypeScript ฝั่ง API
> GAS รับ `action` field เป็น `insert`/`readAll`/`update` (lowercase) แทน

### Calendar/Roster Actions (`gas/gas_calendar.gs`)
| action | คำอธิบาย |
|---|---|
| _(ดูโค้ดเพิ่มเติม)_ | ระบบตารางเวร / Roster |

## 3. Next.js Proxy Routes

| Route | วิธีส่ง | env var ที่ใช้ |
|---|---|---|
| `POST /api/rework` | JSON body → GAS | `GAS_WEB_APP_URL` |
| `POST /api/roster` | JSON body → GAS | `GAS_CALENDAR_WEB_APP_URL` |

**⚠️ หมายเหตุ:** GAS รับ `Content-Type: text/plain` เท่านั้น (ป้องกัน CORS preflight)

## 4. Technical Code Snippet (Best Practice)
```typescript
// src/app/api/rework/route.ts — Next.js Proxy Pattern
const response = await fetch(gasUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' }, // ⚠️ ต้องเป็น text/plain เท่านั้น
  body: JSON.stringify(body),
});
```

## 5. GAS Script Properties (ไม่ได้เก็บใน Code)
| Key | คำอธิบาย |
|---|---|
| `AUTH_TOKEN_SECRET` | Secret สำหรับเซ็น JWT |
| `QSMS_PIN` | PIN ของ user QSMS |
| `QSMS_EMAIL`, `QSMS_NAME`, `QSMS_ROLE`, `QSMS_DEPARTMENT` | ข้อมูล profile |
| `WFG_PIN`, `WFG_EMAIL`, `WFG_NAME`, `WFG_ROLE`, `WFG_DEPARTMENT` | ข้อมูล profile WFG |

## 6. Knowledge Relationships
- **Depends On**: [[google-sheets/schema.md]] — GAS เขียนข้อมูลตาม schema
- **Impacted By**: [[nextjs-frontend/auth-flow.md]] — login ต้องผ่าน GAS เสมอ
