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
   - **RT vs RW Document Gate**: เคส **RT (ลูกค้า)** บังคับต้องมีเอกสารแนบ (เช่น ใบส่งของ, ใบแจ้งเคลม, ไฟล์ Excel/PDF อ้างอิง) อย่างน้อย 1 ไฟล์ก่อนเปิดเคส ส่วนเคส **RW (SFC ภายใน)** สามารถเปิดเคสได้ทันทีโดยไม่ต้องแนบเอกสาร (เอกสารแนบเป็น Optional)
   - ระบบจะจ่าย **Case ID** (Hybrid Assignment) ซึ่งไม่สามารถซ้ำหรือแก้ไขได้ (Immutable) เช่น `RW-2026-001` (สำหรับ SFC) หรือ `RT-2026-001` (สำหรับ Customer)
2. **Item Autofill & Verification (ตรวจสอบสินค้าผ่านปุ่มแว่นขยาย):**
   - **Manual Search via Magnifying Glass**: ปัจจุบันเปลี่ยนจากการค้นหาอัตโนมัติขณะพิมพ์ มาเป็นการกดปุ่มไอคอนแว่นขยาย (`<Search size={15} />`) ท้ายช่องอินพุต หรือกดปุ่ม `Enter` บนช่อง `Item Number` / `Item Code` เพื่อค้นหาข้อมูลจาก Master ป้องกันการยิง API ถี่เกินไปและป้องกันข้อมูลเด้งทับขณะพิมพ์
   - **Verification Lifecycle:** เมื่อกดค้นหา สถานะจะเปลี่ยนจาก `idle` -> `checking` -> `verified` (พบข้อมูลและ Autofill ให้ทันที) / `new` (สินค้าใหม่) / `conflict` (ข้อมูลขัดแย้ง)
   - **Cross-Item Check First:** ตรวจสอบข้อมูลในเคสเดียวกันก่อน หากพบรหัสตรงกันจะดึงข้อมูลมาเติมให้ทันทีก่อนสืบค้นฐานข้อมูลกลาง
   - **Rework Item Granular Fields:** นอกจากรหัสสินค้าแล้ว เคส Rework แต่ละรายการจะเก็บข้อมูลฟิลด์ล็อตเพิ่มเติม ได้แก่ หมายเลขล็อต (Batch No), วันที่ผลิตแกลลอน (gallonDate), เลขกล่อง (boxNumber / จำนวนกล่อง), หมายเลขแม่พิมพ์ (mold) และสายการผลิต (line)
   - **Zero-Value Restriction:** ระบบตรวจเช็คและล็อกไม่ให้ผู้ใช้งานระบุจำนวนสินค้า (`amount`) หรือจำนวนกล่อง (`boxNumber`) เป็น 0 เพื่อป้องกันข้อมูลผิดพลาดในระบบ
3. **Cross-Item Linking & Document Validation (เงื่อนไขและประเภทงานเฉพาะ):**
   - **Cross-Item Link:** หากตรวจพบสินค้าเปื้อน ('เปื้อน') และในเคสเดียวกันมีสินค้าที่รั่ว ('รั่ว') ระบบจะเปิดตัวเลือกให้เชื่อมโยงสาเหตุสินค้าเปื้อนไปยังไอเทมที่รั่วได้ (บันทึกลงฟิลด์ `linkedSourceId`)
   - **PTT OR Documents & QIR Extraction:** เคสที่ลูกค้าระบุเป็น "OR" จะเปิดช่องให้แนบไฟล์เอกสารอ้างอิงสำหรับ OR (.xlsx, .xls, .pdf, .png) พร้อมระบบ Auto-parsing สกัดข้อมูล QIR จาก Sheet 2 นำเข้าฟอร์มอัตโนมัติ
4. **Smart Master Upsert (บันทึกฐานข้อมูลกลาง):**
   - หากเป็นสินค้าใหม่ หรือ Incomplete Item (ข้อมูลไม่ครบ) ระบบจะทำการอัปเดตหรือเพิ่มข้อมูลเข้า Item Master ทันทีในพื้นหลัง
5. **Transaction & Evidence Integrity (ยืนยันรูปภาพ):**
   - ทุกรายการ rework ต้องมีรูปภาพหลักฐานอย่างน้อย 1 ภาพ (Evidence Integrity) โดยใช้การบีบอัดรูปภาพฝั่ง Client ก่อนอัปโหลด (target 300KB)
   - หากเกิดข้อผิดพลาดในการอัปโหลดรูป ระบบจะ Rollback ธุรกรรมทั้งหมดทันทีเพื่อป้องกันข้อมูลขยะ
