# QSMS Rework & Roster Management System

ระบบจัดการงาน Rework และตารางเวรพนักงาน (Roster) ระดับองค์กร ออกแบบตามแนวคิด **Minimal Monochrome (Apple Pro Style)** ที่มีความเรียบหรู ปราณีต พร้อมการเชื่อมต่อข้อมูลแบบเรียลไทม์กับ Supabase Database

---

## 🎯 Features

### 🏢 Workspace Portal (Landing Page & Guest Mode)
- **Live Preview Analytics** - ผู้ใช้ทั่วไปที่ยังไม่ได้เข้าสู่ระบบสามารถมองเห็นข้อมูลสรุปเคส (Active Cases, Completion Rate, Defect Reasons) และตัวอย่างเคสล่าสุดแบบจำกัดได้ทันทีโดยไม่ต้องล็อกอิน
- **Auto-Redirect** - ตรวจเช็คสถานะเซสชันอัตโนมัติเพื่อนำทางผู้ใช้ที่เข้าสู่ระบบแล้วไปยังโมดูลหลักโดยตรง
- **Centralized App Registry** - เมนูคลังแอปพลิเคชันสำหรับเปิดโมดูลต่างๆ (Rework, Roster, และอื่นๆ ในอนาคต)

### ⚙️ Rework Module (ระบบจัดการเคสแก้ตัวสินค้า)
- **Multi-Item Support** - บันทึกได้หลายรายการสินค้า (Rework Items) ภายใต้ใบงาน (Case) เดียวกัน
- **Rework Item Granular Fields** - รองรับข้อมูลเฉพาะของรายการสินค้า ได้แก่ หมายเลขล็อต (Batch No), วันที่ผลิตแกลลอน (gallonDate), เลขกล่อง (boxNumber), หมายเลขแม่พิมพ์ (mold) และสายการผลิต (line)
- **Cross-Item Link** - ระบบช่วยเชื่อมโยงสินค้าประเภท "เปื้อน" ไปหาไอเทมต้นเหตุที่เป็น "รั่ว" ภายในเคสเดียวกัน (ฟิลด์ `linkedSourceId`) เพื่อวิเคราะห์สาเหตุอย่างมีประสิทธิภาพ
- **OR Documents & Validation Gating** - เคสที่มีแหล่งที่มาหรือลูกค้าเป็น "OR" จะรองรับการแนบเอกสารอ้างอิงของ OR สูงสุด 2 ไฟล์ (.xlsx, .xls, .pdf, .png) หากลืมแนบ ระบบจะแจ้งเตือน "ขาดไฟล์ OR" สีแดงบนตาราง Case List
- **Frosted Image Upload & Gallery** - อัปโหลดรูปภาพหลักฐานได้สูงสุด 5 ภาพต่อรายการ พร้อมคาร์รูเซลแกลเลอรีรูปภาพและการย่อขนาดไฟล์อัจฉริยะ (Client-side compression target 300KB)
- **Status & Document Action Gate** - ควบคุมสิทธิ์การกดเปลี่ยนสถานะหรือแนบไฟล์เอกสารสั่งแก้งาน (OR Document) ตามระดับตำแหน่ง (User, Supervisor, Manager) และบทบาทผู้ใช้งาน (Admin, Operator, Finance, PDB)
- **Apple Shimmer Progress Cards** - กล่องแสดงสถานะการบันทึกข้อมูลสตรีมมิ่งที่ใช้กลาสมอร์ฟิสซึ่มและแสงวิ่งวิ่งวิบวับแบบแคปซูลสไตล์ Apple Pro
- **PDF Template Export** - ส่งออกรายงานเคส rework ออกเป็นไฟล์ PDF ที่จัดหน้าตาจัดพิมพ์ไว้อย่างเรียบร้อยสวยงาม
- **Styled Excel Export with Images** - ส่งออกตารางรายการสินค้า rework ออกเป็นไฟล์ Excel (.xlsx) ที่มีรูปภาพหลักฐานฝังอยู่ด้านในโดยตรง (ผ่าน `exceljs`) พร้อมสไตล์สีสันตารางเป็นสากลและจัดความสูงแถว 120px เมื่อมีรูปภาพ

### 📅 Roster Module (ระบบจัดตารางเวรกะพนักงาน)
- **Interactive Calendar Grid** - ตารางปฏิทินแสดงตารางเวรรายเดือนที่เข้าใจง่ายและปรับขนาดได้ตามสัดส่วนจอ
- **Drag-and-Drop Schedule Shifts** - สลับกะการทำงานหรือกำหนดวันลาประเภทต่างๆ (Sick Leave, Business Leave, Holiday, OT) ได้สะดวกผ่านการลากวาง
- **Shift Stats Summary** - แสดงสรุปผลรวมจำนวนวันทำงาน วันหยุด และชั่วโมงลารวมของพนักงานแต่ละคนโดยอัตโนมัติ

