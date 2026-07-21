# แผนผังกระแสการทำงานระบบ (QSMS System Flow Diagrams)

แผนผังเหล่านี้ถูกปรับปรุงให้ใช้คำศัพท์ที่ **เข้าใจง่าย (User-friendly)** และลดความซับซ้อนเชิงเทคนิคลง เพื่อให้นำไปใช้ประกอบการนำเสนอ (Presentation) หรือใส่ในเล่มรายงานวิทยานิพนธ์ได้อย่างสวยงามและสื่อสารได้ชัดเจนยิ่งขึ้นครับ

---

## 1. ภาพรวมการทำงานของระบบ (Overall System Architecture)

```mermaid
flowchart TD
    subgraph Client ["🖥️ ฝั่งผู้ใช้งาน"]
        UI["หน้าเว็บแอปพลิเคชัน"]
    end

    subgraph Server ["⚙️ ระบบประมวลผลกลาง"]
        API["เซิร์ฟเวอร์หลัก (API)"]
    end

    subgraph Database ["🗄️ ฐานข้อมูลและระบบภายนอก"]
        DB[("ฐานข้อมูลหลัก (Supabase)")]
        ImageDB[("ระบบเก็บรูปภาพ (Cloudinary)")]
        AI["ระบบผู้ช่วยวิเคราะห์ (Gemini AI)"]
        Excel["ระบบสำรองข้อมูล (Google Sheets)"]
    end

    UI -->|"1. ส่งข้อมูลและคำสั่ง"| API
    UI -->|"2. อัปโหลดรูประบบ Rework"| ImageDB
    API -->|"3. สั่งให้ AI อ่านข้อมูล"| AI
    API -->|"4. บันทึกข้อมูลงาน"| DB
    API -->|"5. ซิงค์ข้อมูลสำรอง"| Excel
```

---

## 2. ขั้นตอนการทำงานของ AI ช่วยอ่านแบบแปลน (AI Document OCR Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👨‍🔧 ผู้ใช้งาน
    participant Web as 💻 หน้าเว็บแอป
    participant API as ⚙️ ระบบเซิร์ฟเวอร์
    participant AI as 🧠 AI วิเคราะห์เอกสาร
    participant DB as 🗄️ ฐานข้อมูล

    User->>Web: อัปโหลดไฟล์แบบแปลน (PDF)
    Web->>API: ส่งไฟล์เข้าสู่ระบบ
    API->>AI: สั่งให้ AI อ่านและสกัดข้อมูลสำคัญ
    AI-->>API: ส่งคืนข้อมูลที่อ่านได้ (รหัส, ชื่อสินค้า, ฯลฯ)
    API-->>Web: แสดงข้อมูลลงในแบบฟอร์มให้โดยอัตโนมัติ
    Web->>User: ให้ผู้ใช้ตรวจสอบความถูกต้องอีกครั้ง
    User->>Web: กดยืนยันการบันทึก
    Web->>API: ส่งข้อมูลที่ยืนยันแล้ว
    API->>DB: บันทึกข้อมูลลงฐานข้อมูล
    DB-->>Web: แจ้งผลการบันทึกสำเร็จ
```

---

## 3. ระบบช่วยตรวจสอบและป้องกันข้อมูลผิดพลาด (Smart Verification)

```mermaid
stateDiagram-v2
    [*] --> รอกรอกข้อมูล : เริ่มต้น
    
    รอกรอกข้อมูล --> กำลังตรวจสอบ : ผู้ใช้พิมพ์รหัสสินค้า
    
    state กำลังตรวจสอบ {
        [*] --> ค้นหาในระบบ : ค้นหาจากฐานข้อมูลสินค้าส่วนกลาง
    }
    
    กำลังตรวจสอบ --> ข้อมูลถูกต้อง : พบข้อมูลตรงกัน
    กำลังตรวจสอบ --> สินค้าใหม่ : ไม่พบรหัสสินค้านี้มาก่อน
    กำลังตรวจสอบ --> ข้อมูลขัดแย้ง : รหัสและชื่อไม่ตรงกัน (เสี่ยงผิดพลาด)
    
    ข้อมูลถูกต้อง --> [*] : ระบบเติมข้อมูลสเปกให้เรียบร้อย (Autofill)
    สินค้าใหม่ --> [*] : ให้ผู้ใช้กรอกเองและบันทึกเป็นสินค้าใหม่
    ข้อมูลขัดแย้ง --> รอกรอกข้อมูล : แจ้งเตือนข้อผิดพลาด บล็อกไม่ให้ไปต่อ
