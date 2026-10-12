# Workflow: Chapter Mapping & Responsibility Matrix

การกำหนดผู้รับผิดชอบหลักและการส่งมอบงานในแต่ละบทของเล่มปริญญานิพนธ์:

---

| บทในเล่มปริญญานิพนธ์ | Agent หลัก | Agent สนับสนุน | สิ่งที่ต้องได้ (Key Outputs) |
|---|---|---|---|
| **บทคัดย่อ (Abstract)** | Agent 8 (Writer) | Agent 1, Agent 7 | บทคัดย่อไทยและอังกฤษที่มีปัญหา, วิธีการ, ตัวเลขผลลัพธ์ (SSOT), และข้อสรุปครบถ้วน |
| **บทที่ 1 บทนำ** | Agent 1 (Planner), Agent 2 (Process) | Agent 8 | P1–P7, O1–O7, ขอบเขตระบบ, ขีดจำกัดโควตา, ตาราง Baseline ปัญหาเดิม |
| **บทที่ 2 ทฤษฎีและงานวิจัยที่เกี่ยวข้อง** | Agent 3 (Literature) | Agent 5, Agent 8 | ทฤษฎีรองรับจริง (TOC, RBAC96, MDM, Multimodal OCR, Hybrid RAG, Pragmatic FSD), เอกสารอ้างอิงจริง [1]–[9] |
| **บทที่ 3 วิธีดำเนินงานและการออกแบบระบบ** | Agent 2, Agent 4, Agent 5, Agent 6 | Agent 8 | As-Is/To-Be Workflows, SRS (FR1–FR7, NFR1–NFR4), 5 สถานะ FSM, Dual-Database ERD, Sequence Diagrams |
| **บทที่ 4 ผลการพัฒนาระบบและการทดสอบ** | Agent 6 (Developer), Agent 7 (QA) | Agent 8 | โครงสร้างโค้ด 7 โมดูล, ภาพหน้าจอจริง, ผลการรัน Unit Test 203/203, ผลการทดสอบประสิทธิภาพเชิงปริมาณ |
| **บทที่ 5 สรุปผล การอภิปราย และข้อเสนอแนะ** | Agent 1 (Planner), Agent 7 (QA), Agent 8 | Agent 0 | การสรุปผลตอบวัตถุประสงค์ครบ 7 ข้อ, Trade-off เชิงวิศวกรรม (Unsigned CDN, 768-dim, Free Tier Fallback), ทิศทางพัฒนาต่อยอด |
| **การตรวจสอบตลอดทั้งเล่ม (All Chapters)** | Agent 0 (Orchestrator), Agent 9 (Auditor) | ทุก Agent | รายงานการตรวจสอบความสอดคล้อง 7 มิติ (Traceability Matrix), การกำจัดข้อความเมตา/คำอวยตัวเอง/อีโมจิ |
