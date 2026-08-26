# GEMINI.md - QSMS Project Context

เอกสารนี้ทำหน้าที่เป็นจุดเริ่มต้น (Entry Point) สำหรับ AI/LLM หรือ Agent (เช่น Gemini, Claude) เพื่อให้เข้าใจบริบท โครงสร้าง สถาปัตยกรรม และการทำงานของโปรเจกต์ **QSMS Rework Management System** ได้ทันทีโดยไม่ต้องคาดเดา

---

## 1. ภาพรวมการใช้งาน (Overview)
**QSMS Rework Management System** คือระบบจัดการและติดตามสินค้าที่ต้องผ่านกระบวนการ Rework (ทำใหม่/แก้ไข) 
- **Core Features:** 
  - การบันทึกและจัดการ Rework Case (Case ID) และรายการสินค้า (Rework Item)
  - การดึงข้อมูลอัตโนมัติและการตรวจสอบความถูกต้องของสินค้าจากฐานข้อมูลกลาง (Item Master)
  - การอัปโหลดรูปภาพหลักฐานและการยืนยันความสมบูรณ์ของข้อมูล (Evidence & Transaction Integrity)
  - การแบ่งสิทธิการทำงาน (Role-Based Access Control) ระหว่าง **QSMS (Admin/Full Access)** และ **OPERATOR**
  - ระบบถามตอบคู่มือเทคนิคและแนวทาง Rework อัจฉริยะ (DocAI RAG) ที่มีบุคลิกภาพแบบเป็นมืออาชีพและเพียบพร้อมด้วยข้อมูลสถิติ

---

## 2. Architecture (สถาปัตยกรรม)
ระบบถูกออกแบบด้วยสถาปัตยกรรมแบบ **Hybrid Next.js + React SPA** ควบคู่กับระบบ Backend แบบ Serverless:
- **Next.js API Boundary (`src/app/api/*/route.ts`):** 
  ทำหน้าที่เป็น Server Boundary สำหรับจัดการความปลอดภัย, Authentication, ควบคุมการเชื่อมต่อกับ Supabase, รวมถึงการซ่อน Secrets ต่างๆ
- **React Client Shell (`src/App.tsx` & Frontend Modules):** 
  ทำงานบนฝั่ง Client เป็นหลัก ดูแลเรื่อง View, Session Restore, Role-based Routing และจัดการ State ภายใน UI อย่างลื่นไหล 
- **Operational Database (Supabase):** 
  ฐานข้อมูลหลักของระบบที่ใช้เก็บข้อมูลทั้งหมดแบบ Real-time และจัดการ Authentication
- **Image Storage (Cloudinary):**
  ระบบจัดการและจัดเก็บรูปภาพหลักฐาน Rework (Evidence Images) โดยใช้วิธี Unsigned Upload โดยตรงจาก Frontend (Client-side) เพื่อลดปัญหาข้อจำกัดขนาด Base64 และลดโหลดเซิร์ฟเวอร์

- **DocAI RAG Engine (Gemini & Jina AI):**
  โมดูลสืบค้นปัญญาประดิษฐ์ (Retrieval-Augmented Generation) ค้นหาคู่มือเทคนิคและแนวทางการแก้ไขงาน Rework ทำงานโดยใช้ Supabase pgvector ร่วมกับ Jina AI Embeddings (`jina-embeddings-v5-text-small` ขนาด 768 มิติ) และ Gemini ในการสร้างคำตอบที่เป็นธรรมชาติ
  - **Parsing Ingestion:** ใช้ `gemini-3.1-flash-lite` สำหรับแปลงเอกสาร PDF และรูปภาพคู่มือเป็น Markdown โดยมีระบบ Fallback ไปยัง `gemini-2.0-flash` เมื่อเจอปัญหา 503 ในช่วงการทำงานที่มีโหลดสูง
  - **Chat Interface:** ใช้ `gemini-3.1-flash-lite` ในการตอบคำถามผู้ใช้งานผ่าน SSE Stream ร่วมกับระบบ Function Calling (`get_rework_statistics`) สำหรับเรียกดูสถิติสดย้อนหลัง
  - **Drawing & Master Metadata Extraction:** ระบบวิเคราะห์แบบแปลนวิศวกรรม (Engineering Drawings) และใบมาสเตอร์ภายใน (Internal Master Sheets) ผ่าน API Endpoint `src/app/api/drawings` โดยใช้ **`gemini-3.1-flash`** เป็นโมเดลหลัก (และ **`gemini-3.1-flash-lite`** เป็นตัวสำรอง) เพื่อทำ OCR และสกัด Metadata ต่างๆ กลับคืนมาในแบบ Structured JSON (Structured Outputs) ทันทีหลังพนักงานอัปโหลดไฟล์ PDF

