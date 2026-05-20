# Roster Module — QSMS
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Module ระบบตารางเวร อยู่ที่ `src/modules/roster/`
Backend แยกจาก Rework — ใช้ `gas/gas_calendar.gs` และ env `GAS_CALENDAR_WEB_APP_URL`
API calls ผ่าน `src/services/rosterApi.ts` → `/api/roster` → GAS Calendar

## 2. Data Flow
```
Roster UI → rosterApi.ts → POST /api/roster → Next.js Proxy → GAS_CALENDAR_WEB_APP_URL
```

## 3. ไฟล์ที่เกี่ยวข้อง
| ไฟล์ | บทบาท |
|---|---|
| `src/modules/roster/` | Roster UI Components |
| `src/services/rosterApi.ts` | API calls สำหรับ Roster |
| `src/app/api/roster/route.ts` | Next.js Proxy → GAS Calendar |
| `gas/gas_calendar.gs` | GAS backend สำหรับ Calendar (15KB) |

## 4. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — pattern proxy เหมือนกับ Rework แต่ URL คนละตัว
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — ต้อง login ก่อนเข้าถึง

## 5. Refactoring History
> 🔄 *คอมไพล์ความรู้เพิ่มเมื่อ 2026-05-21*:
> **ความสำเร็จในการ Refactor ด้วย shadcn/ui**:
> - แยก Monolith `RosterApp.tsx` (1,100+ บรรทัด) ออกเป็น sub-components 7 ตัวใน `/components/`
> - เปลี่ยนมาใช้ shadcn primitives:
>   - `Tabs`: สำหรับสลับหน้า Summary/Calendar
>   - `Dialog`: สำหรับหน้าต่างระบุหมายเหตุการลา
>   - `Table`: สำหรับตารางสรุปรายเดือน
>   - `Popover`: สำหรับเมนูจัดการวันเสาร์รายวัน
> - ผลลัพธ์: โค้ดสะอาดขึ้น แบ่งแยกหน้าที่ชัดเจน และรองรับ Accessibility ดีขึ้น

