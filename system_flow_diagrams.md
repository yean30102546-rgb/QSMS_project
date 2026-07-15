# แผนผังกระแสการทำงานระบบ (QSMS System Flow Diagrams)

แผนผังเหล่านี้เขียนขึ้นโดยใช้ไวยากรณ์ **Mermaid.js** ซึ่งคุณสามารถคัดลอกโค้ดไปแสดงผลในสไลด์นำเสนอ เล่มรายงาน (Markdown) หรือโปรแกรมที่รองรับได้ทันที

---

## 1. แผนผังโครงสร้างสถาปัตยกรรมระบบ (Overall System Architecture)

```mermaid
flowchart TD
    subgraph Client ["ฝั่งผู้ใช้งาน (Client SPA Layer)"]
        UI["React SPA Shell (Tailwind v4 / Motion)"]
        Comp["Image Compressor (Client-side)"]
    end

    subgraph Server ["ระดับเซิร์ฟเวอร์ (API Gateway & Proxy)"]
        NextAPI["Next.js Route Handlers (/api/drawings)"]
    end

    subgraph Service ["บริการภายนอกและฐานข้อมูล (Services Layer)"]
        SupaDB[("Supabase DB (PostgreSQL)")]
        Cloudinary[("Cloudinary API (Evidence Images)")]
        GAS["Google Apps Script (Legacy Data Sync)"]
        Gemini["Gemini AI 3.5 Flash (OCR Engine)"]
    end

    UI -->|1. Request Metadata| NextAPI
    UI -->|2. Direct Upload compressed img| Cloudinary
    NextAPI -->|3. Call Gemini Vision API| Gemini
    NextAPI -->|4. Store Metadata| SupaDB
    NextAPI -->|5. Sync Sheets Transaction| GAS
    Cloudinary -.->|6. Return Image URL| UI
```

---

## 2. ลำดับขั้นตอนการวิเคราะห์และดึงข้อมูลแบบแปลน (AI Drawing/Master OCR Ingestion)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as เจ้าหน้าที่ฝ่ายผลิต/คลังสินค้า
    participant Front as Frontend UploadModal.tsx
    participant API as Next.js API (/api/drawings)
    participant Gemini as Gemini AI API
    participant Supa as Supabase Database

    Staff->>Front: อัปโหลดเอกสาร PDF (Drawing / Master)
    Front->>Front: แปลงไฟล์เป็น Base64 Data
    Front->>API: ส่ง JSON Request (Base64 + type)
    API->>Gemini: วิเคราะห์เอกสารตามประเภท Prompt Template
    Note over Gemini: วิเคราะห์แยกประเภท:<br/>- Customer Drawing: งดดึงข้อมูลภายใน<br/>- Master spec: ดึงข้อมูลและประเภทน้ำมัน
    Gemini-->>API: คืนค่า JSON Metadata ผลลัพธ์การอ่าน
    API-->>Front: ส่ง Metadata กลับไปยังฟอร์มหน้าจอ
    Front->>Staff: แสดงผลข้อมูลล่วงหน้าให้ตรวจสอบและแก้ไข (Preview Form)
    Staff->>Front: กดยืนยันการบันทึกข้อมูล
    Front->>API: ส่งข้อมูลที่ตรวจสอบแล้ว (Save Action)
    API->>Supa: อัปเดตข้อมูลและเปลี่ยนเอกสารเก่าเป็น Inactive (Versioning)
    Supa-->>API: ยืนยันบันทึกสำเร็จ
    API-->>Front: บันทึกข้อมูล Drawing/Master เสร็จสิ้น
```

---

## 3. ผังสถานะระบบตรวจสอบข้อมูลสินค้าอัตโนมัติสองทาง (Two-Way Verification States)

```mermaid
stateDiagram-v2
    [*] --> Idle : รอกรอกข้อมูลรหัสสินค้า
    
    Idle --> Checking : พนักงานกรอก Item Code / Item Number
    
    state Checking {
        [*] --> Database_Lookup : สืบค้นจากตาราง Item Master
    }
    
    Checking --> Verified : พบข้อมูลในระบบมาสเตอร์
    Checking --> New : ไม่พบรหัสในมาสเตอร์
    Checking --> Conflict : รหัสถูกบันทึกซ้ำซ้อนหรือติดเงื่อนไข
    
    Verified --> [*] : ดึงสเปกไปกรอกอัตโนมัติ (Autofill)
    New --> [*] : บังคับกรอกมือและจัดเก็บเข้าฐานข้อมูลในพื้นหลัง (Smart Upsert)
    Conflict --> Idle : แจ้งเตือนข้อผิดพลาดและเคลียร์ช่องป้อนข้อมูล
```

---

## 4. แผนผังกระบวนการดำเนินงานของ Rework Case (Rework Case Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> Pending : สร้างใบงาน Rework Case โดย Operator (สถานะรอนำเนินการ)
    
    Pending --> In_Progress : เจ้าหน้าที่คลังสแกนแกลลอนและเริ่มซ่อมแซมแก้ไข
    
    state In_Progress {
        [*] --> Processing : กำลังล้างแกลลอน / เปลี่ยนฝา / แพ็คลงกล่อง
        Processing --> Verification : ตรวจสอบรูปภาพหลักฐานและนับจำนวน
    }
    
    In_Progress --> Awaiting_Valuation : ส่งต่อใบงานเสร็จสิ้นให้ฝ่ายบัญชีและการเงิน
    
    Awaiting_Valuation --> Completed : ฝ่ายการเงินบันทึกค่าแรงจริงและค่าวัสดุ (Valuation)
    
    Completed --> [*] : ใบงานปิดสำเร็จพร้อมส่งออกรายงาน Excel
```

---

## 5. กระบวนการนำเข้าเอกสารความรู้ของระบบคู่มืออัจฉริยะ (DocAI RAG Ingestion Pipeline)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as ผู้ดูแลระบบคู่มือเทคนิค
    participant Front as Frontend DocAI Dashboard
    participant API as Next.js API (/api/rag)
    participant Jina as Jina AI API (Embedding)
    participant Supa as Supabase pgvector DB

    Admin->>Front: อัปโหลดเอกสารคู่มือการซ่อมแซม PDF
    Front->>Front: แบ่งหน้าและแปลงหน้า PDF เป็น JPEG (pdfjs-dist)
    Front->>API: ส่งข้อมูลรูปภาพหน้าคู่มือ
    API->>API: ใช้ OCR สกัดข้อมูลข้อความและตารางจากหน้า
    API->>Jina: ส่งข้อความไปคำนวณเวกเตอร์ embeddings (Jina-v5)
    Jina-->>API: คืนค่าเวกเตอร์พิกัด 768 มิติ
    API->>Supa: บันทึก Chunk เนื้อหาคู่มือและ Vector ลง pgvector
    Supa-->>API: บันทึกข้อมูลเวกเตอร์สำเร็จ
    API-->>Front: แสดงเครื่องหมายนำเข้าเอกสารเสร็จสมบูรณ์
```