---

## 3. Flow การทำงาน (Workflow)
การทำงานหลักของระบบผ่าน Lifecycle ดังนี้:

1. **Case Initiation (เริ่มสร้างงาน):**
   - นำเข้าข้อมูลอ้างอิงจากเอกสาร RT/RW
   - ระบบจะจ่าย **Case ID** (Hybrid Assignment) ซึ่งไม่สามารถซ้ำหรือแก้ไขได้ (Immutable) เช่น `RW012-2026` (สำหรับ SFC) หรือ `RT012-2026` (สำหรับ Customer)
2. **Two-Way Autofill & Verification (ตรวจสอบสินค้า):**
   - เมื่อกรอกรหัส Item Number หรือ Item Code ระบบจะสืบค้นข้อมูลจาก Item Master ทันที
   - **Verification Lifecycle:** สถานะจะเปลี่ยนจาก `Idle` -> `Checking` -> `Verified` (พบข้อมูล) / `New` (สินค้าใหม่) / `Conflict` (ข้อมูลขัดแย้ง)
   - **Rework Item Granular Fields:** นอกจากรหัสสินค้าแล้ว เคส Rework แต่ละรายการจะเก็บข้อมูลฟิลด์ล็อตเพิ่มเติม ได้แก่ หมายเลขล็อต (Batch No), วันที่ผลิตแกลลอน (gallonDate), เลขกล่อง (boxNumber / จำนวนกล่อง), หมายเลขแม่พิมพ์ (mold) และสายการผลิต (line)
   - **Zero-Value Restriction:** ระบบตรวจเช็คและล็อกไม่ให้ผู้ใช้งานระบุจำนวนสินค้า (`amount`) หรือจำนวนกล่อง (`boxNumber`) เป็น 0 เพื่อป้องกันข้อมูลผิดพลาดในระบบ
3. **Cross-Item Linking & Document Validation (เงื่อนไขและประเภทงานเฉพาะ):**
   - **Cross-Item Link:** หากตรวจพบสินค้าเปื้อน ('เปื้อน') และในเคสเดียวกันมีสินค้าที่รั่ว ('รั่ว') ระบบจะเปิดตัวเลือกให้เชื่อมโยงสาเหตุสินค้าเปื้อนไปยังไอเทมที่รั่วได้ (บันทึกลงฟิลด์ `linkedSourceId`)
   - **PTT OR Documents:** เคสที่ลูกค้าระบุเป็น "OR" จะเปิดช่องพิเศษให้แนบไฟล์เอกสารอ้างอิงสำหรับ OR ได้สูงสุด 2 ไฟล์ (.xlsx, .xls, .pdf, .png) หากไม่มีการอัปโหลด หน้าเว็บจะแสดง Badge เตือน "ขาดไฟล์ OR" สีแดงบนตารางภาพรวม
4. **Smart Master Upsert (บันทึกฐานข้อมูลกลาง):**
   - หากเป็นสินค้าใหม่ หรือ Incomplete Item (ข้อมูลไม่ครบ) ระบบจะทำการอัปเดตหรือเพิ่มข้อมูลเข้า Item Master ทันทีในพื้นหลัง
5. **Transaction & Evidence Integrity (ยืนยันรูปภาพ):**
   - ทุกรายการ rework ต้องมีรูปภาพหลักฐานอย่างน้อย 1 ภาพ (Evidence Integrity) โดยใช้การบีบอัดรูปภาพฝั่ง Client ก่อนอัปโหลด (target 300KB)
   - หากเกิดข้อผิดพลาดในการอัปโหลดรูป ระบบจะ Rollback ธุรกรรมทั้งหมดทันทีเพื่อป้องกันข้อมูลขยะ
6. **Rework Updates (การอัปเดตงาน & จัดการสถานะ):**
   - **Operator / Admin (QSMS):** อัปเดตยอดกล่องผลิตเสร็จ (Progress) ผ่าน Global/Item inputs พร้อมปุ่ม "สูงสุด" และบันทึกอุปสรรคหน้างาน/วัสดุที่ขาด (ขาดกล่อง, ขาดแกลลอน, ขาดน้ำมัน) ซึ่งจะล้างค่าอัตโนมัติเมื่อสถานะเปลี่ยนเป็น Completed
   - **Dynamic Auto-Status Lifecycle:** สถานะของเคสจะถูกคำนวณอัตโนมัติจากยอดกล่องที่ทำเสร็จจริงเทียบกับยอดรวมทั้งหมด โดยไม่ต้องเลือกสถานะเอง (`Pending` [0%] -> `In-Progress` [>0%] -> `Completed` [100%])
