# 📋 Work Log — QSMS Rework Management
> บันทึกประวัติการทำงานเรียงตามเวลา (Chronological Log)

## 2026-08-20

### [Mobile UI/UX Overhaul & Thesis Report] ปรับปรุง Responsive มือถือ (iPhone 13), เอกสารวิทยานิพนธ์ PIM และ Touch Navigation
- **Mobile-First Rework Card Layout (`CaseListTable.tsx`)**:
  * ยกเลิก 3 คอลัมน์แนวนอนแบบเดิมที่ทำให้ชื่อสินค้าและรายละเอียดถูกบีบตัดบรรทัด 7-8 บรรทัดบนหน้าจอ 390px (iPhone 13)
  * ปรับเปลี่ยนเป็น **Mobile-First Card Layout** โดยแบ่งสัดส่วนข้อมูล:
    - ส่วนบน: รหัสเคส + ป้ายสถานะ/เตือนระยะเวลา (7 วัน, เกิน 30 วัน, ขาดไฟล์ OR, รอของ)
    - ส่วนกลาง: ชื่อสินค้าแสดงผลเต็มความกว้างอย่างชัดเจน
    - ส่วนล่าง: วันที่, แหล่งที่มา, ยอดกล่อง, แถบ Progress Bar ความคืบหน้า และป้ายสถานะ (Status Pill) จัดวางเข้ามุมอย่างเป็นระเบียบ
  * กำหนดโครงสร้าง JSX ให้เรนเดอร์ `StatusPill` และ `reasonsDisplay` เพียงตำแหน่งเดียวใน DOM เพื่อความถูกต้องในการทดสอบ Unit Test (131/131 Passed)
- **DocAI Assistant Floating Action Button (FAB) Positioning (`App.tsx`)**:
  * ปรับเปลี่ยนตำแหน่งปุ่ม DocAI จากเดิมที่อยู่ตรงกลางล่าง (`bottom-6 right-44`) มาอยู่ที่ **`bottom-20 right-4 sm:bottom-6 sm:right-6` (มุมขวาล่าง)**
  * บนหน้าจอมือถือ แปลงเป็นปุ่มวงกลม FAB Icon กะทัดรัด ไม่บดบังแถบตัวเลขเปลี่ยนหน้า (Pagination `< 1 >`) หรือการ์ดเคสด้านล่าง
  * เพิ่มระยะเลื่อนล่างสุดใน `OverallTab.tsx` เป็น `pb-28 sm:pb-8`
- **CaseUpdateView Responsive 2-Tier Header & Full-Width Inputs (`CaseUpdateView.tsx`)**:
  * แก้ไขปัญหาปุ่ม Action Bar ([ส่งออก Excel], [ลบเคสนี้], [บันทึกร่าง], [บันทึกเสร็จสิ้น]) ซ้อนทับและเบียดตัวหนังสือชื่อหน้า "จัดการงาน Rework" และรหัสเคสบนมือถือ
  * ปรับโครงสร้างแถบ Header ให้เป็น 2 ชั้นแบบ Responsive บนมือถือ (`flex-col sm:flex-row`) พร้อมคุณสมบัติ `overflow-x-auto scrollbar-hide` ให้ปุ่มเลื่อนได้อิสระหากหน้าจอแคบมาก
  * ปรับแต่งกล่องกรอกยอดความคืบหน้ารวมให้เป็น Full-Width บนมือถือ (`flex-1 sm:w-48`) และปรับ Padding คอนเทนเนอร์เป็น `p-3.5 sm:p-6`
- **Case Update Item Folding / Accordion (`CaseUpdateView.tsx`)**:
  * ปรับเปลี่ยนรายการสินค้าทั้งหมดให้เป็นแบบ **Accordion (พับเก็บได้เป็นค่าเริ่มต้น)** เพื่อลดความยาวของหน้าจอในการอัปเดตเคสที่มีสินค้าหลายรายการ
  * แสดงข้อมูลสรุปบนหัวการ์ด: ชื่อสินค้า, รหัสบาร์โค้ด, สถานะแนบรูปภาพ, ยอดผลิตเสร็จสิ้น, และปุ่มลัด [เสร็จแล้ว]
  * เพิ่มปุ่มควบคุมส่วนกลาง "ขยายข้อมูลทั้งหมด / พับข้อมูลทั้งหมด" 1-Click Toggle
- **Academic Thesis Word Document Generation (`scripts/build_academic_thesis_template.py`)**:
  * สร้างและพัฒนาสคริปต์ Python อัตโนมัติด้วย `python-docx` ในการสังเคราะห์รายงานวิทยานิพนธ์ฉบับสมบูรณ์ `QSMS_Project_Thesis_Report.docx` (3.10 MB) ตามมาตรฐานรูปแบบเล่มของสถาบันการจัดการปัญญาภิวัฒน์ (PIM) 5 บท
  * ปรับฟอนต์ TH Sarabun PSK / Cordia New ขนาดมาตรฐาน, ตกแต่ง Header/Footer, หมายเลขหน้า ก-ง และ 1-N
  * บูรณาการตราสัญลักษณ์ PIM University Logo, แผนภาพไดอะแกรมความละเอียดสูง 300 DPI ทั้ง 5 ภาพ และภาพถ่ายหน้าจอซอฟต์แวร์จริงของระบบทั้ง 7 โมดูล
- **Presentation Deck Touch Gestures & Mobile Navigation (`GuideApp.tsx`)**:
  * เพิ่มระบบตรวจจับการปัดนิ้วสัมผัส Touch Gestures (`onTouchStart`, `onTouchEnd`) สำหรับการเปลี่ยนสไลด์บนหน้าจอสัมผัส
  * เพิ่มปุ่มลอยสำหรับออกจากโหมดพรีเซนต์ (`top-3 left-3 sm:top-4 sm:left-4 z-[99999]`) ไม่ให้ผู้ใช้ติดอยู่ในโหมดสไลด์บนมือถือ
  * เพิ่มแถบควบคุมสไลด์ลอยด้านล่างบนมือถือ (`md:hidden`) พร้อมปุ่มก่อนหน้า/ถัดไปและตัวเลขสไลด์ปัจจุบัน

