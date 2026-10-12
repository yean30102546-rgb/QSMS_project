# QSMS Multi-Agent Thesis System

ระบบประสานงานปัญญาประดิษฐ์แบบหลายเอเจนต์ (Multi-Agent System) สำหรับการวิจัย พัฒนา และจัดทำเอกสารปริญญานิพนธ์ฉบับสมบูรณ์ โครงการระบบสารสนเทศเพื่อการจัดการคุณภาพและควบคุมงานแก้ไขชิ้นส่วน (QSMS)

---

## 🏛️ โครงสร้างสารบบ (Directory Layout)

```text
thesis_agents/
├── README.md                          # ภาพรวมและการใช้งานระบบ
├── AGENTS.md                          # กฎบัตรและโปรโตคอลการทำงานร่วมกันของทั้ง 10 เอเจนต์
├── agents/                            # คำสั่ง ข้อกำหนด และ System Prompt ของแต่ละ Agent
│   ├── agent_0_orchestrator.md        # Agent 0: Thesis Orchestrator (ผู้ควบคุมโครงการ)
│   ├── agent_1_research_planner.md    # Agent 1: Research Planner (ผู้วางกรอบวิจัย)
│   ├── agent_2_process_analyst.md     # Agent 2: Process Analyst (ผู้วิเคราะห์กระบวนการ)
│   ├── agent_3_literature_researcher.md# Agent 3: Literature Researcher (ผู้ค้นคว้าทฤษฎีและงานวิจัย)
│   ├── agent_4_system_analyst.md      # Agent 4: System Analyst (นักวิเคราะห์ระบบ)
│   ├── agent_5_system_architect.md    # Agent 5: System Architect (ผู้ออกแบบสถาปัตยกรรม)
│   ├── agent_6_developer.md           # Agent 6: Developer (ผู้พัฒนาระบบ)
│   ├── agent_7_qa_evaluator.md        # Agent 7: QA & Evaluator (ผู้ทดสอบและประเมินผล)
│   ├── agent_8_academic_writer.md     # Agent 8: Academic Writer (ผู้เรียบเรียงปริญญานิพนธ์)
│   └── agent_9_academic_auditor.md    # Agent 9: Academic Auditor (ผู้ตรวจสอบอิสระ)
├── knowledge_base/                    # ชุดข้อมูลอ้างอิงหลัก (Single Source of Truth)
│   ├── 01_thesis_brief.md             # ข้อมูลสรุปโครงการ ปัญหา วัตถุประสงค์ ขอบเขต
│   ├── 02_process_specification.md    # รายละเอียดกระบวนการ As-Is, To-Be, 6 บทบาท
│   ├── 03_system_specification.md     # ข้อกำหนดระบบ 7 โมดูล สถาปัตยกรรม ฐานข้อมูล
│   ├── 04_evidence_and_references.md  # ตารางตัวเลขหลัก ผลการทดสอบ และหลักฐานประจักษ์
│   ├── 05_decision_log.md             # บันทึกการตัดสินใจเชิงวิศวกรรม
│   └── traceability_matrix.md         # ตารางความสอดคล้อง 7 มิติ (P ➔ O ➔ M ➔ F ➔ R)
└── workflow/                          # ขั้นตอนการส่งต่องาน
    ├── workflow_phases.md             # ลำดับการทำงาน 5 ระยะ (Phase 1 ถึง Phase 5)
    └── chapter_mapping.md             # การจับคู่ Agent กับบทที่ 1 ถึงบทที่ 5
```

---

## 🚀 กฎเหล็กประจำระบบ (System Directives)

1. **ห้ามคาดเดาข้อมูล (No Hallucination)**: ทุก Agent ต้องอ้างอิงข้อมูลจาก `knowledge_base/` เท่านั้น หากจุดใดยังไม่มีการยืนยัน ให้บันทึกเป็น `[ยังไม่มีข้อมูล]` หรือระบุว่าอยู่ระหว่างรอตรวจสอบ
2. **ตารางตัวเลขหลักชุดเดียว (Single Source of Truth)**: ตัวเลขเชิงปริมาณทั้งหมด (เช่น อัตราลดลง 68.75%, ความแม่นยำ 96.36%, ขนาดไฟล์ลดลง 82.50%) ต้องตรงกับ `knowledge_base/04_evidence_and_references.md` เสมอ
3. **ตรวจสอบความสอดคล้องข้ามบท (Zero Semantic Disconnect)**: Agent 0 และ Agent 9 ทำหน้าที่ตรวจทานทุกบทตาม `knowledge_base/traceability_matrix.md` เพื่อป้องกันไม่ให้อาจารย์หรือ AI ตรวจพบความขัดแย้งเชิงตรรกะ