6. **Cross-Department Workflow & Status Lifecycle (วงจรสถานะและส่งมอบงานข้ามแผนก):**
   - สถานะของเคสในปัจจุบันรองรับกระบวนการส่งมอบงาน 5-6 ขั้นตอนตามบทบาทผู้รับผิดชอบ ไม่ได้มีเพียง 3 สถานะแบบเดิม:
     1. **`Pending Analysis` (รอวิเคราะห์):** สถานะเริ่มต้นเมื่อเปิดเคสใหม่ รอฝ่าย QSMS วิเคราะห์ปัญหาและระบุชิ้นส่วนที่ต้องใช้ (`materialRequests`)
     2. **`Awaiting Materials` (รอเบิกของ / รอเบิกภาชนะ):** QSMS ส่งมอบงานต่อไปให้ฝ่ายคลัง/เบิกจ่าย (WPK) เตรียมและจ่ายวัสดุตามใบเบิก
     3. **`In-Progress` (กำลังดำเนินการ / กำลังซ่อม):** WPK จ่ายวัสดุครบ หรือฝ่ายผลิต/ช่างซ่อม (PDF) ยืนยันรับมอบของ (Handshake) และเริ่มลงมือบันทึกยอดกล่องที่ซ่อมเสร็จ
     4. **`Blocked` (ติดปัญหา / Defend Mode):** เกิดปัญหาอุปสรรคหน้างาน เช่น รอแกลลอน, รอน้ำมัน, รอผลแล็บ, หรือรอเครื่องจักร
     5. **`Completed` (เสร็จสิ้น 100%):** ซ่อมเสร็จครบตามยอดกล่องทั้งหมด หรือผ่านการตรวจรับมาตรฐานคุณภาพ (QC Sign-off) โดย QSMS/Admin
     6. **`Pending` (รอดำเนินการ):** สถานะ Legacy fallback สำหรับเคสรุ่นเก่า
   - **Status Transitions:** เปลี่ยนตามการกด Handover ระหว่างสเต็ป (QSMS Handover ➔ WPK Handover ➔ PDF Confirm Receipt ➔ PDF Repair/Defend ➔ QC Sign-off) ควบคู่กับการคำนวณ Progress ยอดกล่อง
7. **Excel Export with Images (การส่งออกไฟล์ข้อมูล):**
   - ระบบรองรับการ Export ตารางรายงานเคสออกมาเป็นไฟล์ Excel (.xlsx) ที่มีรูปหลักฐานฝังอยู่ด้านในโดยตรง (ผ่านไลบรารี `exceljs`) โดยปรับความสูงแถวเป็น 120px และตกแต่งสีหัวตารางสวยงาม
8. **RAG Ingestion Pipeline (การนำเข้าคู่มือ):**
   - การอัปโหลดไฟล์ PDF ในแท็บเอกสารของ DocAI จะทำการแปลงหน้า PDF เป็นรูปภาพ JPEG (ผ่าน `pdfjs-dist`) อัปโหลดไป Supabase Storage แล้วส่งให้ Gemini Vision ทำการแปลงเนื้อหาพร้อมแผนภาพเป็น Markdown จากนั้นจึงคำนวณเวกเตอร์ embeddings ผ่าน Jina AI และบันทึกลง Supabase
   - **RAG Bulk Deletion:** ผู้ดูแลสามารถเลือกเอกสารหลายรายการใน Checklist เพื่อสั่งลบเอกสารและข้อมูลเวกเตอร์ชิ้นส่วนที่เกี่ยวข้องพร้อมกันผ่าน API (`bulk_delete_documents`)