---

## 2026-08-19

### [Presentation Deck & Engine Optimization] อัปเกรดเนื้อหา PPTX, ไทม์ไลน์ 4 เดือน, การจำลอง Excel และ Direct-Manipulation Zoom/Pan
- **4-Month Development Timeline (Slide 04)**:
  * บันทึกไทม์ไลน์และระเบียบวิธีพัฒนาโครงการ 4 เดือน (พ.ย. 2568 – ก.พ. 2569) ครอบคลุม Phase 1 (Core Foundation & Rework System), Phase 2 (AI OCR & Drawing Master Repo), Phase 3 (DocAI RAG Engine & Jina Embeddings) และ Phase 4 (Enterprise Analytics, Mobile FastTrack & Security Hardening)
  * ไฮไลท์ดัชนีคุณภาพ: 130+ Automated Tests Passed, 0 High Vulnerabilities, 100% Real-time Sync
- **CaseUpdateView Header Polish & Collapsible Blockers**:
  * เพิ่ม `whitespace-nowrap shrink-0` ให้กับปุ่มและ Badge ใน Header ของ `CaseUpdateView.tsx` และ `MockScreens.tsx` ป้องกันปัญหาข้อความตัดบรรทัดและปุ่มเบียดกัน
  * ปรับแต่งส่วนรายงานอุปสรรคหน้างานให้เป็นแบบพับเก็บได้ (`รายละเอียดเพิ่มเติม / อุปสรรคหน้างาน`) เพื่อลด Visual Clutter
- **Dynamic Auto-Status, Blockers & Excel Export Simulation (Slide 14)**:
  * เพิ่มการจำลอง Step 6-7 ใน `MockUpdateModal` (Slide 14): ปุ่ม [ส่งออก Excel] กะพริบเรืองแสง, แสดงแถบ Export Progress Overlay, และ Toast แจ้งเตือนดาวน์โหลด
  * พัฒนา **Interactive Excel Spreadsheet Preview Modal**: หน้าต่างพรีวิวเอกสาร Excel จริง สไตล์ Microsoft Excel Ribbon (`bg-[#107C41]`) แสดงหัวตาราง SFC Rework Report, Quick Info Grid, ตารางสินค้า และรูปถ่ายหลักฐานฝังในเซลล์ความสูง 120px พร้อมปุ่ม [ปิดตัวอย่าง] และ [ดาวน์โหลดไฟล์ .xlsx]
- **Slide Transition Smoothness & Simulation Lifecycle Scoping**:
  * แก้ไขปัญหา Simulation Auto-Run เมื่อเลื่อนสไลด์ โดย Reset ค่า `simTrigger = 0` ทุกครั้งที่มีการเปลี่ยนสไลด์ และเพิ่ม `prevSimTriggerRef` ป้องกัน Component Mount รันก่อนได้รับคำสั่ง
  * ลบ CSS `filter: blur(...)` ออกจาก `slideVariants` และเปลี่ยน Fluid Blobs เป็น GPU-Accelerated Static Radiant Gradients (`transform-gpu will-change-transform`) ทำให้ Slide Transition รันได้อย่างลื่นไหลที่ 60/120fps
- **Direct-Manipulation Zoom & Pan Engine**:
  * ปรับระบบคลิกลากในโหมด Zoom เป็น Screen-Space 1:1 Translation (`translate3d(panOffset.x, panOffset.y, 0) scale(...)`)
  * ยกเลิก CSS Transition ขณะกำลังลาก (`transition-none pointer-events-none select-none`) ทำให้ Canvas เคลื่อนที่ตามเมาส์ได้ทันทีแบบไม่มีดีเลย์
  * ผูก Window Global Event Listeners (`window.addEventListener('mousemove'/'mouseup')`) ทำให้ลากต่อเนื่องได้ทั่วหน้าจอโดยไม่หลุดขอบ พร้อมระบบ Dynamic Boundary Clamping

---

## 2026-08-17

### [Presentation Deck & Liquid Glass UI] ปรับปรุงระบบสไลด์และดีไซน์ Liquid Glass
- **Interactive Hotspot Component (`Hotspot`)**:
  * เพิ่ม `popupPosition?: 'top' | 'bottom'` ให้กล่อง Tooltip เด้งขึ้นด้านบน (`bottom-full mb-4`) ป้องกันการตกมาบังฟิลด์กรอกข้อมูลสำคัญและพื้นที่อัปโหลดรูปภาพ
  * ปรับ `targetId: string | string[]` รองรับการไฮไลท์หลาย Element พร้อมกัน เช่น ไฮไลท์ทั้งช่อง Barcode และ Item Code เมื่อชี้ Hotspot "Smart Auto-fill"
- **Apple Liquid Glass Design System (`.liquid-glass-card`, `.liquid-glass-pill`)**:
  * เพิ่ม CSS Utilities ใน `src/index.css` ได้แก่ `.liquid-glass-card` (Multi-layer Refraction Gradient, 1.5px Specular Rim, Inset Depth Reflections, Backdrop Blur 40px + Saturate 200%) และ `.liquid-glass-pill`
  * ออกแบบ Glare Highlight ด้านบนและการ์ดสะท้อนแสงมุมขวาบนแบบมีมิติ
- **Tour Slide Layout Optimization (Side-by-Side 30/70)**:
  * ปรับผังหน้าจอแบบ Side-by-Side (30/70) ที่มีระยะขอบ `px-14 pt-28 pb-12 gap-10` พอดีกับ Canvas 2560x1440
  * ฝั่งซ้าย: Compact Floating Liquid Glass Card (430px) พร้อม Ambient Glowing Orbs ด้านหลัง
  * ฝั่งขวา: Fit & Scrollable Mac OS Sandbox Window พร้อม Traffic Lights Header และระบบ Internal Scroll