### 🤖 DocAI RAG Module (ระบบถามตอบปัญญาประดิษฐ์จากคลังเอกสาร)
- **Nong Beepa Persona** - แชทถามตอบข้อสงสัยภาษาไทยกับ "น้องผึ้งพา" ด้วยน้ำเสียงที่เป็นกันเอง สุภาพ และมีภาพลักษณ์แบรนด์ที่น่ารักเพื่อช่วยลดความตึงเครียดในโรงงาน
- **Hybrid Search Engine** - ค้นหาคำตอบจากเอกสารอ้างอิงที่มีความแม่นยำสูง ด้วยการผสานกำลังระหว่าง Vector Search (Supabase pgvector + Jina Embeddings `jina-embeddings-v5-text-small` ขนาด 768 มิติ) และ Full-Text Search สำหรับจับคีย์เวิร์ดเฉพาะทาง
- **RAG Ingestion Pipeline** - แปลงเอกสาร PDF แยกรายหน้าเป็นรูปภาพ JPEG บนเบราว์เซอร์ด้วย `pdfjs-dist` อัปโหลดขึ้น Supabase Storage และใช้ `gemini-3.1-flash-lite` วิเคราะห์ข้อความและภาพหน้าคู่มือเพื่อถอดเป็น Markdown จากนั้นแบ่ง Chunk ด้วย MarkdownTextSplitter และสร้างเวกเตอร์ Jina Embeddings
- **RAG Bulk Deletion** - หน้าจอจัดการเอกสาร RAG มาพร้อมระบบเลือกหลายเอกสารพร้อมกัน (Checklist) และปุ่มกดลบถาวรแบบกลุ่ม (`bulk_delete_documents`) เพื่อลบข้อมูล metadata และ chunks ทั้งหมดพร้อมกันแบบ Cascading
- **Streaming Responses** - แสดงผลลัพธ์การตอบสนองแบบตัวอักษรสตรีมมิ่งสดตามสไตล์แชทบอท พร้อม **Suggestion Chips** คำถามแนะนำด้านล่างของข้อความตอบกลับ

### 📁 Drawing & Master Module (ระบบจัดการแบบแปลนและใบมาสเตอร์)
- **AI-Assisted PDF Parsing** - ระบบอ่านไฟล์ PDF อัตโนมัติ (รองรับ Scanned PDF) เมื่อพนักงานเลือกไฟล์ PDF ระบบจะส่งข้อมูลไปให้ Gemini 3.5 Flash (และ fallback 2.0 Flash) ทางเซิร์ฟเวอร์ เพื่อดึงข้อมูล Metadata สำคัญทั้งหมดแบบ Structured JSON (Structured Outputs) เช่น หมายเลขแบบแปลน, เวอร์ชัน (Revision), ขนาดบรรจุ (Package Size), กลุ่มน้ำมัน (Oil Group), ประเภทพาเลท (Pallet Type), จำนวนกล่อง และอายุผลิตภัณฑ์ ช่วยกรอกฟอร์มอัตโนมัติและลด Human Error โดยมีการระงับปุ่มบันทึกและป้อนค่าฟิลด์ชั่วคราวจนกว่าจะประมวลผลเสร็จ (`isProcessing = true`)

### 🎨 Apple Premium UI/UX & accessibility
- **Frosted Glassmorphism** - ใช้เอฟเฟกต์กระจกเบลอระดับสูง (`.glass-panel`, `.glass-input` + `backdrop-blur-xl`) และขอบโปร่งแสงสะท้อนเงา
- **Tactile Spring Micro-animations** - การกดปุ่มหรือเปลี่ยนหน้าต่างมาพร้อมการยุบตัวขยายตัวตามกฎฟิสิกส์สปริงที่ลื่นไหล (รองรับ `willChange: opacity, transform` และ Framer Motion จาก `motion/react`)
- **Reduced Motion Support** - รองรับการปิดหรือจำกัดแอนิเมชันสำหรับผู้ที่เปิดใช้คุณสมบัติจำกัดแอนิเมชันบน OS (ตรวจจับผ่าน `@media (prefers-reduced-motion: reduce)` ใน `index.css`)
- **Prevent Layout Shift** - ใช้ `scrollbar-gutter: stable` ใน CSS เพื่อป้องกันไม่ให้โครงสร้างหน้าจอเลื่อนตัวสั่นไหวเมื่อเปิดโมดอลหรือเมื่อมีสกรอลบาร์แสดงผล
- **Premium Logout Transition** - อนิเมชั่นหน้าจอออกจากระบบหน่วงเวลา 1.5 วินาที พร้อม Overlay ใสเบลอฉากหลังสูง (`backdrop-blur-[16px]`) และ **iOS Spoke Activity Indicator** หมุนวนนุ่มนวล
- **Fully Responsive** - รองรับการแสดงผลทั้งบน Desktop เควสใหญ่ และ Mobile ขนาดพกพา

