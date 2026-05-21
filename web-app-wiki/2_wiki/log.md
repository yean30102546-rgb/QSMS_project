# 📋 Work Log — QSMS Rework Management
> บันทึกประวัติการทำงานเรียงตามเวลา (Chronological Log)

---

## 2026-05-21

### [Init] สร้างโครงสร้าง web-app-wiki ครั้งแรก
- สแกนโค้ดทั้งโปรเจกต์: `src/`, `gas/`, `src/services/`, `src/config/`
- สร้างโครงสร้างโฟลเดอร์ตาม AGENTS.md
- สังเคราะห์ wiki ไฟล์เริ่มต้นจากโค้ดจริง ได้แก่:
  - `index.md`, `log.md`
  - `gas-backend/gas-api.md`
  - `google-sheets/schema.md`
  - `nextjs-frontend/auth-flow.md`, `nextjs-frontend/nextjs.md`, `nextjs-frontend/roles.md`

### [Setup] สร้างไฟล์ `.env` และ `.env.example`
- ระบุ env vars ทั้งหมดจากการสแกนโค้ด: `GAS_WEB_APP_URL`, `REACT_APP_GAS_WEB_APP_URL`, `VITE_GAS_WEB_APP_URL`, `GAS_CALENDAR_WEB_APP_URL`, `GAS_TEST_*`

### [Ingest] สังเคราะห์ข้อมูลจาก `1_raw/` (44 ไฟล์)
ไฟล์ที่สำคัญที่ ingest แล้ว:
- `SYSTEM_ARCHITECTURE.md` → อัปเดต `google-sheets/schema.md` (column index A-O, ItemMaster, Image Storage)
- `BUG_FIX_REPORT.md` → สร้าง `lessons-learned/bugs-and-fixes.md` (BUG-001, BUG-002)
- `CORS_FIX_GUIDE.md` → สร้าง `lessons-learned/bugs-and-fixes.md` (BUG-003 + CORS Pattern)
- `DOCUMENTATION_INDEX.md` → ทำความเข้าใจโครงสร้างเอกสารรวม

ไฟล์ใน `1_raw/` ที่ยังไม่ได้ ingest (ไว้สังเคราะห์เมื่อมีงานเกี่ยวข้อง):
- `AUTHENTICATION_IMPLEMENTATION.md`, `REFACTORING_SUMMARY.md`, `PERFORMANCE_GUIDE.md`
- `IMAGE_UPLOAD_*.md` (3 ไฟล์), `ITEMMASTER_DIAGNOSTIC_GUIDE.md`
- `central_portal_plan.md`, `ForLearning.md`, `testsprite_spec.md`

### [Ingest] สังเคราะห์ข้อมูลจาก `archive_docs/` (รอบที่ 2)
ไฟล์ที่ ingest แล้ว:
- `AUTHENTICATION_IMPLEMENTATION.md` → อัปเดต `nextjs-frontend/auth-flow.md` (เพิ่ม Deprecated note, Firebase/OAuth planned, env vars)
- `REFACTORING_SUMMARY.md` → สร้าง `nextjs-frontend/refactoring-history.md` (Component split, Case ID fix, Validation API, Logger API, Performance metrics)

Knowledge สำคัญที่ได้:
- **Case ID format ใหม่**: `RWYYMMDDHHmmMsRRR` (ms + random) แก้ collision
- **Validation functions**: `validateItemNumber`, `validateReworkItem`, `sanitizeInput` ฯลฯ
- **Logger API**: `log.debug/info/warn/error/performance/api`
- **Firebase OAuth** ยังเป็น Planned ยังไม่ implement จริง

### [Ingest] สังเคราะห์ข้อมูลจาก `archive_docs/` (รอบที่ 3)
ไฟล์ที่ ingest แล้ว:
- `CODE_COMPARISON.md` → append `lessons-learned/bugs-and-fixes.md` (GAS Pattern 1-3: doPost validation, handleReadAll defensive, status update logic)
- `ITEMMASTER_DIAGNOSTIC_GUIDE.md` → append `lessons-learned/bugs-and-fixes.md` (4 สาเหตุ ItemMaster, debug console, Sheet ID)
- อัปเดต `gas-backend/gas-api.md` — แก้ action names ให้ถูก (insert/readAll/update vs camelCase)

### [Feature] ติดตั้งและบูรณาการ shadcn/ui
- ติดตั้งคอมโพเนนต์พื้นฐาน: `Tabs`, `Dialog`, `Select`, `Popover`, `Table`, `Button`, `Badge`, `Card`
- กำหนดค่า `components.json` และ `src/lib/utils.ts` (cn helper)
- ปรับแต่ง Theme ใน `src/index.css` ให้สอดคล้องกับ Apple-inspired design เดิม

### [Refactor] ปรับปรุงโครงสร้าง Roster Module (Monolith → Modular)
- แยก `RosterApp.tsx` (1,100+ บรรทัด) ออกเป็นคอมโพเนนต์ย่อยใน `src/modules/roster/components/`:
  - `RosterHeader`: ส่วนหัวและปุ่มกลับพอร์ทัล
  - `RosterControls`: ส่วนควบคุมเดือนและ Tab Switcher (ใช้ shadcn Tabs)
  - `RosterSidebar`: รายชื่อพนักงานและแบบฟอร์มเพิ่มพนักงาน
  - `RosterSummary`: ตารางสรุปภาพรวมรายเดือน (ใช้ shadcn Table)
  - `RosterEmployeeHeader`: ข้อมูลพนักงานที่เลือกและฟอร์มลา
  - `RosterCalendar`: ปฏิทินแบบโต้ตอบ (ใช้ shadcn Popover)
  - `RosterDialogs`: หน้าต่างยืนยันการลา (ใช้ shadcn Dialog)
