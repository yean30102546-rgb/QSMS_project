# Project History & Milestone Archive
[วันที่อัปเดต: 2026-07-21]

## 1. Summary
รวบรวมประวัติการพัฒนาและ Milestone สำคัญของโปรเจกต์ QSMS ตั้งแต่เริ่มต้นการ Migrate จนถึงปัจจุบัน

## 2. Key Milestones

### Phase 1: Migration & Rework Stabilization (2025-2026)
- **Migration**: ย้ายจาก Vite เป็น Next.js 15 (App Router)
- **UI/UX**: ปรับปรุง UI ใหม่ทั้งหมดเป็น Apple-inspired design
- **Auth**: ย้ายระบบ Auth จาก Local PIN เป็น GAS-issued JWT
- **Image Upload**: แก้ไขระบบ Image upload ให้เสถียร รองรับการเก็บใน Google Drive
- **CORS Fix**: ปรับปรุงการจัดการ CORS ใน GAS ให้เป็นระบบเดียว (Centralized)

### Phase 2: Modular Portal & Roster Implementation (2026-05)
- **Workspace Portal**: พัฒนา `App.tsx` ให้เป็น Hub กลางสำหรับเลือกใช้งานแต่ละ Module
- **Roster Module**: เพิ่มระบบตารางเวรพนักงาน (Roster) เชื่อมต่อกับ GAS Calendar
- **Login Modernization**: ปรับปรุงหน้า Login เป็น **Soft Glassmorphism** (2026-05-21)

### Phase 3: FSD Refactoring & System Stability (2026-07)
- **FSD Refactoring**: ย้ายโค้ด UpdateModal.tsx ที่เป็น Monolith แยกออกมาเป็นโครงสร้าง Feature-Sliced Design (FSD) ลดบั๊ก
- **UI/UX Consistency**: แก้ปัญหา Scrolling ซ้อนทับ ปัญหา Viewport jumping
- **Integrity Validation**: ปรับระบบ Auto-Status ใหม่ ให้ผูกติดกับจำนวนกล่องความคืบหน้าจริง ลดภาระ User ในการกดปุ่ม (2026-07-21)
- **Database Alignment**: ปรับแต่ง Payload ให้ Mapping field ระหว่าง Database (Supabase) และ Frontend ถูกต้อง (`completed_boxes`)

## 3. Archive of Past Changes (Antigravity Notes)
- ✅ `loadMasterData()` fix: จัดการกรณี sheet ไม่มีอยู่จริง
- ✅ `uploadImageToDrive()`: แก้ไขการ decode base64 ให้รองรับ prefix data URL
- ✅ `formatThaiDateShort`: รองรับการแสดงผลวันที่แบบไทย
- ✅ Role-Based Access Control: เพิ่มสิทธิ์ให้ WFG และ Finance ในจุดที่ติดขัด (2026-05-18)

## 4. Knowledge Relationships
- **Depends On**: [[lessons-learned/bugs-and-fixes.md]]
- **Impacted By**: [[architecture/system-architecture.md]]

---
> 🔄 *สร้างเมื่อ 2026-05-21*: รวบรวมข้อมูลจาก Antigravity.md และ archive_docs