```

---

## 4. วงจรชีวิตการทำงานของงาน Rework (Rework Case Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> รอดำเนินการ : สร้างใบงาน Rework ใหม่
    
    รอดำเนินการ --> กำลังดำเนินการ : ฝ่ายผลิตเริ่มซ่อมแซมสินค้า
    
    state กำลังดำเนินการ {
        [*] --> ซ่อมแซม : ล้างแกลลอน / เปลี่ยนฝา / แพ็คลงกล่อง
        ซ่อมแซม --> ตรวจสอบ : ถ่ายรูปหลักฐานและนับจำนวน
    }
    
    กำลังดำเนินการ --> เสร็จสมบูรณ์ : ฝ่ายการเงินประเมินค่าแรงและค่าวัสดุ
    
    เสร็จสมบูรณ์ --> [*] : ปิดใบงานและออกรายงาน Excel ได้
```

---

## 5. กระบวนการนำเข้าคู่มือเพื่อสอน AI (AI Knowledge Ingestion)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👨‍💼 แอดมินระบบ
    participant Web as 💻 หน้าจอจัดการคู่มือ
    participant Server as ⚙️ เซิร์ฟเวอร์
    participant AI as 🧠 AI สร้างสมอง (Embedding)
    participant DB as 🗄️ ฐานข้อมูลความรู้

    Admin->>Web: อัปโหลดไฟล์คู่มือเทคนิค (PDF)
    Web->>Server: ส่งไฟล์เข้าสู่ระบบ
    Server->>Server: แยกไฟล์ออกเป็นหน้าๆ และอ่านตัวอักษร
    Server->>AI: ส่งเนื้อหาไปประมวลผลเป็นความหมายเชิงลึก (Vector)
    AI-->>Server: ส่งคืนข้อมูลความรู้ที่แปลงแล้ว
    Server->>DB: จัดเก็บความรู้เข้าสู่สมองของ AI
    DB-->>Web: แจ้งผลว่าระบบ AI พร้อมตอบคำถามแล้ว
```

---

## 6. แผนภาพความสัมพันธ์ของฐานข้อมูล (Database ERD)

เนื่องจากระบบถูกแบ่งส่วนฐานข้อมูลออกจากกันอย่างชัดเจนตามขอบเขตการทำงาน (Bounded Context) แผนภาพจึงถูกแยกออกเป็น 2 ส่วนหลัก ดังนี้:

### 6.1 ฐานข้อมูลระบบจัดการงาน Rework (Rework Management DB)

```mermaid
erDiagram
    REWORK_CASES ||--o{ REWORK_ITEMS : "ประกอบด้วยรายการสินค้า"
    REWORK_CASES ||--o{ REWORK_LOGS : "บันทึกประวัติการแก้ไข"
    REWORK_ITEMS }o--|| REWORK_MASTER_ITEMS : "ตรวจสอบความถูกต้องด้วย"
    REWORK_MASTER_ITEMS ||--o{ REWORK_MASTER_DEFECTS : "อ้างอิงรหัสอาการเสีย"

    REWORK_CASES {
        text id PK "รหัสใบงาน"
        text case_name "ชื่อเคส"
        text customer_name "ชื่อลูกค้า"
        text status "สถานะใบงาน"
        decimal total_rework_cost "ค่าใช้จ่ายรวม"
    }

    REWORK_ITEMS {
        uuid id PK
        text case_id FK
        text item_code "รหัสสินค้า"
        decimal amount "จำนวน"
        text reason "อาการเสีย"
    }

    REWORK_LOGS {
        uuid id PK
        text case_id FK
        text action "การกระทำ (สร้าง/เปลี่ยนสถานะ)"
        text performed_by "ผู้ทำรายการ"
    }

    REWORK_MASTER_ITEMS {
        uuid id PK
        text item_code "รหัสสินค้ามาตรฐาน"
        text item_name "ชื่อสินค้ามาตรฐาน"
    }
```

### 6.2 ฐานข้อมูลระบบเอกสารและคู่มือ AI (Document & Knowledge DB)

```mermaid
erDiagram
    RAG_DOCUMENTS ||--o{ RAG_DOCUMENT_CHUNKS : "ถูกหั่นเนื้อหาเป็นส่วนๆ"
    RAG_DOCUMENTS ||--o{ RAG_FEEDBACK : "รับผลตอบรับความแม่นยำ"

    ENGINEERING_DRAWINGS {
        uuid id PK
        text drawing_number "เลขที่แบบแปลน"
        text revision "เวอร์ชัน"
        text file_name "ชื่อไฟล์"
    }

    RAG_DOCUMENTS {
        uuid id PK
        text filename "ชื่อไฟล์คู่มือ"
    }

    RAG_DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        text content "เนื้อหาที่ถูกตัดแบ่งให้ AI อ่าน"
    }
```