- **Mock Login Replica (`MockScreens.tsx`)**:
  * ปรับแต่งหน้าต่างจำลอง Login ใน Slide ให้เป็นแบบ 1:1 กับ `Login.tsx` จริงของระบบ (ปุ่ม Apple Dark Primary, ป้าย Central Workspace, ลิงก์สร้างบัญชี, และจัดกึ่งกลางความสูง 100%)

---

## 2026-08-14

### [Context & Spec Sync] เคลียร์บริบทเก่าและซิงค์ข้อมูลให้ตรงกับโปรเจกต์ปัจจุบัน
- **ถอดถอนบทบาทและฟีเจอร์เก่าที่ไม่มีอยู่จริง**: ตรวจสอบและเคลียร์บริบท `FINANCE` / `การประเมินราคา` / `คำนวณค่าแรง` ออกจากเอกสารและโค้ด ได้แก่ `GEMINI.md`, `docs/presentation-ecosystem-spec.md`, `.llm-wiki/2_wiki/nextjs-frontend/rework-module.md`, `src/components/layout/MainLayout.tsx`, และ `src/app/api/rework/route.ts`
- **ยืนยัน Ground Truth ปัจจุบัน**:
  * User Roles เหลือ 2 บทบาทจริง: **`QSMS`** (Admin / Management / Full Access) และ **`OPERATOR`**
  * Workflow การอัปเดตเคสจริง: **Dynamic Auto-Status Lifecycle** (`Pending ➔ In-Progress ➔ Completed`), Global & Item Progress ยอดกล่อง, และ **Material Shortage Blockers** (บันทึกอุปสรรค ขาดกล่อง/แกลลอน/น้ำมัน)
- **อัปเดต Presentation Deck**: ปรับ Slide 4 และ Slide 10 (`GuideApp.tsx` & `MockScreens.tsx`) ให้สะท้อนบทบาท QSMS และระบบ Dynamic Auto-Status & Blockers พร้อม Realistic Case Data สมบูรณ์แบบ

---

## 2026-08-05

