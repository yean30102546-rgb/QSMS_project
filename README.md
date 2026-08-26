# ระบบบริหารจัดการกระบวนการแก้ไขผลิตภัณฑ์และคลังเอกสารข้อกำหนดมาตรฐานการผลิตอัจฉริยะ (QSMS: Quality & Rework Management System)

ระบบจัดการงานแก้ไขผลิตภัณฑ์ (Rework) และคลังเอกสารข้อกำหนดมาตรฐานการผลิตอัจฉริยะระดับองค์กร ออกแบบตามแนวคิด **Minimal Monochrome (Apple Pro Style)** ที่มีความเรียบหรู ประณีต พร้อมการเชื่อมต่อข้อมูลแบบเรียลไทม์กับ Supabase Database

---

## 🎯 Features

### 🏢 Workspace Portal (Landing Page & Guest Mode)
- **Live Preview Analytics** - ผู้ใช้ทั่วไปที่ยังไม่ได้เข้าสู่ระบบสามารถมองเห็นข้อมูลสรุปเคส (Active Cases, Completion Rate, Defect Reasons) และตัวอย่างเคสล่าสุดแบบจำกัดได้ทันทีโดยไม่ต้องล็อกอิน
- **Auto-Redirect** - ตรวจเช็คสถานะเซสชันอัตโนมัติเพื่อนำทางผู้ใช้ที่เข้าสู่ระบบแล้วไปยังโมดูลหลักโดยตรง
- **Centralized App Registry** - เมนูคลังแอปพลิเคชันสำหรับเปิดโมดูลต่างๆ (Rework, Drawing & Master Storage, DocAI RAG, Presentation & Guide)

### ⚙️ Rework Module (ระบบจัดการเคสแก้ตัวสินค้า)
- **Multi-Item Support** - บันทึกได้หลายรายการสินค้า (Rework Items) ภายใต้ใบงาน (Case) เดียวกัน
- **Rework Item Granular Fields** - รองรับข้อมูลเฉพาะของรายการสินค้า ได้แก่ หมายเลขล็อต (Batch No), วันที่ผลิตแกลลอน (gallonDate), เลขกล่อง (boxNumber), หมายเลขแม่พิมพ์ (mold) และสายการผลิต (line)
- **Cross-Item Link** - ระบบช่วยเชื่อมโยงสินค้าประเภท "เปื้อน" ไปหาไอเทมต้นเหตุที่เป็น "รั่ว" ภายในเคสเดียวกัน (ฟิลด์ `linkedSourceId`) เพื่อวิเคราะห์สาเหตุอย่างมีประสิทธิภาพ
- **OR Documents & Validation Gating** - เคสที่มีแหล่งที่มาหรือลูกค้าเป็น "OR" จะรองรับการแนบเอกสารอ้างอิงของ OR สูงสุด 2 ไฟล์ (.xlsx, .xls, .pdf, .png) หากลืมแนบ ระบบจะแจ้งเตือน "ขาดไฟล์ OR" สีแดงบนตาราง Case List
- **Frosted Image Upload & Gallery** - อัปโหลดรูปภาพหลักฐานได้สูงสุด 5 ภาพต่อรายการ พร้อมคาร์รูเซลแกลเลอรีรูปภาพและการย่อขนาดไฟล์อัจฉริยะ (Client-side compression target 300KB)
- **Status & Document Action Gate** - ควบคุมสิทธิ์การกดเปลี่ยนสถานะหรือแนบไฟล์เอกสารสั่งแก้งาน (OR Document) ตามระดับตำแหน่ง (User, Supervisor, Manager) และบทบาทผู้ใช้งาน (Admin, Operator)
- **Apple Shimmer Progress Cards** - กล่องแสดงสถานะการบันทึกข้อมูลสตรีมมิ่งที่ใช้กลาสมอร์ฟิสซึ่มและแสงวิ่งวิ่งวิบวับแบบแคปซูลสไตล์ Apple Pro
- **PDF Template Export** - ส่งออกรายงานเคส rework ออกเป็นไฟล์ PDF ที่จัดหน้าตาจัดพิมพ์ไว้อย่างเรียบร้อยสวยงาม
- **Styled Excel Export with Images** - ส่งออกตารางรายการสินค้า rework ออกเป็นไฟล์ Excel (.xlsx) ที่มีรูปภาพหลักฐานฝังอยู่ด้านในโดยตรง (ผ่าน `exceljs`) พร้อมสไตล์สีสันตารางเป็นสากลและจัดความสูงแถว 120px เมื่อมีรูปภาพ