9. **AI-Assisted Drawing & Master Parsing (การดึงข้อมูลแบบแปลนอัตโนมัติ):**
   - เมื่อผู้ใช้ทำการอัปโหลดไฟล์ PDF เข้าสู่ระบบในหน้าจอ Drawing/Master ระบบจะส่งไฟล์ Base64 ไปยังเซิร์ฟเวอร์
   - Gemini AI จะทำหน้าที่ทำ OCR และวิเคราะห์เอกสารสแกนเพื่อแกะข้อมูลฟิลด์ต่าง ๆ โดยมีระบบ Cascade Fallback อัตโนมัติ (`gemini-3.1-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-3.8-flash`) เพื่อรองรับ 503 High Demand และข้อจำกัดโควตา API
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
21. **CaseUpdateView 4-Block Form Architecture & Per-Item Save Queue (ผังแบบฟอร์ม 4 บล็อกและการบันทึกรายไอเทม):**
    - **AddCaseTab 4-Block Parity:** ออกแบบเลย์เอาต์ฟอร์มไอเทมใน Step 1 ให้สอดคล้องกับ `AddCaseTab`: Block 1 (Customer Name + Item Number + Item Code 3 ช่องสมดุล + Part Name เต็มแถว), Block 2 (แผงไฮไลท์ข้อมูลผลิต 5 ช่อง: Batch No, Gallon Date, Mold, Line, Amount เน้นสี Indigo), Block 3 (สาเหตุที่พบ & ผู้รับผิดชอบ 2 ช่องคู่ + อาการเสียเต็มแถว), Block 4 (รูปภาพหลักฐานและปุ่มบันทึกรายไอเทมเดี่ยว `[บันทึกรายการนี้]`)
    - **Focus Ring Uniformity:** ป้องกันกรอบดำเบราว์เซอร์ด้วย `focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20` และซ่อน spinner ลูกศรตัวเลข
    - **Staged Photo Stability & Concurrent Uploads:** แสดงผลรูปถ่ายร่างด้วย `FileReader.readAsDataURL` ป้องกันปัญหา URL หลุดระหว่างแก้ไข และอัปโหลดขึ้น Cloudinary แบบขนาน (`Promise.all`) เร็วขึ้น 2–3 เท่า
22. **Operations Flow & Department Bottleneck Monitor (ระบบแดชบอร์ดชี้เป้าคอขวด 5 ขั้นตอน):**
    - ครอบคลุม 5-Stage Lifecycle Status: `Pending Analysis` (QSMS), `Awaiting Materials` (WPK), `In-Progress` (PDF), `Blocked` (Defend/ขาดวัสดุ), `Completed` (100%)
    - **Operations Bottleneck Radar:** ชี้เป้าแผนกที่มีงานคั่งค้างสูงสุด (**🔥 จุดคอขวดสูงสุด**) แบบ Real-time
    - **Department Queue Breakdown & 1-Click Filter:** แสดงยอดเคสและยอดกล่องค้างแยกรายแผนก (QSMS, WPK, PDF, Blocked) พร้อมกดกรองดูเฉพาะงานของแผนกนั้นได้ทันที
23. **Universal Prompt Font Standardization & Dotted Zero Elimination (ฟอนต์ Prompt 100% ไร้จุดไข่ปลา):**
    - บังคับใช้ Google Font `Prompt` (300, 400, 500, 600, 700) ทั่วทั้งระบบผ่าน `--font-sans`, `--font-thai`, และ `--font-mono`
    - กำจัดจุดไข่ปลาตรงกลางเลขศูนย์ (`0`) ในรหัสสินค้า (Item Code, Item Number) และ Case ID จากฟอนต์เดิม
    - ปรับลด Excessive Boldness ใน Portal/Navigation และถอดไอคอนที่ไม่เป็นทางการออก เพื่อภาพลักษณ์ Enterprise ที่เป็นมืออาชีพ
24. **MES JIT Kitting & Closed-Loop Two-Way Handshake Architecture (สถาปัตยกรรมจัดชุดภาชนะรอบเดียว):**
    - วางแนวทางแก้ปัญหาการเบิกของ RT/RW ด้วย **Single-Batch JIT Kitting**: ห้ามเบิกของก่อนวิเคราะห์, QSMS ระบุ BOM สุทธิ, WPK จัดของครบชุดรอบเดียว, และ PDF ต้องกดยืนยันรับจริงในระบบ (Sign-off) เพื่อตัดปัญหาการโยนความรับผิดชอบ
    - รองรับสถาปัตยกรรมแจ้งเตือน 3 ระดับ: **LINE Push Notification**, **In-App Notification Bell & Sound**, และ **Role-Based Task Queues**