7. **Excel Export with Images (การส่งออกไฟล์ข้อมูล):**
   - ระบบรองรับการ Export ตารางรายงานเคสออกมาเป็นไฟล์ Excel (.xlsx) ที่มีรูปหลักฐานฝังอยู่ด้านในโดยตรง (ผ่านไลบรารี `exceljs`) โดยปรับความสูงแถวเป็น 120px และตกแต่งสีหัวตารางสวยงาม
8. **RAG Ingestion Pipeline (การนำเข้าคู่มือ):**
   - การอัปโหลดไฟล์ PDF ในแท็บเอกสารของ DocAI จะทำการแปลงหน้า PDF เป็นรูปภาพ JPEG (ผ่าน `pdfjs-dist`) อัปโหลดไป Supabase Storage แล้วส่งให้ Gemini Vision ทำการแปลงเนื้อหาพร้อมแผนภาพเป็น Markdown จากนั้นจึงคำนวณเวกเตอร์ embeddings ผ่าน Jina AI และบันทึกลง Supabase
   - **RAG Bulk Deletion:** ผู้ดูแลสามารถเลือกเอกสารหลายรายการใน Checklist เพื่อสั่งลบเอกสารและข้อมูลเวกเตอร์ชิ้นส่วนที่เกี่ยวข้องพร้อมกันผ่าน API (`bulk_delete_documents`)
9. **AI-Assisted Drawing & Master Parsing (การดึงข้อมูลแบบแปลนอัตโนมัติ):**
   - เมื่อผู้ใช้ทำการอัปโหลดไฟล์ PDF เข้าสู่ระบบในหน้าจอ Drawing/Master ระบบจะส่งไฟล์ Base64 ไปยังเซิร์ฟเวอร์
   - Gemini AI จะทำหน้าที่ทำ OCR และวิเคราะห์เอกสารสแกนเพื่อแกะข้อมูลฟิลด์ต่าง ๆ โดยมีระบบ Fallback อัตโนมัติ (`gemini-3.1-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-2.0-flash`) เพื่อรองรับ 503 high demand spikes
10. **Decoupled Document Schema Forms (แยกฟอร์มเอกสารตามสเปกจริง):**
    - แยกสีกำกับและโครงสร้างแบบฟอร์ม Drawing (7 ฟิลด์) และ Master Sheet (8 ฟิลด์) ออกจากกันอย่างเด็ดขาดเพื่อไม่ให้มีฟิลด์ N/A สับสน
    - **Drawing PDF:** `drawing_number`, `revision`, `customer_name`, `item_code` (รหัสสินค้าลูกค้า 4000xxxx), `part_name`, `issue_date`, `package_size`
    - **Master Sheet:** `drawing_number` (Doc No), `revision`, `item_code`, `item_number` (รหัสสูตรการผลิต 61653013A700A), `part_name`, `oil_group`, `pallet_type`, `boxes_per_pallet`, `shelf_life`
11. **Side-by-Side Inspection Workspace & PDF Auto-Orientation (แผงตรวจทานเอกสาร & ระบบหมุนภาพ):**
    - **55/45 Split View Panel:** เมื่อคลิกเลือกแถวในตาราง หน้าจอจะสไลด์เปิดแผงตรวจทานฝั่งขวาทันที รองรับการสลับแบบแปลนด้วยปุ่มลูกศร `ArrowUp` / `ArrowDown` และกด `Escape` เพื่อปิด
    - **PDF Orientation Toolbar:** เครื่องมือหมุน PDF 0°, 90°, 180°, 270° พร้อมปุ่ม **Landscape View** 1-click และบันทึกองศาการหมุนลงใน `localStorage` (`qsms_pdf_rot_<id>`) เพื่อคงทิศทางให้อ่านง่ายตลอดเวลา
12. **Boxes Per Pallet Normalization ("ตามความเหมาะสม"):**
    - หากเอกสารระบุจำนวนกล่องเป็นข้อความแบบ "ตามความเหมาะสม" หรือ "appropriate" ทั้งระบบ Gemini OCR Prompt และฟังก์ชัน `normalizeBoxesPerPallet` จะคืนค่าเป็นข้อความ "ตามความเหมาะสม" โดยตรง ป้องกันการสุ่มเดาตัวเลขผิดพลาด
