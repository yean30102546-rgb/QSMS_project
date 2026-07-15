# GEMINI.md - QSMS Project Context

เอกสารนี้ทำหน้าที่เป็นจุดเริ่มต้น (Entry Point) สำหรับ AI/LLM หรือ Agent (เช่น Gemini, Claude) เพื่อให้เข้าใจบริบท โครงสร้าง สถาปัตยกรรม และการทำงานของโปรเจกต์ **QSMS Rework Management System** ได้ทันทีโดยไม่ต้องคาดเดา

---

## 1. ภาพรวมการใช้งาน (Overview)
**QSMS Rework Management System** คือระบบจัดการและติดตามสินค้าที่ต้องผ่านกระบวนการ Rework (ทำใหม่/แก้ไข) 
- **Core Features:** 
  - การบันทึกและจัดการ Rework Case (Case ID) และรายการสินค้า (Rework Item)
  - การดึงข้อมูลอัตโนมัติและการตรวจสอบความถูกต้องของสินค้าจากฐานข้อมูลกลาง (Item Master)
  - การอัปโหลดรูปภาพหลักฐานและการยืนยันความสมบูรณ์ของข้อมูล (Evidence & Transaction Integrity)
  - การแบ่งสิทธิการทำงาน (Role-Based Access Control) ระหว่าง Admin, Operator, Finance, และ PDB
  - ระบบถามตอบคู่มือเทคนิคและแนวทาง Rework อัจฉริยะ (DocAI RAG) ที่มีบุคลิกภาพแบบเป็นมืออาชีพและเพียบพร้อมด้วยข้อมูลสถิติ

---

## 2. Architecture (สถาปัตยกรรม)
ระบบถูกออกแบบด้วยสถาปัตยกรรมแบบ **Hybrid Next.js + React SPA** ควบคู่กับระบบ Backend แบบ Serverless:
- **Next.js API Boundary (`src/app/api/*/route.ts`):** 
  ทำหน้าที่เป็น Server Boundary สำหรับจัดการความปลอดภัย, Authentication, ควบคุมการเชื่อมต่อกับ Supabase, รวมถึงการซ่อน Secrets ต่างๆ และ Proxy คำสั่งไปยังระบบ Google Apps Script (GAS)
- **React Client Shell (`src/App.tsx` & Frontend Modules):** 
  ทำงานบนฝั่ง Client เป็นหลัก ดูแลเรื่อง View, Session Restore, Role-based Routing และจัดการ State ภายใน UI อย่างลื่นไหล 
- **Operational Database (Supabase):** 
  ฐานข้อมูลหลักของระบบที่ใช้เก็บข้อมูลทั้งหมดแบบ Real-time และจัดการ Authentication
- **Image Storage (Cloudinary):**
  ระบบจัดการและจัดเก็บรูปภาพหลักฐาน Rework (Evidence Images) โดยใช้วิธี Unsigned Upload โดยตรงจาก Frontend (Client-side) เพื่อลดปัญหาข้อจำกัดขนาด Base64 และลดโหลดเซิร์ฟเวอร์
- **Media/Compatibility Sidecar (Google Apps Script - GAS):** 
  ทำงานเป็นระบบเบื้องหลังสำหรับงานเฉพาะทาง เช่น Google Sheets หรือ Legacy System บางส่วน (อดีตเคยใช้รับรูปภาพแต่ปัจจุบันย้ายไป Cloudinary แล้ว)