25. **Production Security Hardening, PWA Standards & Offline Resilience (การยกระดับความปลอดภัยและมาตรฐานเว็บแอป):**
    - **Security Headers:** กำหนด HTTP Security Headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`) ใน `next.config.ts` ป้องกัน Clickjacking, MIME Confusion และบังคับใช้ HTTPS
    - **Brute-Force Rate Limiting:** เพิ่ม In-memory Rate Limiter บน `/api/auth/login` ป้องกันการสุ่มรหัสผ่านเกิน 5 ครั้งใน 15 นาที
    - **Registration Lockdown:** ปิดกั้น `/api/auth/register` ให้เฉพาะ Admin ที่มีสิทธิ์ `manage_users` เท่านั้น
    - **PWA Standards & App Icons:** สร้าง `src/app/manifest.ts`, `src/app/icon.tsx`, และ `src/app/apple-icon.tsx` รองรับการติดตั้งแบบ Standalone App บนแท็บเล็ตตรวจงาน
    - **Factory Offline Resilience:** เพิ่ม `useOnlineStatus` hook และคอมโพเนนต์ `OfflineBanner.tsx` แจ้งเตือนเมื่อสัญญาณ Wi-Fi หลุดหายแบบ Non-intrusive
    - **Modal A11y:** ปรับปรุง `AlertModal.tsx` รองรับปุ่ม `Escape` และคุณลักษณะ ARIA dialog มาตรฐาน
26. **RAG AI Database Re-alignment, Schema Fixes & Multi-Status Metrics (การแก้ไขระบบตอบคำถาม RAG AI เชื่อมโยงฐานข้อมูลจริง):**
    - **Single-Source Supabase Synchronization:** ย้ายการเชื่อมต่อฐานข้อมูล RAG จาก URL เดิมที่หมดอายุ (`bjibpmmuhggpvuaqgpjd.supabase.co`) กลับมายังฐานข้อมูลหลัก (`xbzgoqpqjdhkloqdmxby.supabase.co`) ใน `ragSupabaseServer.ts` และ `.env.local` เพื่อให้สามารถเข้าถึงตาราง `rag_documents`, `rag_document_chunks` และฟังก์ชัน RPC เวกเตอร์ (`hybrid_search_chunks`, `match_document_chunks`) ได้จริง 100%
    - **Function Calling & Table Schema Alignment:** แก้ไขการเรียกชื่อตารางใน Function Calling (`lookup_item_master` ชี้ไปที่ `rework_master_items` แทน `item_master`, `search_engineering_drawings` ค้นหาผ่าน `rag_documents` แทน `engineering_drawings`)
    - **5-Stage Lifecycle Analytics:** อัปเดตเมตริกการนับสถานะเคสใน `query_rework_analytics` ให้ครอบคลุมทุกสถานะจริงในระบบ (`Pending Analysis`, `Awaiting Materials`, `In-Progress`, `Blocked`, `Completed`) แทนการค้นหาเฉพาะสถานะ `Pending` แบบเดิม
    - **Zero-`any` & Server Authorization:** ขจัด `any` ออกจากโค้ด `src/app/api/rag/route.ts` ทั้งหมด และบังคับใช้สิทธิ์ `requireServerAuth` (`manage_rag`) เพื่อความปลอดภัยระดับ Enterprise
27. **Item Completion Validation, In-Place Queue & Case Progress Checklist (ระบบตรวจสอบความครบถ้วนของสินค้า & เช็กลิสต์ภาพรวม):**
    - **Realistic Mandatory Fields:** ปรับปรุง `calculateItemStatus` บังคับกรอก: สาเหตุหลัก & สาเหตุย่อย (`reason` & `reasonSubtype`), ผู้รับผิดชอบหลัก & ผู้รับผิดชอบย่อย (`responsible` & `responsibleSubtype`), รูปภาพหลักฐานความเสียหายอย่างน้อย 1 ภาพ, และจำนวนกล่อง (`amount` > 0) โดยปลดล็อกให้วันผลิต (`gallonDate`) และหมายเลขล็อต (`batchNo`) เป็นฟิลด์เสริม Optional
    - **Explicit Incomplete Badge:** แทนที่ป้ายกำกวม "อัปเดตแล้ว" ด้วยป้ายระบุฟิลด์ที่ขาดตรงๆ `[⚠️ ยังไม่ครบ (ขาด: ...)]` พร้อมไฮไลต์ข้อความเตือนสีส้มใต้ฟิลด์สาเหตุย่อย, แผนกผู้รับผิดชอบ และกล่องรูปภาพในฟอร์ม
    - **Case Items Checklist Banner:** แผงสรุปความคืบหน้าระดับเคสด้านบนรายการสินค้า แสดงแถบ % ความสมบูรณ์ และเม็ดชิปสถานะ Interactive รายไอเทม สามารถคลิกเพื่อเปิด Accordion และเลื่อนหน้าจอไปยังรายการนั้นได้ทันที
    - **In-Place Item Save & Loop Prevention:** ยกเลิกการสลับย้ายตำแหน่งไอเทมลงไปต่อท้ายสุด โดยบันทึกไอเทมอยู่กับที่เดิม (In-place) และเลื่อนเปิดรายการถัดไปที่ยังไม่สมบูรณ์ให้อัตโนมัติ ป้องกันความสับสนในการทำงานวนซ้ำ
28. **Agentic Hybrid RAG, Fuzzy Case Normalization & Interactive Evidence Citations (สถาปัตยกรรมตอบคำถามไฮบริด & ลิงก์หลักฐานเปิดเคสจริง):**
    - **Fuzzy Case Normalization:** เพิ่ม `src/app/api/rag/caseNormalizer.ts` แปลงและวิเคราะห์รหัสเคสไม่เต็มรูป (เช่น `RW001`, `001`, `rw 888`) ให้จับคู่กับรหัสเคสจริงในฐานข้อมูล (`rework_cases`) อัตโนมัติ
    - **Database Tool & Proactive Trigger:** เพิ่ม Tool `search_rework_case` ใน Gemini Function Declarations พร้อมระบบตรวจจับ Proactive Fallback หากโมเดลข้าม Tool แต่ผู้ใช้ระบุรหัสเคสในคำถาม ระบบจะดึงข้อมูลจริงจาก `rework_cases` + `rework_items` มาป้อนเป็น Context ทันที
    - **Strict Anti-Hallucination Guardrails:** กำหนดกฎใน System Prompt ห้ามแต่งชื่อสินค้า สเปก หรือสร้าง URL สมมติ (`https://qsms.internal/...`) โดยเด็ดขาด หากค้นหาไม่พบ ให้แจ้งผู้ใช้ตามความจริงว่าไม่พบเคสในระบบ QSMS พร้อมแนะนำรูปแบบรหัสที่ถูกต้อง
    - **Interactive Evidence Cards & Deep Linking:** แปลงข้อความอ้างอิง `action:case:<CaseID>` ใน `RagApp.tsx` เป็นการ์ดหลักฐานสีฟ้าพร้อมปุ่มคลิก `"เปิดดูเคสนี้"` ซึ่งจะส่ง CustomEvent `open-rework-case` ให้ `App.tsx` และ `OverallTab.tsx` สลับหน้าจอเปิด [`CaseUpdateView`](file:///c:/Workplace/QSMS_project/src/modules/rework/views/CaseUpdateView.tsx) ของเคสนั้นทันที
29. **Ground Truth Benchmark Datasets & OCR Accuracy Evaluation (ชุดทดสอบมาตรฐานและการประเมินความเที่ยงตรง):**
    - **Customer Drawing Benchmark (50 ฉบับ):** จัดเก็บใน `Drawing files/Test_50_Unique/` พร้อม `test_manifest.csv` กำกับรหัสแฮช SHA-256 และสถานะ `GroundTruthStatus = "Verified"` ครบทุกรายการ
    - **Internal Master Benchmark (50 ฉบับ):** จัดเก็บใน `Master files/Test_50_Unique/` พร้อม `test_manifest.csv` กำกับรหัสแฮช SHA-256 และสถานะ `GroundTruthStatus = "Verified"` ครบทุกรายการ
    - **Standard Manual Entry Form:** แบบฟอร์ม [`Ground_Truth_Manual_Entry_Form.xlsx`](file:///c:/Workplace/QSMS_project/Ground_Truth_Manual_Entry_Form.xlsx) บันทึกและสอบทานค่าเฉลยมาตรฐาน 20 คอลัมน์ ครบ 100 รายการ โดยคงโครงสร้างหัวตารางและข้อความกำกับไม่ระบุของระบบเดิม 100%
    - **Empirical AI Accuracy Benchmark:** ประเมินความถูกต้อง 11 ฟิลด์ผ่าน Gemini Vision ร่วมกับ Normalizers (`src/app/api/drawings/normalizers.ts`):
      * Drawing Benchmark (5 ฟิลด์หลัก x 50 = 250): ได้ **248/250 (99.20%)**, Wilson 95% CI: **[97.13%, 99.78%]**
      * Master Benchmark (5 ฟิลด์หลัก x 50 = 250): ได้ **249/250 (99.60%)**, Wilson 95% CI: **[97.77%, 99.93%]**
      * ภาพรวมระดับวิชาการ 550 ฟิลด์ข้อมูล (50 ฉบับ x 11 ฟิลด์): สกัดถูกต้อง **530/550 ฟิลด์ (96.36%)**, ช่วงความเชื่อมั่น 95% Wilson Score Interval: **[94.44%, 97.64%]** สอดคล้องกับตาราง 4.4 ในเล่มวิทยานิพนธ์

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