### 🤖 DocAI RAG Module (ระบบถามตอบปัญญาประดิษฐ์จากคลังเอกสาร)
- **Nong Beepa Persona** - แชทถามตอบข้อสงสัยภาษาไทยกับ "น้องผึ้งพา" ด้วยน้ำเสียงที่เป็นกันเอง สุภาพ และมีภาพลักษณ์แบรนด์ที่น่ารักเพื่อช่วยลดความตึงเครียดในโรงงาน
- **Hybrid Search Engine** - ค้นหาคำตอบจากเอกสารอ้างอิงที่มีความแม่นยำสูง ด้วยการผสานกำลังระหว่าง Vector Search (Supabase pgvector + Jina Embeddings `jina-embeddings-v5-text-small` ขนาด 768 มิติ) และ Full-Text Search สำหรับจับคีย์เวิร์ดเฉพาะทาง
- **RAG Ingestion Pipeline** - แปลงเอกสาร PDF แยกรายหน้าเป็นรูปภาพ JPEG บนเบราว์เซอร์ด้วย `pdfjs-dist` อัปโหลดขึ้น Supabase Storage และใช้ `gemini-3.1-flash-lite` วิเคราะห์ข้อความและภาพหน้าคู่มือเพื่อถอดเป็น Markdown จากนั้นแบ่ง Chunk ด้วย MarkdownTextSplitter และสร้างเวกเตอร์ Jina Embeddings
- **RAG Bulk Deletion** - หน้าจอจัดการเอกสาร RAG มาพร้อมระบบเลือกหลายเอกสารพร้อมกัน (Checklist) และปุ่มกดลบถาวรแบบกลุ่ม (`bulk_delete_documents`) เพื่อลบข้อมูล metadata และ chunks ทั้งหมดพร้อมกันแบบ Cascading
- **Streaming Responses** - แสดงผลลัพธ์การตอบสนองแบบตัวอักษรสตรีมมิ่งสดตามสไตล์แชทบอท พร้อม **Suggestion Chips** คำถามแนะนำด้านล่างของข้อความตอบกลับ

### 📁 Drawing & Master Module (ระบบจัดการแบบแปลนและใบมาสเตอร์)
- **AI-Assisted PDF Parsing** - ระบบอ่านไฟล์ PDF อัตโนมัติ (รองรับ Scanned PDF) เมื่อเลือกไฟล์ PDF ระบบจะส่งข้อมูลไปให้ Gemini 3.5 Flash (และ fallback `gemini-3.1-flash-lite` ➔ `gemini-2.0-flash`) เพื่อดึงข้อมูล Metadata สำคัญทั้งหมดแบบ Structured JSON
- **Decoupled Document Schema Forms** - แยกแบบฟอร์ม Drawing (7 ฟิลด์) และ Master Sheet (8 ฟิลด์) ตามความจริงของเอกสาร ป้องกันปัญหาการแสดงฟิลด์ N/A สับสน
- **Boxes Per Pallet Normalization ("ตามความเหมาะสม")** - ระบบปรับแปลงค่าจำนวนกล่องต่อพาเลทหากเจอมวลคำว่า "ตามความเหมาะสม" ทั้งใน Gemini OCR Prompt และ Normalizer ให้แสดงผลข้อความอย่างถูกต้องโดยไม่สุ่มเดาตัวเลข
- **Side-by-Side Master-Detail Inspection Workspace** - แผงตรวจทานเอกสารแบบ Split View 55/45 สไลด์เปิดฝั่งขวาทันทีเมื่อคลิกเลือกแถว รองรับการสลับแบบแปลนด้วยคีย์บอร์ด `ArrowUp` / `ArrowDown` และกด `Escape` เพื่อปิด
- **PDF Auto-Orientation & Rotation Persistence Engine** - เครื่องมือหมุน PDF 0°, 90°, 180°, 270° พร้อมปุ่ม **Landscape View** 1-click และบันทึกองศาการหมุนลงใน `localStorage` (`qsms_pdf_rot_<id>`) เพื่อคงทิศทางเดิมเมื่อเปิดดูครั้งถัดไป