---

## 🏗️ Architecture

### Frontend Stack
- **Next.js 16.2 (App Router)** - เฟรมเวิร์กจัดการเพจและ API Routes Proxy
- **React 19 & TypeScript (Strict Type-Safety, No `any`)** - ห้ามใช้ type `any` โดยเด็ดขาดเพื่อให้เกิดความมั่นคงและความปลอดภัยสูงสุดของโครงสร้างข้อมูล
- **Tailwind CSS v4 & PostCSS** - การจัดการสไตล์ชีตประสิทธิภาพสูงและโครงสีตามธีม
- **Motion (Framer Motion / `motion/react`)** - ตัวขับเคลื่อนฟิสิกส์อนิเมชั่นทั้งหมดในระบบ
- **Radix UI Primitives** - พื้นฐานคอมโพเนนต์ Dialog, Popover, Select, Tabs

### Backend Stack (Hybrid Database Model)
- **Google Sheets & Google Drive** - ใช้จัดเก็บข้อมูลชีตหลักและโฟลเดอร์รูปภาพของเคสต่างๆ
- **Supabase Database** - ใช้บันทึกข้อมูลแบบ relational เพื่อการ Query ค้นหาที่รวดเร็วและการจัดสกีมาตารางที่สัมพันธ์กัน (Roster, Rework, Items, RAG Documents, RAG Chunks, RAG Feedback)


### Data Flow
```
                 [ Workspace Portal / modules ]
                               ↓
                     [ Next.js API Routes ]
                               ↓
                     [ Supabase Postgres ]
```

---

## 📁 Project Structure

