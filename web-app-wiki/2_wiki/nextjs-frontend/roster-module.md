# QSMS Roster Module
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Module ระบบจัดการตารางเวร อยู่ที่ `src/modules/roster/` ภายใต้ชื่อ **QSMS Roster** (เปลี่ยนจากเดิม ShiftHub Roster)
- **Backend**: ได้รับการย้าย (Migrate) จาก GAS Calendar มาใช้ **Supabase Database** 100% แล้ว เพื่อประสิทธิภาพการสืบค้นและเสถียรภาพในการแก้ไขข้อมูล
- **Proxy**: มีการเชื่อมต่อผ่าน API route ของ Next.js `/api/roster` ซึ่งจะดึง/บันทึกข้อมูลกับ Supabase โดยตรง และมีตัวแปร `GAS_CALENDAR_WEB_APP_URL` ใน env เป็นเพียง Compatibility fallback สำหรับฟังก์ชันดั้งเดิมที่จำเป็น

## 2. Data Schema & Architecture
Roster Database ใน Supabase ประกอบด้วย 3 ตารางหลัก (ตาม Migration `20260521_roster_schema_v2.sql`):
- `roster_employees` - รายชื่อและข้อมูลพื้นฐานของพนักงาน
- `roster_overrides` - รายการเปลี่ยนสถานะการทำงานรายวัน (เช่น ทำงานในวันหยุด หรือวันลาหยุดพิเศษ)
- `roster_leaves` - ตารางบันทึกการลาหยุดของพนักงาน

### Data Flow
```
Roster UI ──> rosterApi.ts ──> POST /api/roster ──> Next.js Server API ──> Supabase DB
```

## 3. API Actions (/api/roster)
API route รองรับ action ดังนี้:
- `rosterGetMonth`: ดึงพนักงานทั้งหมด รายการ override และการลาภายในเดือนนั้น (กรองด้วย `date_key` ในรูปแบบ `YYYY-MM-%`)
- `rosterAddEmployee`: เพิ่มพนักงานใหม่เข้าสู่ระบบ
- `rosterUpdateEmployeePhase`: เปลี่ยนกลุ่มเฟสการทำงานของพนักงาน (Phase 0 หรือ 1)
- `rosterUpdateEmployeeStartSaturday`: กำหนดวันที่เริ่มทำงานวันเสาร์แรก
- `rosterUpsertOverride`: บันทึกหรืออัปเดต Override สถานะการทำงานวันเสาร์รายบุคคล (`WORK`, `OFF`, `OT2X`)
- `rosterSwapSaturday`: สลับเวรวันเสาร์ระหว่างสัปดาห์
- `rosterClearMonthOverrides`: ล้าง Override ทั้งหมดในเดือนที่ระบุ
- `rosterDeleteEmployee`: ลบพนักงานออกจากระบบ (Cascading ลบ Overrides และ Leaves อัตโนมัติ)
- `rosterUpsertLeave`: บันทึกการลาหยุด (ระบุวัน ประเภทการลา และหมายเหตุ)
- `rosterDeleteLeave`: ลบการลาหยุด

## 4. UI/UX Refactoring (shadcn/ui & Motion)
ตารางเวรได้รับการแยกโค้ด Monolith ออกเป็น 7 คอมโพเนนต์ย่อยเพื่อความสะอาดและจัดการง่าย:
- `Tabs` จาก shadcn/ui ในการสลับมุมมอง Summary Table และ Calendar View
- `Dialog` และ `DialogContent` ใน [RosterDialogs.tsx](file:///c:/Workplace/QSMS_project/src/modules/roster/components/RosterDialogs.tsx) ได้รับการแต่งดีไซน์ด้วย **Soft Glassmorphism** (`bg-white/98 backdrop-blur-2xl`) สำหรับ Popup ลบพนักงานและจัดการวันลา
- **Swap Logic**: การลากสลับเวร (Drag and Drop) จะอ้างอิงลำดับและปฏิทิน หากลากทับวันทำงานเดิมที่เหมือนกันจะถูกละเว้น (Silent Ignore) เพื่อเลี่ยงความผิดพลาดของระบบ

## 5. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — ต้องยืนยันสิทธิ์ PIN ก่อนเข้าถึงระบบ
- **Depends On**: [[nextjs-frontend/roles.md]] — การแก้ไขข้อมูลวันทำงานสลับเวรและลบพนักงานต้องการระดับ Role ที่มีสิทธิ์เหมาะสม
- **Depends On**: [[nextjs-frontend/design-system.md]] — การใช้ styling แบบ Minimal Monochrome และ Soft Glassmorphism
- **Affects**: [[architecture/system-architecture.md]] — การเชื่อมต่อ Supabase Database สำหรับข้อมูล Roster


