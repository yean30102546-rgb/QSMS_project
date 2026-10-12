# AGENTS.md — Multi-Agent System Protocol for Thesis Development

เอกสารนี้กำหนดบทบาท หน้าที่ ข้อกำหนดอินพุต/เอาต์พุต และโปรโตคอลการทำงานร่วมกันของทั้ง 10 เอเจนต์ (Agent 0 ถึง Agent 9) เพื่อการจัดทำปริญญานิพนธ์ QSMS อย่างถูกต้องตามระเบียบวิธีวิจัยและสอดคล้องกันตลอดทั้งเล่ม

---

## 1. กฎบัตรกลาง (Core Directives for All Agents)

1. **ศูนย์ข้อมูลกลาง (Single Source of Truth)**:
   ทุก Agent ต้องอ่านและอ้างอิงข้อมูลจากไดเรกทอรี `thesis_agents/knowledge_base/` เป็นหลัก ห้ามคิดค้นตัวเลข สเปก หรือขั้นตอนขึ้นมาเอง
2. **การจัดการข้อเท็จจริงที่ยังไม่ยืนยัน**:
   ข้อมูลที่ยังไม่ได้รับการพิสูจน์หรือยังไม่มีผลทดสอบจริง ต้องระบุเป็น `[ยังไม่มีข้อมูล]` หรือระบุว่าอยู่ระหว่างรอตรวจสอบใน `05_decision_log.md` ห้ามคาดเดาแล้วนำไปเขียนเสมือนเป็นข้อเท็จจริง
3. **การรักษาความสอดคล้องของคำศัพท์ (Consistent Terminology)**:
   - ใช้ **6 บทบาท** เสมอ (`ADMIN`, `QSMS`, `WFG`, `CS`, `WPK`, `PDF`)
   - ใช้ **ฝ่ายผลิตซ่อม (PDF)** หรือ **แผนก PDF** อย่างคงเส้นคงวา
   - รหัสเคสใช้ **`RW`** (Internal Defect) และ **`RT`** (Customer Return)
   - ไม่นำโมดูล Presentation Deck, Sandbox Simulation หรือ 30/70 Canvas กลับเข้ามาในสารบบ
4. **การตรวจสอบผลกระทบข้ามบท (Impact Assessment)**:
   เมื่อมีการปรับปรุงเนื้อหาในบทใดบทหนึ่ง Agent ผู้รับผิดชอบต้องแจ้ง Agent 0 (Orchestrator) และ Agent 9 (Auditor) เพื่อประเมินผลกระทบต่อบทอื่นๆ ทันที

---

## 2. แผนที่การส่งต่องาน 5 ระยะ (5-Phase Collaborative Workflow)

```text
Phase 1: กำหนดโจทย์วิจัย
  [Agent 0: Orchestrator] + [Agent 1: Research Planner] + [Agent 2: Process Analyst]
  ➔ ส่งมอบ: Thesis Brief, Research Framework, As-Is/To-Be Workflows, P1-P7, O1-O7

Phase 2: สร้างฐานความรู้และวรรณกรรม
  [Agent 3: Literature Researcher]
  ➔ ส่งมอบ: Literature Matrix, ทฤษฎีรองรับ (TOC, RBAC96, MDM, Pragmatic FSD), เอกสารอ้างอิงจริง

Phase 3: วิเคราะห์และออกแบบระบบ
  [Agent 4: System Analyst] + [Agent 5: System Architect]
  ➔ ส่งมอบ: SRS, Use Cases, Finite State Machine (5 สถานะ), System Architecture, ER-Diagram

Phase 4: พัฒนาและประเมินผลเชิงประจักษ์
  [Agent 6: Developer] ⟷ [Agent 7: QA & Evaluator]
  ➔ ส่งมอบ: โค้ดจริง 7 โมดูล, Test Reports (203/203 passed), ตารางตัวเลขผลการวัดจริง (SSOT)

Phase 5: เรียบเรียงและตรวจสอบอิสระ
  [Agent 8: Academic Writer] ➔ [Agent 9: Academic Auditor] ➔ [Agent 0: Orchestrator]
  ➔ ส่งมอบ: เล่มปริญญานิพนธ์บทที่ 1–5, รายการตรวจสอบ Audit Report, เล่มฉบับสมบูรณ์
```

---

## 3. สรุปบทบาทหน้าที่และความรับผิดชอบของทั้ง 10 เอเจนต์

| เอเจนต์ (Agent) | บทบาทหลัก (Role) | รับผิดชอบในเล่ม | สิ่งที่ต้องส่งมอบ (Key Deliverables) |
|---|---|---|---|
| **Agent 0** | Thesis Orchestrator | ควบคุมทั้งเล่ม | Master Thesis Plan, Backlog, Decision Log, การควบคุมการเปลี่ยนแปลง |
| **Agent 1** | Research Planner | บทที่ 1, บทที่ 5 | Research Framework, P1–P7, O1–O7, ขอบเขตและข้อจำกัด |
| **Agent 2** | Process Analyst | บทที่ 1, บทที่ 3 | As-Is / To-Be Workflows, การวิเคราะห์ความสูญเปล่า, Two-Way Handshake |
| **Agent 3** | Literature Researcher | บทที่ 2 | Literature Matrix, ทฤษฎีรองรับที่ใช้งานจริง, รายการอ้างอิงที่ตรวจสอบได้ |
| **Agent 4** | System Analyst | บทที่ 3 | Software Requirements Specification (SRS), Use Case, State Machine |
| **Agent 5** | System Architect | บทที่ 3 | System Architecture, ER Diagram, Data Dictionary, Security Protocols |
| **Agent 6** | Developer | บทที่ 3, บทที่ 4 | Implementation Evidence, โครงสร้างโค้ด 7 โมดูล, ภาพหน้าจอจริง |
| **Agent 7** | QA & Evaluator | บทที่ 4, บทที่ 5 | Test Cases (Unit/Integration/UAT), ผลการวัดเชิงปริมาณ (SSOT Metrics) |
| **Agent 8** | Academic Writer | บทที่ 1–5 | ร่างเนื้อหาบทคัดย่อและบทที่ 1–5 ด้วยภาษาเชิงวิชาการที่ปราศจากคำอวยตัวเอง |
| **Agent 9** | Academic Auditor | ตรวจสอบทั้งเล่ม | Audit Report, ตารางตรวจสอบความสอดคล้อง 7 มิติ, รายการจุดบกพร่อง |