```
src/
├── app/                       # Next.js App Router (Layouts & Page entry)
├── components/
│   ├── apps/                  # Application Modules (portal)
│   ├── layout/                # Main layout shell and sidebar navigation
│   ├── modals/                # UpdateModal, ConflictModal, etc.
│   ├── tabs/                  # AddCaseTab, OverallTab, DashboardTab
│   └── ui/                    # AppleProgressBar, CaseListTable, ExportTemplate, etc.
├── config/                    # Authentication configs and role definitions
├── contexts/                  # ReworkDataContext, RosterContext, etc.
├── hooks/                     # Custom React hooks (useExportReport, useSaveProgress, etc.)
├── lib/                       # Supabase server client library
├── modules/
│   ├── rework/                # Rework app entry (ReworkApp.tsx)
│   ├── roster/                # Roster calendar and shift management
│   ├── rag/                   # DocAI RAG (Nong Beepa Chatbot & File Ingestion UI)
│   └── platform/              # Workspace registries & types
├── services/
│   ├── api.ts                 # API functions and Rework interfaces
│   └── auth.ts                # Session PIN verification and token utilities
├── utils/                     # Helpers, image compression, etc.
└── index.css                  # Global styles (Tailwind v4 theme extensions & layout overrides)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ และ npm/yarn
- บัญชี Google สำหรับ Sheets & Apps Script
- ฐานข้อมูล Supabase (พร้อมติดตั้ง DB Schema)

### Local Development

1. **โคลนและติดตั้งโปรเจกต์**
   ```bash
   git clone <your-repo-url>
   cd QSMS_project
   npm install
   ```

2. **กำหนดตัวแปรสภาพแวดล้อม (Environment Variables)**
   คัดลอกไฟล์ `.env.example` ไปเป็น `.env` และกำหนดค่าคีย์ต่างๆ:
   - `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JINA_API_KEY` (สำหรับ RAG embeddings)
   - `GEMINI_API_KEY` (สำหรับ RAG document parsing & chat responses)


3. **รันเซิร์ฟเวอร์สำหรับพัฒนา**
   ```bash
   npm run dev
   ```
   เปิดบราวเซอร์เข้าสู่ [http://localhost:3000](http://localhost:3000)

4. **ตรวจสอบความปลอดภัยของไทป์**
   ```bash
   npm run lint
   ```

5. **การรันทดสอบระบบ (Testing)**
   * **Unit & Integration Tests (Vitest):**
     ```bash
     npm run test
     ```
   * **End-to-End Tests (Playwright E2E):**
     ```bash
     npm run test:e2e
     ```
     หรือหากต้องการรันเพื่อดีบั๊กแบบมี UI/Interactive mode:
     ```bash
     npx playwright test --ui
     ```

---

## 🔒 Data Validation & Role-Based Access Control (RBAC)

### Access Control & Roles
ระบบใช้การคัดแยกสิทธิ์ตามบทบาทผู้ใช้งาน (RBAC) ทั้งในส่วนของ UI (Frontend) และ API Endpoints (Backend):
- **ADMIN / QSMS** - สิทธิ์สูงสุด สามารถจัดการได้ทุกส่วน รวมถึงการลบเคส การจัดการแดชบอร์ด และสิทธิ์ในการใช้ Roster Module และระบบแก้ไขข้อมูล Edit Mode
- **FINANCE** - แผนกการเงิน มีสิทธิ์ในการสืบค้นดูรายการ และทำหน้าที่ตรวจสอบประเมินราคาอัปเดตช่อง Rework Cost และ Labor Rate เท่านั้น ไม่สามารถสร้างเคสใหม่หรือแก้ไขรายละเอียดสินค้าด้านในได้
- **OPERATOR / WFG / PDB (Consolidated Roles)** - กลุ่มงานการผลิตและคลังสินค้า มีสิทธิ์การใช้งานจำกัดเฉพาะโมดูล **Rework** (ซ่อนโมดูล Roster ทั้งหมด)
  - สิทธิ์ทำงาน: สามารถเพิ่มงาน Rework ได้, อัปเดตสถานะงานเป็น "In-Progress" หรือส่งต่อไปสถานะ "Completed" (เสร็จสิ้น) ได้
  - ข้อจำกัด: **ไม่สามารถมองเห็นหรือแก้ไขฟิลด์ค่าใช้จ่ายใดๆ ได้ (No Pricing/Cost access)** และไม่มีสิทธิ์ในฟังก์ชันการ Export ข้อมูลหรือเรียกดูหน้า Dashboard

### 🧪 Local Test Accounts (บัญชีทดสอบระบบภายใน)
สำหรับการทดสอบระบบบนเครื่อง Local หรือสภาพแวดล้อมจำลอง สามารถเข้าสู่ระบบด้วยบัญชีจำลองด้านล่างนี้ได้โดยตรง:
- **QSMS / Admin Account:** Username: `qsms`, Password: `Qsms123`
- **Operator / WFG / PDB Account:** Username: `operator`, Password: `Operator123`
- **Finance Account:** Username: `finance`, Password: `Finance123`

---

## 📚 API Reference

### RAG Ingestion & Chat APIs
- `POST /api/rag` (action: `list_documents`): ดึงรายชื่อเอกสารทั้งหมดที่อัปโหลดไว้เข้าระบบคลัง RAG
- `POST /api/rag` (action: `delete_document`): ลบเอกสารเดี่ยวและลบเวกเตอร์ chunks ทั้งหมดที่เกี่ยวข้อง
- `POST /api/rag` (action: `bulk_delete_documents`): สั่งลบกลุ่มเอกสารและ chunks ที่เกี่ยวข้องทั้งหมดพร้อมกันแบบกลุ่ม (Bulk Delete)
- `POST /api/rag` (action: `ingest`): เคลียร์ข้อมูลเดิม แยกชิ้นส่วนข้อความ (Chunking) ด้วย MarkdownTextSplitter, คำนวณเวกเตอร์ embeddings Jina AI และ Bulk insert ลง Supabase (รองรับ PDF page image links)
- `POST /api/rag` (action: `chat`): รับข้อความแชทและประวัติแชทล่าสุด แปลง embeddings และเรียกใช้ Supabase RPC (Hybrid Search) เพื่อสืบค้นข้อมูลในฐานข้อมูล จากนั้นส่งข้อมูลแบบ Stream ผ่าน Server-Sent Events (SSE) ร่วมกับประมวลผลคำตอบจาก Gemini
- `POST /api/rag` (action: `feedback`): บันทึกความพึงพอใจของคำตอบ (Thumbs Up/Down) สู่ตาราง `rag_feedback` เพื่อใช้ในการประเมินความถูกต้องของคำตอบ

### Drawings & Master APIs
- `POST /api/drawings` (action: `parse_drawing`): ทำ OCR และสกัดข้อมูลตัวแปรโครงสร้าง (Structured JSON) จากไฟล์ PDF แบบแปลนหรือใบมาสเตอร์โดยใช้ Gemini 3.5 Flash และ 2.0 Flash

---

Last Updated: July 2026
Version: 1.2.0
