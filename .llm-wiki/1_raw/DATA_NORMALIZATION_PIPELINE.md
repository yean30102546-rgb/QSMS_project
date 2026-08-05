# Raw Knowledge: OCR Data Normalization Pipeline & Database Integrity Architecture

## 1. Executive Summary
การบันทึกข้อมูลจาก OCR/LLM Vision เข้าสู่ฐานข้อมูลมักประสบปัญหาข้อมูลขยะ (Junk Data) และรูปแบบข้อมูลไม่เป็นสัดส่วน (Data Inconsistency) เนื่องจากเอกสารต้นทางมีฟอร์แมตหลากหลาย การแก้ปัญหานี้ให้ได้ 100% ตามหลักวิศวกรรมข้อมูล (Data Engineering) จำเป็นต้องใช้สถาปัตยกรรมแบบ **Multi-Stage Validation & Canonical Data Pipeline**

---

## 2. 5 สถาปัตยกรรมวิศวกรรมข้อมูล (Engineering Pillars)

### Pillar 1: Canonical Data Model (CDM)
- **หลักการ:** กำหนดโครงสร้างข้อมูลกลาง (Single Source of Truth) ที่ทุกเอกสาร ( drawings, masters, invoices) ต้องถูกแปลงให้อยู่ในฟอร์แมตเดียวกันก่อนเสมอ
- **เป้าหมาย:** ตัดความซ้ำซ้อนของการแมปแบบ Point-to-Point

### Pillar 2: Master Lookup & Alias Mapping Table (Dictionary Normalization)
- **หลักการ:** ใช้ตารางอ้างอิงในฐานข้อมูล (Lookup Table) แทนการเขียน Regex Hardcode ในโค้ด
- **โครงสร้างตัวอย่าง (`customer_aliases`):**
  - `raw_input`: "ENEOS Thailand", "Eneos Co., Ltd.", "เอเนออส"
  - `canonical_id`: "ENEOS"
- **Zero-Unknown Strategy:** หากเจอค่าใหม่ที่ไม่เคยมีใน Lookup Table ให้จัดอยู่ในสถานะ `Pending Master Normalization` เพื่อให้ผู้ดูแลอนุมัติเพียงครั้งเดียว และบันทึกเข้าพจนานุกรมกลาง

### Pillar 3: Constrained LLM Extraction & Validation Gate
- **หลักการ:** บังคับให้ LLM (Gemini Vision) ส่งคืนเฉพาะ Structured JSON ที่มี Enum ตรงตาม Schema กำหนดเท่านั้น
- **Quality Gate:** ใช้ระบบ Confidence Scoring หากคะแนนความมั่นใจต่ำกว่าเกณฑ์ หรือมีฟิลด์ที่ไม่ตรงตาม Format ให้ส่งเข้าคิวตรวจทาน (Verification Queue)

### Pillar 4: Validate-Before-Load (Staging Architecture)
- **หลักการ:** ห้ามบันทึกข้อมูลดิบตรงเข้าตารางหลัก (Production Table) 
- **Workflow:** 
  `OCR Extraction` -> `Validation Gate` -> (ถ้าผ่าน) `Production DB` / (ถ้าไม่ผ่าน) `Staging Queue (Human Review)`

### Pillar 5: Database Domain & Check Constraints (Last Line of Defense)
- **หลักการ:** ป้องกันข้อมูลขยะที่ระดับก้นบึ้งที่สุดด้วย PostgreSQL Database Constraints
- **ตัวอย่าง:**
  - `CHECK (oil_group IN ('ENGINE OIL', 'GEAR OIL'))`
  - `FOREIGN KEY (customer_name) REFERENCES customer_masters(name)`

---

## 3. Reference Standards
- Enterprise Data Architecture & Canonical Model Patterns
- ISO/IEC 11179 Metadata Registries & Data Normalization Standard