- **DocAI RAG Engine (Gemini & Jina AI):**
  โมดูลสืบค้นปัญญาประดิษฐ์ (Retrieval-Augmented Generation) ค้นหาคู่มือเทคนิคและแนวทางการแก้ไขงาน Rework ทำงานโดยใช้ Supabase pgvector ร่วมกับ Jina AI Embeddings (`jina-embeddings-v5-text-small` ขนาด 768 มิติ) และ Gemini ในการสร้างคำตอบที่เป็นธรรมชาติ
  - **Parsing Ingestion:** ใช้ `gemini-3.1-flash-lite` สำหรับแปลงเอกสาร PDF และรูปภาพคู่มือเป็น Markdown โดยมีระบบ Fallback ไปยัง `gemini-2.0-flash` เมื่อเจอปัญหา 503 ในช่วงการทำงานที่มีโหลดสูง
  - **Chat Interface:** ใช้ `gemini-3.1-flash-lite` ในการตอบคำถามผู้ใช้งานผ่าน SSE Stream ร่วมกับระบบ Function Calling (`get_rework_statistics`) สำหรับเรียกดูสถิติสดย้อนหลัง
  - **Drawing & Master Metadata Extraction:** ระบบวิเคราะห์แบบแปลนวิศวกรรม (Engineering Drawings) และใบมาสเตอร์ภายใน (Internal Master Sheets) ผ่าน API Endpoint `src/app/api/drawings` โดยใช้ **`gemini-3.5-flash`** เป็นโมเดลหลัก (และ **`gemini-3.1-flash-lite`** เป็นตัวสำรอง) เพื่อทำ OCR และสกัด Metadata ต่างๆ กลับคืนมาในแบบ Structured JSON (Structured Outputs) ทันทีหลังพนักงานอัปโหลดไฟล์ PDF

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
6. **Rework Updates (การจัดการสถานะ & ค่าใช้จ่าย):**
   - **Operator / Admin:** เพิ่มวิธีแก้ปัญหา (Resolution Method), เบิกวัสดุ (Materials), จับเวลาทำงาน (Labor Hours)
   - **Finance:** ประเมินและกรอกราคาจริง (Actual Cost) และอัตราค่าแรง (Labor Rate) 
   - **Status Lifecycle:** `Pending` -> `In-Progress` -> `Awaiting Valuation` -> `Completed`
7. **Excel Export with Images (การส่งออกไฟล์ข้อมูล):**
   - ระบบรองรับการ Export ตารางรายงานเคสออกมาเป็นไฟล์ Excel (.xlsx) ที่มีรูปหลักฐานฝังอยู่ด้านในโดยตรง (ผ่านไลบรารี `exceljs`) โดยปรับความสูงแถวเป็น 120px และตกแต่งสีหัวตารางสวยงาม
8. **RAG Ingestion Pipeline (การนำเข้าคู่มือ):**
   - การอัปโหลดไฟล์ PDF ในแท็บเอกสารของ DocAI จะทำการแปลงหน้า PDF เป็นรูปภาพ JPEG (ผ่าน `pdfjs-dist`) อัปโหลดไป Supabase Storage แล้วส่งให้ Gemini Vision ทำการแปลงเนื้อหาพร้อมแผนภาพเป็น Markdown จากนั้นจึงคำนวณเวกเตอร์ embeddings ผ่าน Jina AI และบันทึกลง Supabase
   - **RAG Bulk Deletion:** ผู้ดูแลสามารถเลือกเอกสารหลายรายการใน Checklist เพื่อสั่งลบเอกสารและข้อมูลเวกเตอร์ชิ้นส่วนที่เกี่ยวข้องพร้อมกันผ่าน API (`bulk_delete_documents`)
9. **AI-Assisted Drawing & Master Parsing (การดึงข้อมูลแบบแปลนอัตโนมัติ):**
   - เมื่อผู้ใช้ทำการอัปโหลดไฟล์ PDF เข้าสู่ระบบในหน้าจอ Drawing/Master ระบบจะส่งไฟล์ Base64 ไปยังเซิร์ฟเวอร์
   - Gemini AI จะทำหน้าที่ทำ OCR และวิเคราะห์เอกสารสแกนเพื่อแกะข้อมูลฟิลด์ต่าง ๆ เช่น เลขแบบแปลน (drawing_number), รหัสสินค้าลูกค้า (item_code), ชื่อชิ้นงาน (part_name), ขนาดบรรจุ (package_size), กลุ่มน้ำมัน (oil_group), ประเภทพาเลท (pallet_type), จำนวนกล่อง (boxes_per_pallet) และอายุผลิตภัณฑ์ (shelf_life) เพื่อกรอกฟอร์มอัปโหลดโดยอัตโนมัติ ช่วยลดปัญหาความผิดพลาดจากการพิมพ์ (Human Error) ตัวฟิลด์ที่ดึงไม่พบจะเว้นว่างไว้ให้ผู้ใช้ตรวจสอบเพิ่มเติมได้ และการแก้ไขฟิลด์จะถูกบล็อกชั่วคราวระหว่างประมวลผลวิเคราะห์ข้อมูล (`isProcessing = true`)


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