13. **Presentation Deck & Interactive Sandboxes (คู่มือนำเสนอสไลด์ & หน้าต่างจำลองสด):**
    - **30/70 Side-by-Side Canvas:** จัดวางผังหน้าจอแบบ Side-by-Side (30/70) ใน Canvas 2560x1440 พร้อมระยะขอบที่สมดุล ไม่ล้นจอ
    - **Apple Liquid Glass Design System:** การ์ดคำอธิบายใช้ `.liquid-glass-card` (Multi-layer Refraction Gradient, 1.5px Specular Rim, Inset Depth Reflections, Backdrop Blur 40px + Saturate 200%) พร้อม `.liquid-glass-pill` badge และ Ambient Glowing Orbs
    - **Fit & Scrollable Mac Sandbox Window:** หน้าต่างจำลองสไตล์ Mac OS Window Header พร้อม Live Interactive Sandbox status และระบบ Scroll ภายในสมบูรณ์แบบ
14. **Interactive Hotspot & Multi-Field Glow Highlighting (ระบบนำชมแบบอินเตอร์แอคทีฟ):**
    - Hotspot Tooltip เด้งขึ้นด้านบน (`bottom-full mb-4`) ป้องกันการตกมาบดบังอินพุตและกล่องอัปโหลดรูปภาพ
    - รองรับ `targetId` แบบอาร์เรย์ (`string | string[]`) ช่วยให้สามารถไฮไลท์เรืองแสงช่อง Item Number และ Item Code พร้อมกันเมื่อชี้ Hotspot "Smart Auto-fill"
15. **Interactive Excel Form Preview Modal (การจำลองฟอร์ม Excel จริง):**
    - หน้าต่างพรีวิวเอกสาร `.xlsx` จริงใน Slide 14 สไตล์ Microsoft Excel Ribbon (`bg-[#107C41]`)
    - แสดงโครงสร้างหัวตารางรายงาน SFC Rework Report, Quick Info Grid, ตารางสินค้า และรูปถ่ายหลักฐานฝังในเซลล์ความสูง 120px พร้อมปุ่มปิดตัวอย่างและดาวน์โหลด
16. **Slide Transition Hardware Acceleration (การเรนเดอร์สไลด์แบบ 60/120fps):**
    - ลบ CSS `filter: blur(...)` ออกจาก `slideVariants` และใช้ GPU Spring Translation (`x`), `opacity` และ `scale` แบบ Hardware Compositing (`transform-gpu`, `will-change-transform`)
    - ตัดวงจร Simulation Auto-Run ข้ามสไลด์ด้วย `prevSimTriggerRef` และ Reset Trigger ทุกครั้งที่เปลี่ยนสไลด์
17. **Direct-Manipulation Zoom & Pan Engine (ระบบซูมและเลื่อนแบบไร้รอยต่อ):**
    - ปรับปรุงการคำนวณ Screen-Space 1:1 Translation (`translate3d(panOffset.x, panOffset.y, 0) scale(...)`)
    - ยกเลิก CSS Transition ขณะกำลังลาก (`transition-none pointer-events-none select-none`) ทำให้เมาส์ลากติดมือทันทีไม่มีอาการดีเลย์
    - ผูก Window Global Event Listeners (`window.addEventListener('mousemove'/'mouseup')`) ทำให้ลากต่อเนื่องได้ทั่วหน้าจอโดยไม่หลุดขอบ พร้อมระบบ Dynamic Boundary Clamping
18. **Mobile-First Rework Card Layout & DocAI FAB Positioning (ระบบแสดงผลบนมือถือและการ์ดสินค้า):**
    - แปลงแถวตารางใน `CaseListTable.tsx` เป็น Mobile-First Card Layout ขยายชื่อสินค้าเต็มความกว้าง (Full-width) และจัดกลุ่มยอดกล่อง/หลอดความคืบหน้า/ป้ายสถานะเข้ามุมด้านล่าง ไม่บีบตัดคำ 7-8 บรรทัดบนจอ 390px (iPhone 13)
    - ย้ายตำแหน่งปุ่มลอย DocAI Assistant เป็น Floating Action Button (FAB Icon) กะทัดรัดที่มุมขวาล่าง (`bottom-20 right-4 sm:bottom-6 sm:right-6`) พร้อมเพิ่ม Padding เลื่อนด้านล่าง `pb-28 sm:pb-8` ใน `OverallTab.tsx` ไม่ทับปุ่มเปลี่ยนหน้า