### 🎨 Apple Premium UI/UX, Liquid Glass & Interactive Deck
- **Mobile-First Rework Card Layout** - ปรับปรุงแถวเคส Rework ให้เป็น Mobile-First Card Layout บนหน้าจอ 390px (iPhone 13) แยกบรรทัดชื่อสินค้าเต็มความกว้าง จัดกลุ่มความคืบหน้าและป้ายสถานะเข้ามุมอย่างเป็นระเบียบ ไม่เบียดตัวหนังสือ
- **Case Update 2-Tier Responsive Header & Accordion** - จัดโครงสร้าง Header 2 ชั้นบนมือถือ ป้องกันปุ่ม Action Bar ซ้อนทับชื่อเคส พร้อมระบบพับเก็บรายการสินค้าเป็นค่าเริ่มต้น (Default Folded Accordion) เพื่อประหยัดพื้นที่แนวตั้ง
- **DocAI Floating Action Button (FAB)** - ปุ่มผู้ช่วยอัจฉริยะแบบ FAB Icon ทรงกลมที่มุมขวาล่าง (`bottom-20 right-4 sm:bottom-6 sm:right-6`) ไม่ทับปุ่มเปลี่ยนหน้า Pagination
- **Academic Thesis Report Generator** - สคริปต์ Python อัตโนมัติสำหรับสังเคราะห์เล่มรายงานวิทยานิพนธ์ `QSMS_Project_Thesis_Report.docx` (3.10 MB) ตามมาตรฐาน PIM 5 บท ฝัง 9 Figures ไดอะแกรมความละเอียด 300 DPI และ 7 UI Screenshots จริง
- **Presentation Deck Touch Navigation** - ระบบควบคุมสไลด์บนหน้าจอสัมผัส รองรับ Swipe Gestures (`onTouchStart`/`onTouchEnd`), แถบควบคุมลอยด้านล่าง (`md:hidden`) และปุ่มลอยสำหรับออกจากโหมดพรีเซนต์
- **Apple Liquid Glass Material** - นำเสนอดีไซน์สไตล์ Liquid Glass ยุคใหม่ (`.liquid-glass-card`, `.liquid-glass-pill`) ด้วย Multi-layer Refraction Gradient, 1.5px Specular Rim, Inset Depth Reflections, Backdrop Blur 40px + Saturate 200% และ Ambient Glowing Orbs
- **Interactive Presentation Deck (30/70 Side-by-Side)** - โมดูลสไลด์คู่มือระบบ 20 สไลด์ พร้อมไทม์ไลน์ 4 เดือน (Nov 2025 - Feb 2026) เชื่อมโยงกับ Live Interactive Sandbox บน Mac OS Window Header พร้อมระบบเลื่อน Scroll ภายในอย่างลื่นไหล
- **Direct-Manipulation Zoom & Pan Engine** - เครื่องมือซูม 75%–200% และระบบคลิกลาก Pan แบบ Screen-Space 1:1 ปลดล็อก Transition หน่วงเวลาขณะลาก พร้อม Window Event Listeners ลากได้ทั่วจอไม่หลุดขอบ
- **Interactive Excel Spreadsheet Preview Modal** - หน้าต่างจำลองไฟล์ส่งออก Excel สไตล์ Microsoft Ribbon พร้อมตารางรายงาน SFC Rework และรูปถ่ายหลักฐานฝังในเซลล์ 120px
- **Hardware-Accelerated Slide Transitions** - การเรนเดอร์สไลด์แบบ 60/120fps โดยตัด CSS Blur Filter ออก และใช้ GPU Spring Translation (`transform-gpu will-change-transform`)
- **Interactive Hotspot Multi-Targeting** - จุดเรืองแสงนำชมที่เด้งขึ้นด้านบน (`bottom-full mb-4`) ไม่บดบังฟิลด์ และสามารถไฮไลท์เรืองแสงช่องที่เกี่ยวข้องพร้อมกัน (เช่น Barcode และ Item Code)
- **Frosted Glassmorphism** - ใช้เอฟเฟกต์กระจกเบลอระดับสูง (`.glass-panel`, `.glass-input` + `backdrop-blur-xl`) และขอบโปร่งแสงสะท้อนเงา
- **Tactile Spring Micro-animations** - การกดปุ่มหรือเปลี่ยนหน้าต่างมาพร้อมการยุบตัวขยายตัวตามกฎฟิสิกส์สปริงที่ลื่นไหล (รองรับ `willChange: opacity, transform` และ Framer Motion จาก `motion/react`)
- **Reduced Motion Support** - รองรับการปิดหรือจำกัดแอนิเมชันสำหรับผู้ที่เปิดใช้คุณสมบัติจำกัดแอนิเมชันบน OS (ตรวจจับผ่าน `@media (prefers-reduced-motion: reduce)` ใน `index.css`)
- **Prevent Layout Shift** - ใช้ `scrollbar-gutter: stable` ใน CSS เพื่อป้องกันไม่ให้โครงสร้างหน้าจอเลื่อนตัวสั่นไหวเมื่อเปิดโมดอลหรือเมื่อมีสกรอลบาร์แสดงผล
- **Premium Logout Transition** - อนิเมชั่นหน้าจอออกจากระบบหน่วงเวลา 1.5 วินาที พร้อม Overlay ใสเบลอฉากหลังสูง (`backdrop-blur-[16px]`) และ **iOS Spoke Activity Indicator** หมุนวนนุ่มนวล
- **Fully Responsive** - รองรับการแสดงผลทั้งบน Desktop เควสใหญ่ และ Mobile ขนาดพกพา (รองรับการใช้งานบน iOS Safari และ Android Chrome สมบูรณ์แบบ)