- **Logic Updates**: 
  - เพิ่ม Auto-tab switching: เมื่อเลือกพนักงานใน Sidebar ระบบจะสลับไปหน้าปฏิทินทันที
  - ปรับปรุง Swap Logic: การลากวันทำงานไปทับวันทำงานจะไม่มีผล (Silent Ignore) เพื่อลดความสับสน
- **Git**: Commit และ Push การเปลี่ยนแปลงทั้งหมดไปยัง GitHub (origin main)

### [Feature] ปรับปรุง Login UI/UX (Soft Glassmorphism)
- เปลี่ยนโทนสีหน้า Login จาก Dark เป็น **Soft Glassmorphism** (พาสเทลและกระจกฝ้า)
- เพิ่ม CSS Utilities `.glass-panel` และ `.glass-input` ใน `src/index.css`
- เพิ่ม Micro-animations ด้วย `motion/react` และปรับปรุง Interactive feedback (Focus rings, Hover effects)
- **Git**: Staged และ Commit การเปลี่ยนแปลง UI ทั้งหมด

### [Ingest] สังเคราะห์ข้อมูลทกเลเยอร์ (Wiki Update & Full Migration)
- **Supabase Strategy**: สร้าง `architecture/supabase-hybrid-migration.md` บันทึกแผนการใช้ Hybrid Storage (Supabase Data + Drive Images)
- **Design System**: สร้าง `nextjs-frontend/design-system.md` กำหนดมาตรฐาน Minimal Monochrome (Apple Pro Style)
- **Prisma ORM**: สร้าง `architecture/prisma-orm.md` สรุปแนวทางการใช้ Prisma เพื่อคุม Type-safety ร่วมกับ Supabase
- **UI Research**: สร้าง `lessons-learned/ui-libraries-resource.md` สรุปข้อมูล Mantine UI และ Next.js จาก Raw folder
- **Bugs & Fixes**: บันทึก **BUG-004 (Encoding Fix)** และโซลูชันการแก้ Visual Overlapping ใน `lessons-learned/bugs-and-fixes.md`
- **Architecture**: อัปเดต `system-architecture.md` ให้ Supabase เป็นแกนกลางข้อมูล Transactional
- **Cleanup**: อัปเดต `index.md` ให้เป็นเวอร์ชันล่าสุด พร้อมรองรับการสืบค้นข้อมูลใหม่

### [UX/UI] Typography Weight Optimization & Portal Dashboard
- **Typography weights contrast**: ปรับปรุง [OverallTab.tsx](file:///c:/Workplace/QSMS_project/src/components/tabs/OverallTab.tsx) และ [CaseListTable.tsx](file:///c:/Workplace/QSMS_project/src/components/ui/CaseListTable.tsx) ให้รองรับลำดับตัวหนา-บาง (Contrast) ที่ดีต่อการมองเห็น (UX) ตามมาตรฐาน Minimal Monochrome
- **Workspace Portal Preview Bar**: ปรับแก้ [WorkspacePortal.tsx](file:///c:/Workplace/QSMS_project/src/components/apps/portal/WorkspacePortal.tsx) ให้คำนวณเคสจากฐานข้อมูลแบบเรียลไทม์ และทำแถบสัดส่วนความคืบหน้า (Segmented Progress Bar) แยกสีกำกับตามสถานะงาน พร้อมตารางคำอธิบายสัญลักษณ์ (Legend Grid) ด้านล่าง
- **Wiki Update**: บันทึกอัปเดตหลักเกณฑ์ฟอนต์ลงใน [design-system.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/design-system.md) และเอกสารหน้า [rework-module.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/rework-module.md)

### [Ingest] สังเคราะห์ความรู้จากโฟลเดอร์ Raw ใหม่ (Prisma, VoltAgent, Chronos, Debugger, How to Debug)
- **Prisma Configuration**: เพิ่มข้อมูลการตั้งค่า `prisma.config.ts`, การโหลด `.env` ผ่าน `dotenv`, การใช้ Driver Adapter (เช่น pg adapter), และคำสั่ง `npx prisma dev` ลงใน [prisma-orm.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/architecture/prisma-orm.md)
- **Design System Agentic Protocol**: บันทึกนิยามสัญญะของ `DESIGN.md` (Mood, Palette, Type, Do's & Don'ts, Prompt Guide) สไตล์ VoltAgent ลงใน [design-system.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/design-system.md) เพื่อรองรับการทำงานร่วมกับ AI Design Agents
- **Systematic Debugging Guide**: สร้างหน้า [debugging-practices.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/lessons-learned/debugging-practices.md) เพื่อสังเคราะห์ความรู้:
  - โมเดลดีบั๊กกิ้งเฉพาะทาง (Kodezi Chronos) และการทำงานของ 7-Layer Architecture
  - มาตรฐานและ Checklists การวินิจฉัยปัญหาของ Claude Specialized Debugger Subagents
  - แนวทางการสืบค้นและวินิจฉัยบั๊กผ่าน GitHub (รวมถึง Case Study การใช้ Asynchronous `.fetch()` เลี่ยงการเรียกใช้ Hook ใน `useEffect` ของ tRPC)
- **Index Update**: เชื่อมโยงและลงทะเบียนหน้าเอกสารใหม่ลงในสารบัญหลัก [index.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/index.md)

