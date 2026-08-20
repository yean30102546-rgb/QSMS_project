# QSMS Ecosystem Presentation Specification

เอกสารนี้ระบุรายละเอียดโครงสร้างและเนื้อหาสไลด์สำหรับ **QSMS Presentation Deck** (`src/modules/guide/`) ที่ครอบคลุมทั้ง 3 โมดูลปฏิบัติการของระบบ QSMS Rework Management System

---

## 1. Slide Deck Structure & Categories

สไลด์ถูกแบ่งออกเป็น 5 หมวดหมู่หลัก (Module Categories):

| Category Key | Label | Scope |
| :--- | :--- | :--- |
| `all` | All Modules | แสดงสไลด์ทั้งหมดในระบบ (18 สไลด์) |
| `rework` | QSMS Rework | ภาพรวม, สถิติ, Flow การสร้างเคส และการบีบอัดภาพหลักฐาน |
| `storage` | Drawing & Master Storage | การสกัดข้อมูล OCR จากแปลนวิศวกรรม, แผงตรวจทาน 55/45 Split View |
| `rag` | DocAI RAG Engine | การสืบค้นคู่มือเทคนิคด้วย Vector Embedding และ Gemini Streaming Chat |
| `architecture` | Platform Architecture | สถาปัตยกรรมระบบ ความปลอดภัย RLS และ ROI |

---

## 2. Detailed Slide Outline

### Chapter 01: Executive Summary & Overview
1. **Introduction**: QSMS Unified Operations Platform - ศูนย์กลางการบริหารจัดการ Rework และเอกสารเทคนิควิศวกรรมแบบดิจิทัล 100%
2. **Ecosystem Overview**: ภาพรวม 3 โมดูลหลัก (Rework Management, Drawing/Master Storage, DocAI RAG Assistant)
3. **Unified Portal Launcher**: จุดเข้าใช้งานรวมศูนย์ รองรับ Role-Based Access Control (QSMS Admin & Operator)

### Chapter 02: QSMS Rework Management
4. **Rework Painpoints & Solution**: เปลี่ยนการจดกระดาษ/Excel กระจัดกระจายเป็นระบบฐานข้อมูลกลางที่โปร่งใส ติดตามสถานะงานและยอดกล่องได้แบบเรียลไทม์
5. **Rework Case Initiation**: การออก Case ID อัตโนมัติ (`RWxxx-2026` / `RTxxx-2026`), Auto-fill ข้อมูลสินค้าจาก Item Master, การบังคับแนบภาพหลักฐาน
6. **Advanced Rework Workflows**: ฟีเจอร์เชื่อมโยงสาเหตุปัญหา (Cross-Item Link), รองรับเอกสาร PTT OR และระบบ Mobile Fast-Track สำหรับหน้างาน

### Chapter 03: Drawing & Master Storage
7. **Engineering Storage Painpoints**: การจัดการแบบแปลนลูกค้าและ Master Sheet ที่ผิดพลาดจากการคีย์ข้อมูลด้วยมือและการดูไฟล์ในทิศทางที่ไม่ถูกต้อง
8. **AI-Powered Data Extraction**: การใช้งาน Gemini AI ทำ OCR สกัด Metadata ออกมาเป็น Structured JSON โดยแยกสเปก Drawing (7 ฟิลด์) และ Master Sheet (8 ฟิลด์)
9. **55/45 Inspection Workspace**: แผงตรวจทานแบบ Side-by-Side Split View พร้อมเครื่องมือหมุน PDF 0-270° และการคำนวณจำนวนกล่องต่อพัลเล็ต "ตามความเหมาะสม"

### Chapter 04: DocAI RAG Engine
10. **Technical Doc Retrieval Challenge**: ความยากในการค้นหาสเปกและวิธีแก้ไขงาน Rework จากคู่มือหนาหลายร้อยหน้า
11. **Vector Search & AI Architecture**: การแปลง PDF เป็นรูปภาพ, คำนวณ Embeddings ผ่าน Jina AI (`jina-embeddings-v5-text-small`) และจัดเก็บใน Supabase pgvector
12. **Interactive AI Assistant**: หน้าจอสนทนา AI แบบ SSE Stream พร้อมระบบ Function Calling สกัดสถิติ Rework สดมาตอบคำถามผู้ใช้

### Chapter 05: Platform Security & Business ROI
13. **Security Boundary & Auth**: สถาปัตยกรรม Next.js API Boundary, Supabase Row Level Security (RLS) และ Unsigned Direct Upload เข้า Cloudinary
14. **Data & Transaction Integrity**: การการันตี Rollback อัตโนมัติเมื่อเกิดข้อผิดพลาดในการอัปโหลดรูปภาพ ป้องกันข้อมูลขยะในระบบ
15. **Reporting & Analytics**: การส่งออกรายงานตารางและกราฟ พร้อมฝังรูปภาพหลักฐานลงในไฟล์ Excel (.xlsx) โดยตรง
16. **Operational Impact**: ลดเวลาทำงานของ Operator และทีม QSMS ลง 70%, ข้อมูลประวัติล็อตแม่นยำ 100%
17. **Future Roadmap**: การเชื่อมต่อระบบ IoT และการพาดพิง AI Quality Inspector
18. **Conclusion & Q&A**: สรุปเป้าหมายและความพร้อมในการนำระบบไปใช้งานจริง

---

## 3. Mock Component Requirements

### `MockDrawingMaster`
- ตารางรายการ Drawing PDF & Master Sheet
- ปุ่มเลือกแถวเพื่อสไลด์เปิด 55/45 Split View Inspection Panel
- Toolbar ปรับหมุน PDF (0°, 90°, 180°, 270°, Landscape Button)
- ตารางแสดงสเปกที่ OCR สกัดได้ (เช่น `boxes_per_pallet: "ตามความเหมาะสม"`)

### `MockDocAIRAG`
- Interface สนทนา AI
- กล่องข้อความถามตอบ (เช่น "แนวทางแก้ไขสินค้าเปื้อนน้ำมันคืออะไร?")
- แสดง Reference Document Badge และสถิติ Function Call (`get_rework_statistics`)