### [WI] จัดทำเอกสารมาตรฐานวิธีปฏิบัติงาน WI-QSMS-AUTH-001
- จัดทำเอกสาร [WI_QSMS_AUTH_001.md](file:///c:/Workplace/Mytask/Projects/QSMS_project/docs/WI_QSMS_AUTH_001.md) ครอบคลุม Login, Register, และ Streamlined 2-Step Password Reset พร้อม Mermaid Flowcharts และ Visual Layout Schematics

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

## 2026-05-23

### [Testing] จัดทำระบบทดสอบอัตโนมัติ (Testing Pipeline)
- **Unit & Integration Testing (Vitest)**: ติดตั้งและตั้งค่า Vitest ร่วมกับ React Testing Library เขียนครอบคลุม 51 Test Cases ตรวจทานฟังก์ชัน helper, ฟอร์ม validation, และการเข้าถึงตามบทบาท (RBAC) ใน Auth Service
- **Bug Fix**: แก้ปัญหา BUG-011 จัดเรียงเคส Rework เพื่อแสดงสถานะ Pending ขึ้นลำดับแรกสุดตามด้วย In-Progress, Awaiting Valuation, และ Completed เสมอ พร้อมเรียงตามวันที่สร้างเคสจากล่าสุดลงมา
- **End-to-End Testing (Playwright)**: ตั้งค่าและเขียนสคริปต์ Playwright E2E 3 ชุด: หน้า Landing Page, ระบบล็อกอินด้วย PIN (Guest / Success / Failure / Logout), และระบบส่งฟอร์ม Rework พร้อมจำลองการดึงชื่อสินค้าอัตโนมัติ (Autofill) และระบบเลือกโมดอล
- **Wiki Update**: บันทึกหน้าเอกสาร [testing-pipeline.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/testing-pipeline.md) และลงทะเบียนใน [index.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/index.md) พร้อมบันทึก [log.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/log.md)

### [Ingest] สังเคราะห์ความรู้จากโฟลเดอร์ Raw และ Workspace (Deep Agents Framework, Harness Skills, Testsprite, & General Learnings)
- **Deep Agents Framework**: สังเคราะห์ความรู้เกี่ยวกับ Monorepo structure, core SDK components (filesystem, sub-agents, memory, skills), make commands, และ ruff/conventional commits coding guidelines จากโฟลเดอร์ `deepagents-main` และ raw markdown ลงใน [deepagents.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/agent-frameworks/deepagents.md)
- **Harness Skills**: บันทึกรูปแบบและการตั้งค่าบอร์ดทักษะ (Agent Skills) สำหรับการทำงานร่วมกับ AI Coding Assistants (Claude Code, Cursor, Copilot) และ Harness MCP v2 Server ลงใน [harness-skills.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/agent-frameworks/harness-skills.md)
- **Testsprite spec & tests**: จัดทำสเปกการทดสอบอัตโนมัติของสิทธิ์เข้าใช้งานตามบทบาท (RBAC) และการทดสอบ Golden Path โดยแปลงข้อมูลสเปกดิวและชุดรหัสทดสอบ Python Playwright ลงใน [testsprite-testing.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/testsprite-testing.md)
- **General Development Learnings**: รวบรวมบทเรียนการเขียนโปรแกรม การทำ Form validation, Google Sheets batch update logic, timezones direct parsing, และ dynamic SSR exclusion config (Hydration mismatch) ลงใน [development-learnings.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/lessons-learned/development-learnings.md)
- **Index Update**: อัปเดตลิสต์ของ Ingested files และลงทะเบียนลิงก์หน้าเอกสารใหม่ทั้งหมดลงในสารบัญหลัก [index.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/index.md)

### [RBAC] เพิ่มและกำหนดสิทธิ์ผู้ใช้กลุ่ม WFG และยุบรวมสิทธิ์ (Consolidation)
- **WFG Role Addition**: เพิ่มบทบาทใหม่ `WFG` เข้าสู่ระบบ RBAC เพื่อจำกัดการเข้าถึง
- **Portal & Routing Guards**: ซ่อนโมดูล Roster จากกลุ่มผู้ใช้ WFG, Operator และ PDB ใน WorkspacePortal และเขียน Guard block การเข้า URL โดยตรงใน `App.tsx`
- **Rework Permissions Consolidation**: อัปเดตระบบตรวจสอบสิทธิ์ให้ Operator, WFG และ PDB มีระดับสิทธิ์เดียวกันทั้งหมด คือสามารถ เพิ่มงาน อัปเดตสถานะเป็น "กำลังดำเนินการ" หรือ "รอประเมินราคา" ได้ สามารถใส่วัสดุและจำนวนชั่วโมงช่างได้ แต่ **ไม่สามารถกรอกช่องค่าใช้จ่าย (Cost/Unit Price)** และถูกตัดสิทธิ์การ Export ข้อมูล
- **Test Accounts**: เพิ่ม Mock credentials ใน `app/api/rework/route.ts` สำหรับการทดสอบด้วย `qsms`, `operator`, และ `finance`
- **Wiki Update**: บันทึกโครงสร้าง Permission matrix ที่อัปเดตใหม่ลงในหน้า [roles.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/nextjs-frontend/roles.md) และลงข้อมูลใน [log.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/log.md)

## 2026-05-26

### [Git & System] Git Pull และ Synchronize สภาพแวดล้อม
- **Git Pull**: ดึงโค้ดล่าสุดจากรีโมต `main` (fast-forward to 16262e7) ซึ่งแก้ไขระบบ Item Master Auto-fill และปรับปรุง UI
- **Stash Management**: ใช้ `git stash` เพื่อเก็บประวัติการแก้ไขและนำกลับมาใช้ผ่าน `git stash pop` ได้โดยสมบูรณ์
- **Dependencies Update**: รัน `npm install` อัปเกรด/คลีนแพ็กเกจ (ถอนออก 84 แพ็กเกจที่ไม่ได้ใช้งาน)

### [Ingest] สังเคราะห์และอัปเดต Wiki สมองส่วนลึก
- **LMS Tech Stack 2026 Ingestion**: สังเคราะห์ข้อมูลของ NotebookLM clip เกี่ยวกับ Next.js 19 + React 19 + Drizzle ORM + Zod + NextAuth v5 + Tailwind CSS v4 และการทำ Testing Pipeline (Vitest, Playwright) ลงใน [tech-stack-2026.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/architecture/tech-stack-2026.md)
- **Lessons Learned Sync**: ย้ายและรวมบทเรียนใหม่เข้ามาในระบบ Obsidian Wiki:
  - [rbac-casing-and-e2e.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/lessons-learned/rbac-casing-and-e2e.md) (เรื่อง UserRole Uppercase Enums และ Playwright Locators)
  - [item-master-upsert-flow.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/lessons-learned/item-master-upsert-flow.md) (เรื่อง Item Master Auto-fill, Debounce 600ms, การป้องกันการเขียนทับ, และการเตือน conflict)
  - [SESSION_KNOWLEDGE_2026_05_25.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/SESSION_KNOWLEDGE_2026_05_25.md) (เรื่องการปรับปรุง UX เรียงลำดับ, Remember Me, และ Explicit Date Icons)
- **Index Update**: ลงทะเบียนลิงก์ทั้งหมดลงในหน้าดัชนีความรู้หลัก [index.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/index.md)

## 2026-05-28

### [Integrity] พัฒนาระบบความถูกต้องของข้อมูล (Strict Integrity Rules)
- **Strict Identity Conflict Detection**: 
  - ปรับปรุง API `verifyItem` ให้ตรวจสอบความขัดแย้งระหว่าง `itemNumber` และ `itemCode` หากทั้งคู่ระบุสินค้าคนละรายการ (Mismatch) จะส่งคืนสถานะ `conflict` ทันที
  - เพิ่ม **Conflict Modal** แจ้งเตือนผู้ใช้ด้วยแอนิเมชันและข้อความเตือนสีแดง บล็อกการทำงานจนกว่าจะแก้ไขข้อมูลให้ถูกต้อง
- **Evidence Integrity (Mandatory Images)**:
  - แก้ไขตัวตรวจสอบความถูกต้อง (`validation.ts`) บังคับให้ทุกรายการสินค้าต้องมีรูปภาพอย่างน้อย 1 รูป มิฉะนั้นปุ่มบันทึกจะถูกปิดการใช้งาน (Disabled)
  - เพิ่มการแสดงผล "กรุณาแนบรูปภาพอย่างน้อย 1 รูป" ใน UI รายรายการ
- **Transaction Integrity (Atomic Submission)**:
  - ปรับปรุงลำดับการทำงานใน API `saveItemMaster` ให้ทำการซิงค์ข้อมูลไปยัง Google Sheets (GAS Proxy) ให้สำเร็จ **ก่อน** ทำการแก้ไขข้อมูลใน Supabase (Update/Merge/Insert)
  - หาก GAS Proxy ล้มเหลว ระบบจะระงับการบันทึกลงฐานข้อมูล Supabase ทันที เพื่อป้องกันข้อมูลไม่ตรงกันระหว่างสองระบบ (Consistency Protection)
- **Git**: Commit การเปลี่ยนแปลงระบบ Integrity ทั้งหมดเข้าสู่ `main` branch
- **Wiki Update**: อัปเดตบทเรียนการจัดการ Integrity และ Conflict ใน [item-master-upsert-flow.md](file:///c:/Workplace/QSMS_project/web-app-wiki/2_wiki/lessons-learned/item-master-upsert-flow.md)

## 2026-06-29

### [Librarian] ปรับปรุงบทบาท AI บรรณารักษ์ (Second Brain Protocol)
- แก้ไขไฟล์ [AGENTS.md](file:///c:/Workplace/Agent%20setup/.llm-wiki/AGENTS.md) ปรับปรุงกฎระเบียบของ AI Agent ให้ทำหน้าที่ดูแล จัดระบบ และรวบรวมคลังความรู้ Second Brain อย่างเดียวตามที่ผู้ใช้สั่ง ตัดโค้ดดิ้งและดีบั๊กกิ้งโปรโตคอลการทำแอปออกเพื่อประหยัด Token ในเซสชันถัดไป

### [Ingest & Synthesis] นำเข้าคลังข้อมูลดิบใน 1_raw/ ใหม่ทั้งหมดและเชื่อมโยงความรู้
ดำเนินการ Ingest ข้อมูลที่ค้างอยู่จาก `1_raw/` เข้าสู่คลังความรู้ถาวร `2_wiki/` สมบูรณ์ 100%:
- **Agent Dev Thai Ingestion**: สร้าง [[agent-frameworks/agent-dev-thai.md]] จากไฟล์ดิบ `Agent Dev Thai - AI เดา โกหก ทำเกิน ลืม...md` บันทึกกฎกันพฤติกรรมเอเจนต์พัง (4 Guardrails) และโครงสร้างบันทึก Memory.md
- **Ponytail Lazy Dev Ingestion**: สร้าง [[agent-frameworks/ponytail-lazy-dev.md]] จากไฟล์ดิบ `DietrichGebertponytail...md` บันทึกบันไดความขี้เกียจของนักพัฒนา 7 ขั้น (YAGNI & Laziness Ladder) เพื่อจำกัดจำนวนบรรทัดโค้ดสะสม
- **UI Glossary & Visual Dictionary Ingestion**: อัปเดต [[nextjs-frontend/ui-glossary.md]] จากไฟล์ดิบ `A complete UI glossary...md` และคัดลอกไฟล์รูปภาพสกรีนช็อต `screencapture-ui-design-dictionary-pages-dev-2026-06-29-20_13_39.png` ไปที่โฟลเดอร์ `.llm-wiki/picture/` พร้อมจำแนกและระบุรายการดีไซน์แพทเทิร์น 15 หมวดหมู่หลัก (118 รายการย่อย) เพื่อใช้เป็นดัชนีนำทางรูปแบบภาพสำหรับการออกแบบ UI
- **Mantine UI Ingestion**: อัปเดต [[lessons-learned/ui-libraries-resource.md]] ดึงข้อมูลจากไฟล์ดิบ `A fully featured React components library.md` บันทึกรายละเอียดของ `@mantine/form`, dates, tiptap, combobox, และเอกสาร `llms.txt` สำหรับเอเจนต์
- **Auth Flow & Roles Update**: อัปเดต [[nextjs-frontend/auth-flow.md]] และ [[nextjs-frontend/roles.md]] ดึงข้อมูลจากไฟล์ดิบ `AUTHENTICATION_IMPLEMENTATION_47689780.md` พร้อมใส่ข้อขัดแย้งเก่า-ใหม่ของบทบาท (Conflict Note)
- **Portal Shell Update**: อัปเดต [[nextjs-frontend/portal-shell.md]] เชื่อมโยงกับไฟล์แผนงาน `central_portal_plan_603507707.md`
- **CORS Fix Update**: อัปเดต [[architecture/cors-csp-setup.md]] เชื่อมโยงกับไฟล์คำแนะนำแก้บั๊ก `CORS_FIX_GUIDE_1557533658.md`
- **Development Learnings backfill**: รีไรท์ [[lessons-learned/development-learnings.md]] ดึงข้อมูลบทเรียนการพัฒนาทั้งหมด 36 รายการในอดีตจากไฟล์ดิบ `ForLearning_1941763098.md` สรุปอาการและโซลูชันแก้ไขในรูปแบบที่สแกนง่าย
- **Consolidated Flat Index**: รีไรท์สารบัญหลัก [[index.md]] ใหม่ทั้งหมด ลงทะเบียนลิงก์สัมบูรณ์ชี้ไปยังหน้าความรู้ทั้งหมด 64 ไฟล์จำแนกตามโครงสร้างโฟลเดอร์ 7 หมวดหมู่

## 2026-07-07

### [UI/UX & Layout] Rework หน้าต่างจัดการสถานะสินค้า (Update Status Modal Layout & Spacing)
- **Viewport Jumping Fix**: แก้ไขปัญหากระโดด/ดีดกลับไปบนสุดของ Viewport เมื่อกดพรีวิวรูปหรือเปิด Image Editor โดยห่อหุ้ม Lightbox และ Editor ภายใต้ React Portals (`createPortal` ชี้ตรงที่ `document.body`) เลี่ยง Stacking Context ของ Framer Motion parent component
- **Capped Materials Table Scroll**: จำกัดความสูงตารางวัสดุทั้งสองโหมดไว้ที่ `max-h-[220px]` และทำระบบเลื่อนแนวตั้ง/แนวนอนในกล่อง (`overflow-auto min-w-[500px]`)
- **Locked Right Column Scroll**: ตรึงแผงด้านขวาไม่ให้เลื่อนแยกเพื่อไม่ให้เกิด Scrollbar ซ้อนกัน 2 เส้น (`overflow-hidden`)
- **Responsive Layout Breakpoints**: ย้ายปุ่มดาวน์โหลดรายงานไปอยู่มุมขวาบนของ Header และปรับเปลี่ยนจุดตัดแถว (Grid split) ของฝั่งซ้ายและขวาในโหมด View เป็น `lg` (1024px) เพื่อไม่ให้บีบฟิลด์บนแท็บเล็ต
- **Tailwind Casing Fix**: เอาคลาส `uppercase` ของ Tailwind ออกจากป้ายกำกับสินค้า เพื่อคืนค่าสไตล์ Title Case ให้ป้ายกำกับ (`Batch`, `Mold`, `Line`, `Reason`) ตามจริงในซอร์สโค้ด
- **Resolution Field Removal**: ลบช่องป้อน/แสดงผลของ "วิธีแก้ไขปัญหา (Resolution)" ออกทั้งหมดตามคำสั่งผู้ใช้งาน เพื่อลดความเทอะทะของ UI
- **Wiki Update**: บันทึกบทเรียนลงใน [[lessons-learned/update-modal-layout-rework.md]] และลงทะเบียนสารบัญใน [[index.md]]

## 2026-07-14

### [Refactor] ปรับปรุง UpdateModal เป็น Feature-Sliced Design (FSD)
- สลาย Monolithic Component `UpdateModal.tsx` (~1,500 บรรทัด) ออกเป็นโครงสร้าง FSD ในโฟลเดอร์ `src/modules/rework/components/UpdateModal/`:
  - `UpdateModalContext.tsx`: จัดการสถานะ Business Logic และคำนวณราคา
  - `UpdateModalView.tsx`: เลเยอร์แสดงข้อมูลแบบอ่านอย่างเดียว (Presentation layer)
  - `UpdateModalEdit.tsx`: หน้าจอแก้ไขฟอร์มและจัดการ Material
  - `index.tsx`: Component Orchestrator ที่ใช้ห่อหุ้ม Provider
- **Build & Path Alignment**:
  - ลบไฟล์เก่า `src/components/modals/UpdateModal.tsx` ทิ้งเพื่อป้องกันการพังของคอมไพล์เลอร์
  - เปลี่ยนพาทนำเข้าใน Mock Screens, Tests และแอปหลักมาใช้ Absolute Path Alias `@/src/...` แทน Relative Path ป้องกัน Build Error
  - แก้ไขปัญหา Type Inference ใน `App.tsx` เนื่องจาก relative path ที่เสียใน auth views (`Login.tsx`, `Register.tsx`)

### [Librarian] ติดตั้งโปรโตคอลด่านตรวจความจำและจัดระเบียบ Raw Data
- **ปรับปรุงข้อตกลง Agent**: อัปเดตไฟล์ `AGENTS.md` ทั้งของ Oak ( root) และ Oil ( ใน `.llm-wiki/`) เพื่อใช้ระบบ **Validation Gate** และ **Tiered Classification** ในการคัดกรองนำเข้าข้อมูล
- **Ingestion & Conflict Detection**:
  - ประสานงานระหว่าง Oak และ Oil เพื่อตรวจพบว่าเอกสารดิบของรูปภาพ `IMAGE_UPLOAD_*.md` ระบุสเปกการอัปโหลดไป GAS/Drive ซึ่งล้าสมัยและขัดแย้งกับโค้ดจริงที่ใช้ Cloudinary
  - บันทึกการแก้ไขลงใน [[nextjs-frontend/image-upload-system.md]] พร้อมใส่เครื่องหมาย `[Conflict Note]` ชี้แจงข้อขัดแย้งเชิงประวัติเพื่อความสว่างแก่นักพัฒนาและโมเดลในอนาคต
  - เพิ่มประวัติแก้ไขปัญหาลง [[lessons-learned/bugs-and-fixes.md]] (BUG-019)
## 2026-07-15

### [Ingest & Feature] สร้าง Agent Skills และรวบรวมข้อมูลสำหรับรายงาน/พรีเซนเตชัน
- **คู่มือพรีเซนต์และรายงาน**: ค้นหาข้อมูลและสร้าง [[1_raw/presentation_and_report_guide.md]] รวบรวมหลักการทำรายงานวิทยานิพนธ์และพรีเซนเตชันที่ดีตามแนวทางวิชาการและการสื่อสารยุคใหม่
- **ระบบวิเคราะห์ทักษะโครงการ (Agent Skills)**: สร้างทักษะเฉพาะ (Project Skills) สำหรับเอเจนต์คู่หูพัฒนาใต้โฟลเดอร์ `.agents/skills/` 2 ชุด:
  - `project-reporter` - สำหรับสั่งการให้วิเคราะห์โค้ดและออกเลย์เอาต์รายงาน 5 บทบาททางวิทยานิพนธ์ รวมถึงพิมพ์โครงร่างสไลด์นำเสนอ (Presentation Slides Outline)
  - `project-workflow-generator` - สำหรับสั่งการให้วิเคราะห์ขั้นตอนและสร้างแผนภาพ (Mermaid.js Flowchart/Sequence Diagram) ครอบคลุม 5 งานหลักของโครงการ
- **การตั้งค่าเอเจนต์ (Agent configuration)**: ลงทะเบียน `agents/openai.yaml` ของทักษะทั้งสองเพื่อระบุดำเนินงานเป็น slash commands หรือ subagents ประจำตัว

### [Documentation] จัดทำรายงานวิทยานิพนธ์และเอกสารเชิงระบบ
- **รายงานวิทยานิพนธ์ (Thesis Report)**: สังเคราะห์ข้อมูลและจัดทำ `system_thesis_report.md` (5 บท) ครอบคลุมภาพรวมระบบ, สถาปัตยกรรม FSD, การทำงานของ Supabase, และแผนการทดสอบ พร้อมแทรกทฤษฎีอ้างอิงและหลักการทางวิศวกรรมซอฟต์แวร์ที่เกี่ยวข้อง (เช่น ACID, SoC, FSM)
- **แผนภาพระบบ (System Flow Diagrams)**: สร้าง `system_flow_diagrams.md` ด้วย Mermaid.js ประกอบด้วย 5 แผนภาพหลัก ได้แก่ Architecture, AI OCR Flow, Verification State Machine, Rework Lifecycle, และ RAG Ingestion Flow
- **สรุปไทม์ไลน์ฟีเจอร์ (Project Timeline)**: ดึงประวัติจาก Git Log ตั้งแต่จุดเริ่มต้น (เมษายน 2026) และสร้าง `project_timeline.md` เพื่อสรุปการเพิ่มฟีเจอร์ใหม่ที่ส่งผลต่อผู้ใช้ (User-facing features)

### [System] คลีนอัปและซิงค์ข้อมูล (Git Push)
- ทำการลบไฟล์และโฟลเดอร์เก่าที่ไม่ได้ใช้งาน (เช่น `archive_docs`, ทดสอบ `gas`, ไฟล์ `.cjs` และ `testsprite_tests`) เพื่อทำความสะอาด Workspace
- **Git Sync**: ทำการ Add, Commit และ Push งานล่าสุดทั้งหมด (เอกสารวิทยานิพนธ์, แผนภาพ, ไทม์ไลน์ และ FSD Refactoring) ขึ้นสู่ GitHub Branch `main` สมบูรณ์

## 2026-07-21

### [Bug Fix & Feature] แก้ปัญหา Payload Database และเปลี่ยนระบบเป็น Auto-Status
- **Database & Payload Mapping Issue**: 
  - แก้บั๊ก "column rework_cases.case_id does not exist" โดยดึง `case_id` ออกจาก Update Payload ก่อนที่จะบันทึกลง Supabase `rework_cases` เพราะตารางนี้ใช้ primary key ชื่อ `id` เท่านั้น
  - สร้าง Supabase Migration File (`20260720_add_completed_boxes_to_items.sql`) เพื่อเพิ่มคอลัมน์ `completed_boxes` ในตาราง `rework_items` อย่างเป็นทางการ
  - แก้ไขฟังก์ชัน `normalizeCaseItems` ให้ทำการแปลง `completed_boxes` จากฐานข้อมูลเข้าสู่ตัวแปร `completedBoxes` บน UI เพื่อให้หน้าจอมองเห็นยอดการทำงาน
- **Auto-Status Rework Logic (แนวทาง 1)**:
  - ยกเลิกการเลือกสถานะ (Status) แบบ Manual และทำการลบ Segmented Control ออกจากหน้าจอ `UpdateModalView` และ `UpdateModalEdit`
  - ทำการผูก Logic สถานะ `caseStatus` แบบ Dynamic Computed State อัตโนมัติ โดยคำนวณแบบ Real-time จากยอดการผลิต (`completedBoxes`) เทียบกับยอดรวม (`amount`) ของสินค้าทั้งหมดใน Case
  - หากยอดกล่องเป็น 0 แสดงเป็น "Pending", ยอดที่ทำไปแล้วบ้าง (แต่ยังไม่ถึง 100%) เป็น "In-Progress", และเมื่อครบ 100% จะแสดงเป็น "Completed"
  - ถอน Side-effect การกดยืนยันแล้วเติมกล่องเต็มอัตโนมัติออก เพื่อคืนความซื่อตรงของข้อมูล
- **Validation**: ผ่านการตรวจสอบ Type Check (`tsc --noEmit`) และเตรียมเข้าสู่ขั้นตอน Manual E2E Validation โดยผู้ใช้

### [Knowledge Ingestion] อัปเดตคลังสมอง AI (Second Brain)
- ดำเนินการ Ingest บันทึกความรู้เรื่องบั๊ก (BUG-020 และ BUG-021) เข้าสู่ `lessons-learned/bugs-and-fixes.md` เพื่อป้องกันโมเดลลืม
- เพิ่มบันทึกเหตุการณ์วันที่อัปเดตระบบใน `project-history.md` เพื่อสร้างไทม์ไลน์ Phase 3: System Stability
- อัปเดต Log หน้าไทม์ไลน์การทำงานให้เป็นวันที่ปัจจุบัน (21 กรกฎาคม 2026)

### [Refactor] ถอดระบบการเงิน (Finance Role & Valuation)
- **ลบ Role FINANCE**: ถอดบทบาท FINANCE ออกจากระบบ RBAC ทั้งหมด (`auth.config.ts`, `serverAuth.ts`, `PermissionsModal.tsx`, `ReworkApp.tsx`)
- **ลบฟิลด์ประเมินราคา**: ถอด `reworkCost`, `laborRate`, `laborHours`, `laborCount`, `materials`, `actualCost` ออกจากการคำนวณและการแสดงผลในทุกจุด (Dashboard, UpdateModal, API layer, Export PDF/Excel)

### [Refactor] ควบรวม PDB และล้างการเชื่อมโยง Google Apps Script (GAS)
- **Consolidate PDB Role**: ลบตัวแปร `isPDB` ออกจาก `UpdateModalContext` และ `UpdateModalView` โดยเปลี่ยนไปใช้ `isOperator` / `isAdmin` ทั้งหมด ถอดตัวเลือก PDB ออกจาก SFC subdivision และลบ alias ใน `serverAuth.ts`
- **GAS & Google Sheets Cleanup**: เปลี่ยนข้อความสถานะ `Updating Google Sheets...` ใน `useSaveProgress.ts` เป็น `Updating Database...`, ปรับแก้ Mock message ใน `e2e/rework-update.spec.ts`, และอัปเดตคำอธิบายใน `README.md` และ `system_flow_diagrams.md` ให้ระบุว่าใช้ Cloudinary และ Supabase 100%

## 2026-07-23

### [Feature & Refactor] Decoupled Drawings vs Master Schema & Master-Detail Inspection Workspace
- **Decoupled Document Schema Forms**:
  - แยกแบบฟอร์ม Drawing และ Master Sheet ออกจากกันตามความจริงของเอกสาร
  - **Drawing PDF Form (7 ฟิลด์)**: `drawing_number` (Drawing No), `revision`, `customer_name`, `item_code` (Customer Item Code `4000xxxx`), `part_name`, `issue_date`, `package_size`
  - **Master Sheet Form (8 ฟิลด์)**: `drawing_number` (Doc No), `revision`, `item_code`, `item_number` (Master Formula Code `61653013A700A`), `part_name`, `oil_group`, `pallet_type`, `boxes_per_pallet`, `shelf_life`
  - อัปเดต `UploadModal.tsx`, `EditDocumentModal.tsx`, และ `DocumentInspectionPanel.tsx` ให้ปรับเปลี่ยนฟิลด์ที่แสดงและส่งบันทึกตามประเภทเอกสาร
- **Side-by-Side Master-Detail Inspection Workspace Panel**:
  - สร้างคอมโพเนนต์ `DocumentInspectionPanel.tsx` และอัปเดต `DocumentList.tsx` ให้แสดงผลแบบ 55/45 Split View Workspace ทันทีเมื่อคลิกเลือกแถวในตาราง
  - รองรับการกดปุ่มลูกศร `ArrowUp` / `ArrowDown` เพื่อเปลี่ยนสลับรายการตรวจทาน และ `Escape` เพื่อปิดแผง
- **PDF Auto-Orientation & Rotation Persistence Engine**:
  - ติดตั้ง Toolbar หมุนเอกสาร PDF (0°, 90°, 180°, 270°) พร้อมปุ่ม **Landscape View** 1-click
  - บันทึกองศาการหมุนลงใน `localStorage` (`qsms_pdf_rot_<id>`) เพื่อคงทิศทางเดิมเมื่อกลับมาเปิดดูอีกครั้ง

---

## 2026-08-05

### [V&V & Quality] Verification & Validation Across All Core Modules
- **Module Rework V&V**: Fixed 6 defects (BUG-R01..R06) covering SLA calculation timezones, date formatting inconsistencies, zero-value restrictions, cross-item link source cleanups, and image upload error handling.
- **Module Auth V&V**: Fixed 4 defects (BUG-A01..A04) covering password strength validation, role casing normalization, session restore fallback, and toast notifications.
- **Module Drawings V&V**: Fixed 4 defects (BUG-D01..D04) covering package size normalizer edge cases, oil group inference, revision padding, and customer name alias matching.
- **Module Storage V&V**: Fixed 4 defects (BUG-S01..S04) covering `ResizeObserver` initialization, duplicate pagination network calls, and modal keydown listener guards.
- **Module Guide & RAG V&V**: Fixed 3 defects (BUG-G01..G03) covering slide index `NaN` closure scope in `GuideApp.tsx` and Gemini embedding property extraction path in `/api/rag/route.ts`.
- **Module Platform V&V**: Fixed 3 defects (BUG-P01..P03) adding helper utilities `getPortalAppById` and `getActivePortalApps` in `appRegistry.ts` and expanding `ModularizationBoundary.area` type union in `types.ts`.
- **Testing Suite Expansion**: Expanded unit test suite to 12 files (113 passing tests) and 5 Playwright E2E spec files (9 passing specs).

### [Feature & Normalization] Boxes Per Pallet Normalization ("ตามความเหมาะสม")
- **Gemini OCR Prompt Update**: Updated system prompts in `src/app/api/drawings/route.ts` instructing AI to return "ตามความเหมาะสม" directly when specified in document remarks without guessing numeric values.
- **Normalizer Enhancement**: Updated `normalizeBoxesPerPallet` in `src/app/api/drawings/normalizers.ts` to detect keyword variations of "ความเหมาะสม" / "appropriate" and normalize to "ตามความเหมาะสม".
- **UI Table Renderer Update**: Updated `DocumentList.tsx` table column renderer to display raw string value directly without hardcoded "boxes/pallet" suffix.
- **Unit Tests Added**: Added 3 unit test assertions in `src/app/api/drawings/normalizers.test.ts`.

### [Ingestion & Root Context Sync] Mandatory Project Knowledge Sync
- Synchronized all 5 root context files (`CONTEXT.md`, `GEMINI.md`, `README.md`, `USER_GUIDE.md`, `PRODUCT.md`) to 100% match active codebase implementation.
- Updated `.llm-wiki/2_wiki/log.md`, `lessons-learned/bugs-and-fixes.md`, and `index.md`.

---

## 2026-08-26

### [Feature & UX Overhaul] CaseUpdateView AddCaseTab 4-Block Parity, Focus Ring Uniformity & Floating Progress Island
- **AddCaseTab 4-Block Form Parity**:
  - Re-architected item editing cards in `CaseUpdateView.tsx` into 4 dedicated, balanced blocks:
    - **Block 1 (Main Product Info)**: Customer Name, Item Number, and Item Code in balanced 3-column top row + full-width Item Name below.
    - **Block 2 (Spec & Production Sub-Panel)**: Sub-panel with subtle background (`bg-slate-50/80 rounded-2xl`) housing 5 evenly proportioned fields (Batch No, Gallon Date, Mold, Line, Amount / Boxes in Indigo).
    - **Block 3 (Defect Cause & Responsibility)**: 2-column paired selectors for Reason (Primary + Subtype) and Responsible (Unit + Department/Supplier) + full-width Defect Details/Notes below.
    - **Block 4 (Photo Evidence & Save Action)**: Evidence thumbnail gallery with Lightbox + Add Photo button + `[💾 บันทึกรายการนี้ ➔ ย้ายลงล่าง]` action button.
- **Input Focus Ring Uniformity & Spinner Cleanup**:
  - Eliminated browser default heavy black focus outline on number inputs by adding `focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20` across all inputs.
  - Stripped native browser number spinner arrows via `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`.
- **Per-Item Save & Focus Queue Engine (`handleSaveSingleItem`)**:
  - Uploads staged evidence photos for the specific item to Cloudinary (unsigned target 300KB) and persists to Supabase.
  - Automatically collapses the saved item, shifts it to the bottom of the list, and expands the next incomplete item in queue.
  - Real-time status badges on card headers: `🟢 ✓ ข้อมูลสมบูรณ์`, `🟡 ⚠️ อัปเดตแล้ว`, `⚪ ⏳ รอตรวจสอบ`.
- **Floating Save Progress Island & Top Glowing Stripe**:
  - Removed disruptive inline progress bar that replaced Header action buttons.
  - Introduced a 3px top-edge glowing gradient progress stripe (`h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-500`).
  - Added bottom-center Floating Dynamic Island (`fixed bottom-6 left-1/2 -translate-x-1/2`) showing animated loader, real-time percentage, and status message.
- **Database Schema Cache Resilience**:
  - Added fallback retry mechanism in `src/app/api/rework/route.ts` when PostgREST schema cache encounters missing columns on update.
- **Testing & Quality Assurance**:
  - `npx tsc --noEmit`: 0 TypeScript errors.
  - `npx vitest run`: 22/22 test suites passing (144/144 tests).