19. **CaseUpdateView 2-Tier Header & Item Accordion Folding (แผงควบคุม 2 ชั้นและการพับเก็บรายการสินค้า):**
    - จัดโครงสร้างแถบ Header เป็น 2 ชั้นแบบ Responsive บนมือถือ (`flex-col sm:flex-row`) แยกส่วนหัว/รหัสเคสไว้แถวบน และแถบปุ่ม Action ([ส่งออก Excel], [ลบเคส], [บันทึกร่าง], [บันทึกเสร็จสิ้น]) ไว้แถวล่าง ป้องกันการทับซ้อนกัน
    - ปรับรายการสินค้าทั้งหมดให้เป็นแบบ **Accordion (พับเก็บได้เป็นค่าเริ่มต้น)** พร้อมปุ่มลัดสลับ "ขยายข้อมูลทั้งหมด / พับข้อมูลทั้งหมด" เพื่อประหยัดพื้นที่หน้าจอบนอุปกรณ์พกพา
20. **Academic Thesis Word Document & Presentation Touch Navigation (เอกสารรายงานวิทยานิพนธ์ & การนำทางสไลด์สัมผัส):**
    - สร้างสคริปต์สังเคราะห์รายงานวิทยานิพนธ์ฉบับสมบูรณ์ `QSMS_Project_Thesis_Report.docx` (3.10 MB) ตามมาตรฐานรูปแบบเล่มของสถาบันการจัดการปัญญาภิวัฒน์ (PIM) 5 บท ฝัง 9 Figures ไดอะแกรมความละเอียด 300 DPI และ 7 UI Screenshots
    - เพิ่มระบบตรวจจับการปัดนิ้วสัมผัส Touch Gestures (`onTouchStart`, `onTouchEnd`), แถบควบคุมสไลด์ลอยด้านล่างบนมือถือ (`md:hidden`) และปุ่มลอยสำหรับออกจากโหมดพรีเซนต์ (`GuideApp.tsx`)

---

## 4. Tech Stack (เทคโนโลยีที่ใช้งาน)
เทคโนโลยีหลักที่ใช้ในโปรเจกต์อ้างอิงจาก `package.json` ล่าสุด:

- **Core Framework:** Next.js (v16.2), React (v19) - จัดการ Routing และโครงสร้างเว็บหลัก
- **Styling & UI:** Tailwind CSS (v4), Framer Motion (`motion/react`), Radix UI Primitives, Lucide React (Icons)
- **Database & Auth:** Supabase (`@supabase/supabase-js`)
- **Language & Typings:** TypeScript (v5.8)
- **Build Tool:** Next.js Compiler (Vite ถูกจำกัดบทบาทไว้ใช้เฉพาะสำหรับการรัน Vitest เท่านั้น)
- **Testing:** Playwright (E2E Testing ในโฟลเดอร์ `/e2e`), Vitest (Unit Testing ทั่วระบบ)
- **Utilities:** Excel Generation (`exceljs`), PDF Generation (`jspdf`, `html2canvas`), Image Compression (`browser-image-compression`), PDF Rendering (`pdfjs-dist`), Image Storage (`cloudinary` API)

---

## 5. กฎข้อบังคับสำหรับ Agent (Agent Protocols)
อ้างอิงจาก `AGENTS.md` - กฎการทำงานสำคัญที่ AI ทุกตัวต้องปฏิบัติตาม:
- **ห้ามเดา (No Guessing):** ต้องสำรวจ Source Code, อ่าน `.llm-wiki/2_wiki/index.md` ก่อนลงมือแก้ไข
- **ห้ามใช้ Any:** ให้ใช้ `unknown` หรือปล่อยให้ Type inference จัดการแทน (มีกฎเข้มงวด `"noImplicitAny": true` ใน `tsconfig.json`)
- **จัดการ Wiki เสมอ:** ถ้าแก้บั๊กหรือพัฒนาฟีเจอร์สำคัญเสร็จ ให้พิจารณาว่าต้องอัปเดต `.llm-wiki/2_wiki` เพื่อส่งต่อความรู้ให้ AI รอบถัดไปหรือไม่
- **Scope การแก้ไข:** ให้แก้ไขใน Scope ที่เล็กที่สุดและกระทบโค้ดเดิมน้อยที่สุด เคารพการออกแบบของเดิม
- **Accessibility & UX:** ต้องรองรับ reduced motion เสมอโดยอิงตาม `@media (prefers-reduced-motion: reduce)` และรักษาความเสถียรของหน้าจอด้วย `scrollbar-gutter: stable`

> **Guideline:** ควรอ่าน `CONTEXT.md` (สำหรับคำศัพท์เฉพาะ) และ `AGENTS.md` เพิ่มเติมเพื่อตรวจสอบ Best Practice ของโปรเจกต์ก่อนเริ่มเขียนโค้ดเสมอ
