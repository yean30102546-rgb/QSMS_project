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

---

## 2. Architecture (สถาปัตยกรรม)
ระบบถูกออกแบบด้วยสถาปัตยกรรมแบบ **Hybrid Next.js + React SPA** ควบคู่กับระบบ Backend แบบ Serverless:
- **Next.js API Boundary (`src/app/api/*/route.ts`):** 
  ทำหน้าที่เป็น Server Boundary สำหรับจัดการความปลอดภัย, Authentication, ควบคุมการเชื่อมต่อกับ Supabase, รวมถึงการซ่อน Secrets ต่างๆ
- **React Client Shell (`src/App.tsx` & Frontend Modules):** 
  ทำงานบนฝั่ง Client เป็นหลัก ดูแลเรื่อง View, Session Restore, Role-based Routing และจัดการ State ภายใน UI อย่างลื่นไหล 
- **Operational Database (Supabase):** 
  ฐานข้อมูลหลักของระบบที่ใช้เก็บข้อมูลทั้งหมดแบบ Real-time และจัดการ Authentication
- **Media/Compatibility Sidecar (Google Apps Script - GAS):** 
  ทำงานเป็นระบบเบื้องหลังสำหรับงานเฉพาะทาง เช่น การทำงานร่วมกับ Google Drive, Google Sheets หรือ Legacy System บางส่วน

---

## 3. Flow การทำงาน (Workflow)
การทำงานหลักของระบบผ่าน Lifecycle ดังนี้:

1. **Case Initiation (เริ่มสร้างงาน):**
   - นำเข้าข้อมูลอ้างอิงจากเอกสาร RT/RW 
   - ระบบจะจ่าย **Case ID** (Hybrid Assignment) ซึ่งไม่สามารถซ้ำหรือแก้ไขได้ (Immutable)
2. **Two-Way Autofill & Verification (ตรวจสอบสินค้า):**
   - เมื่อกรอกรหัส Item Number หรือ Item Code ระบบจะสืบค้นข้อมูลจาก Item Master ทันที
   - **Verification Lifecycle:** สถานะจะเปลี่ยนจาก `Idle` -> `Checking` -> `Verified` (พบข้อมูล) / `New` (สินค้าใหม่) / `Conflict` (ข้อมูลขัดแย้ง)
3. **Smart Master Upsert (บันทึกฐานข้อมูลกลาง):**
   - หากเป็นสินค้าใหม่ หรือ Incomplete Item (ข้อมูลไม่ครบ) ระบบจะทำการอัปเดตหรือเพิ่มข้อมูลเข้า Item Master ทันทีในพื้นหลัง
4. **Transaction Integrity (ยืนยันรูปภาพ):**
   - ทุกรายการต้องมีรูปภาพหลักฐาน (Evidence Integrity)
   - หากเกิดข้อผิดพลาดในการอัปโหลดรูป ระบบจะ Rollback ธุรกรรมทั้งหมดทันทีเพื่อป้องกันข้อมูลขยะ
5. **Rework Updates (การจัดการสถานะ & ค่าใช้จ่าย):**
   - **Operator / Admin:** เพิ่มวิธีแก้ปัญหา (Resolution Method), เบิกวัสดุ (Materials), จับเวลาทำงาน (Labor Hours)
   - **Finance:** ประเมินและกรอกราคาจริง (Actual Cost) 
   - **Status Lifecycle:** `Pending` -> `In-Progress` -> `Awaiting Valuation` -> `Completed`

---

## 4. Tech Stack (เทคโนโลยีที่ใช้งาน)
เทคโนโลยีหลักที่ใช้ในโปรเจกต์อ้างอิงจาก `package.json` ล่าสุด:

- **Core Framework:** Next.js (v16), React (v19)
- **Styling & UI:** Tailwind CSS (v4), Framer Motion (`motion/react`), Radix UI Primitives, Lucide React (Icons)
- **Database & Auth:** Supabase (`@supabase/supabase-js`)
- **Language & Typings:** TypeScript (v5.8)
- **Build Tool:** Vite (ทำงานร่วมกันใน Client Shell / Tooling)
- **Testing:** Playwright (E2E Testing), Vitest (Unit Testing)
- **Utilities:** PDF Generation (`jspdf`, `html2canvas`), Image Compression (`browser-image-compression`)

---

## 5. กฎข้อบังคับสำหรับ Agent (Agent Protocols)
อ้างอิงจาก `AGENTS.md` - กฎการทำงานสำคัญที่ AI ทุกตัวต้องปฏิบัติตาม:
- **ห้ามเดา (No Guessing):** ต้องสำรวจ Source Code, อ่าน `.llm-wiki/2_wiki/index.md` ก่อนลงมือแก้ไข
- **ห้ามใช้ Any:** ให้ใช้ `unknown` หรือปล่อยให้ Type inference จัดการแทน
- **จัดการ Wiki เสมอ:** ถ้าแก้บั๊กหรือพัฒนาฟีเจอร์สำคัญเสร็จ ให้พิจารณาว่าต้องอัปเดต `.llm-wiki/2_wiki` เพื่อส่งต่อความรู้ให้ AI รอบถัดไปหรือไม่
- **Scope การแก้ไข:** ให้แก้ไขใน Scope ที่เล็กที่สุดและกระทบโค้ดเดิมน้อยที่สุด เคารพการออกแบบของเดิม

> **Guideline:** ควรอ่าน `CONTEXT.md` (สำหรับคำศัพท์เฉพาะ) และ `AGENTS.md` เพิ่มเติมเพื่อตรวจสอบ Best Practice ของโปรเจกต์ก่อนเริ่มเขียนโค้ดเสมอ