---

## 🏗️ Architecture

### Frontend Stack
- **Next.js 16.2 (App Router)** - เฟรมเวิร์กจัดการเพจและ API Routes Proxy
- **React 19 & TypeScript (Strict Type-Safety, No `any`)** - ห้ามใช้ type `any` โดยเด็ดขาดเพื่อให้เกิดความมั่นคงและความปลอดภัยสูงสุดของโครงสร้างข้อมูล
- **Tailwind CSS v4 & PostCSS** - การจัดการสไตล์ชีตประสิทธิภาพสูงและโครงสีตามธีม
- **Motion (Framer Motion / `motion/react`)** - ตัวขับเคลื่อนฟิสิกส์อนิเมชั่นทั้งหมดในระบบ
- **Radix UI Primitives** - พื้นฐานคอมโพเนนต์ Dialog, Popover, Select, Tabs

### Backend Stack (Hybrid Database Model)
- **Supabase & Cloudinary** - ใช้จัดเก็บข้อมูลหลักและโฟลเดอร์รูปภาพของเคสต่างๆ
- **Supabase Database** - ใช้บันทึกข้อมูลแบบ relational เพื่อการ Query ค้นหาที่รวดเร็วและการจัดสกีมาตารางที่สัมพันธ์กัน (Rework Cases, Items, Drawings, RAG Documents, RAG Chunks, RAG Feedback)


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
│   ├── apps/                  # Application Modules (portal, drawings, etc.)
│   ├── layout/                # Main layout shell and sidebar navigation
│   ├── modals/                # UpdateModal, ConflictModal, etc.
│   ├── tabs/                  # AddCaseTab, OverallTab, DashboardTab
│   └── ui/                    # AppleProgressBar, CaseListTable, ExportTemplate, etc.
├── config/                    # Authentication configs and role definitions
├── contexts/                  # ReworkDataContext, NotificationContext, etc.
├── hooks/                     # Custom React hooks (useExportReport, useSaveProgress, etc.)
├── lib/                       # Supabase server client library
├── modules/
│   ├── rework/                # Rework app entry (ReworkApp.tsx)
│   ├── drawings/              # Drawing & Master Storage module
│   ├── rag/                   # DocAI RAG (Nong Beepa Chatbot & File Ingestion UI)
│   ├── guide/                 # Presentation & Guide deck module
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
- บัญชี Cloudinary สำหรับระบบอัปโหลดรูปภาพ
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
- **ADMIN / QSMS** - สิทธิ์สูงสุด สามารถจัดการได้ทุกโมดูล รวมถึงการลบเคส การจัดการแดชบอร์ด คลังเอกสาร Drawing & Master Storage, DocAI RAG และระบบแก้ไขข้อมูล Edit Mode
- **OPERATOR / WFG (Consolidated Roles)** - กลุ่มงานการผลิตและคลังสินค้า มีสิทธิ์การใช้งานจำกัดเฉพาะโมดูล **Rework**
  - สิทธิ์ทำงาน: สามารถเพิ่มงาน Rework ได้, อัปเดตสถานะงานเป็น "In-Progress" หรือส่งต่อไปสถานะ "Completed" (เสร็จสิ้น) ได้
  - ข้อจำกัด: **ไม่สามารถมองเห็นหรือแก้ไขฟิลด์ค่าใช้จ่ายใดๆ ได้ (No Pricing/Cost access)** และไม่มีสิทธิ์ในฟังก์ชันการ Export ข้อมูลหรือเรียกดูหน้า Dashboard สถิติของโมดูลอื่น

### 🧪 Local Test Accounts (บัญชีทดสอบระบบภายใน)
สำหรับการทดสอบระบบบนเครื่อง Local หรือสภาพแวดล้อมจำลอง สามารถเข้าสู่ระบบด้วยบัญชีจำลองด้านล่างนี้ได้โดยตรง:
- **Operator / WFG Account:** Username: `operator`, Password: `Operator123`

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

Last Updated: August 2026
Version: 1.3.0
