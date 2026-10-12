# Workflow: 5-Phase Collaborative Workflow

ขั้นตอนการส่งต่องานระหว่าง Agent 0 ถึง Agent 9 ในการจัดทำปริญญานิพนธ์:

---

## Phase 1 — กำหนดโจทย์วิจัย (Research Scoping)
- **ผู้รับผิดชอบ**: Agent 0 (Orchestrator) + Agent 1 (Research Planner) + Agent 2 (Process Analyst)
- **ขั้นตอนการส่งต่อ**:
  1. Agent 2 วิเคราะห์กระบวนการ As-Is และจุดความสูญเปล่าหน้างาน
  2. Agent 1 นำปัญหาจริงมากำหนดเป็น P1–P7, วัตถุประสงค์ O1–O7, และขอบเขตทางเทคนิค
  3. Agent 0 ตรวจสอบและลงบันทึกใน `knowledge_base/01_thesis_brief.md`
- **Output Gate**: ได้รับการอนุมัติโจทย์วิจัยและกรอบแนวคิดร่วมกัน

---

## Phase 2 — สร้างฐานความรู้วิชาการ (Literature & Theory)
- **ผู้รับผิดชอบ**: Agent 3 (Literature Researcher)
- **ขั้นตอนการส่งต่อ**:
  1. ค้นคว้าทฤษฎีที่มีอยู่จริง (Lean/TOC, RBAC96, MDM, Multimodal OCR, Hybrid RAG, Pragmatic FSD)
  2. จัดทำ Literature Matrix และตรวจสอบความถูกต้องของแหล่งอ้างอิง
  3. ส่งมอบรายการอ้างอิงให้บันทึกลงใน `knowledge_base/04_evidence_and_references.md`
- **Output Gate**: รายการเอกสารอ้างอิงจริงที่สามารถตรวจสอบย้อนกลับได้

---

## Phase 3 — วิเคราะห์และออกแบบระบบ (Analysis & Architecture)
- **ผู้รับผิดชอบ**: Agent 4 (System Analyst) + Agent 5 (System Architect)
- **ขั้นตอนการส่งต่อ**:
  1. Agent 4 แปลงขั้นตอนการทำงานเป็น SRS (FR1–FR7, NFR1–NFR4) และแบบจำลอง Finite State Machine (5 สถานะ)
  2. Agent 5 ออกแบบสถาปัตยกรรมระบบ Dual-Database, API Boundary, และโครงสร้างฐานข้อมูล ER Diagram
  3. ส่งมอบข้อมูลเข้าสู่ `knowledge_base/03_system_specification.md`
- **Output Gate**: ข้อกำหนด SRS และพิมพ์เขียวสถาปัตยกรรมที่สอดคล้องกับโค้ดจริง

---

## Phase 4 — พัฒนาและประเมินผลเชิงประจักษ์ (Implementation & Testing)
- **ผู้รับผิดชอบ**: Agent 6 (Developer) ⟷ Agent 7 (QA & Evaluator)
- **ขั้นตอนการส่งต่อ**:
  1. Agent 6 ยืนยันการทำงานของ 7 โมดูลหลัก และจัดทำหลักฐานโครงสร้างไฟล์โค้ด
  2. Agent 7 ออกแบบชุดทดสอบ รันการทดสอบระบบ (203 Unit Tests) และเก็บตัวเลขการประเมินผลเชิงปริมาณ
  3. Agent 7 อัปเดตตัวเลขผลลัพธ์ลงในตาราง Single Source of Truth (`knowledge_base/04_evidence_and_references.md`)
- **Output Gate**: ตารางผลการวัดเชิงประจักษ์ที่มีที่มา จำนวนตัวอย่าง และวิธีวัดชัดเจน

---

## Phase 5 — เรียบเรียงและตรวจสอบอิสระ (Drafting & Academic Auditing)
- **ผู้รับผิดชอบ**: Agent 8 (Academic Writer) ➔ Agent 9 (Academic Auditor) ➔ Agent 0 (Orchestrator)
- **ขั้นตอนการส่งต่อ**:
  1. Agent 8 นำข้อมูลจาก Knowledge Base มาเรียบเรียงเป็นเนื้อหาบทคัดย่อ และบทที่ 1 ถึงบทที่ 5 ด้วยภาษาวิชาการ
  2. Agent 9 ตรวจสอบความสอดคล้องเชิงตรรกะตลอดทั้งเล่มตาม Traceability Matrix และออก Audit Report
  3. หากพบข้อบกพร่อง Agent 0 จะสั่งส่งงานกลับไปแก้ที่ Agent ต้นทาง ก่อนนำมาเรียบเรียงใหม่
- **Output Gate**: เล่มปริญญานิพนธ์ฉบับสมบูรณ์ที่ปราศจากข้อผิดพลาดเชิงตรรกะ
