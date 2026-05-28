# Systematic Debugging & Agentic Diagnostic Practices
[วันที่อัปเดต: 2026-05-21]
**Source**: Ingested จาก `1_raw/Kodezi Chronos/`, `1_raw/debugger.md/`, และ `1_raw/How to Debug Your Code/`

---

## 1. Summary
คู่มือรวบรวมแนวทางการดีบั๊กอย่างเป็นระบบ (Systematic Debugging) ทั้งในมุมมองการพัฒนาร่วมกับ AI Agent (เช่น โมเดลที่เชี่ยวชาญการดีบั๊กอย่าง Kodezi Chronos และข้อกำหนดของ Claude Subagent) และมุมมองการแก้ปัญหาหน้างานจริง (เช่น การใช้ GitHub Issues/PRs และกฎการเขียน React Hooks ร่วมกับ tRPC)

---

## 2. AI-Driven Debugging Innovation (Kodezi Chronos)
การดีบั๊กโค้ดระดับ Repository-Scale แตกต่างจากการเขียนโค้ดทั่วไปอย่างสิ้นเชิง (โมเดลทั่วไปเด่นด้าน Code Gen แต่มี Debugging Gap ถึง 50+ percentage points บน SWE-bench Lite) นวัตกรรมจาก Chronos ในฐานะ Debugging-First Model ประกอบด้วย:

### Seven-Layer System Design
1. **Multi-Source Input Layer**: ประมวลผล Code, Logs, Traces, Tests, และ Docs ไปพร้อมกัน
2. **Adaptive Retrieval Engine (AGR)**: ค้นหาความเชื่อมโยงของโค้ดแบบ Dynamic k-hop graph traversal (ความแม่นยำ 92%) รองรับโปรเจกต์ขนาดใหญ่โดยไม่สูญเสียความแม่นยำจาก Context Dilution
3. **Debug-Tuned LLM Core**: โมเดลที่เทรนด้วย Debugging Examples 42.5 ล้านตัวอย่าง
4. **Orchestration Controller**: ควบคุมการทำงาน Loop เสนอและตรวจสอบแผนแก้บั๊ก
5. **Persistent Debug Memory (PDM)**: ระบบจดจำประวัติและสไตล์การแก้บั๊กของแต่ละ Repository ช่วยให้แก้ไขสำเร็จเพิ่มขึ้นจาก 35% เป็น 65% เมื่อผ่านหลายเซสชัน (Cache Hit 87%)
6. **Execution Sandbox**: รันชุดทดสอบเพื่อประเมินความถูกต้องของบั๊กก่อนบันทึก
7. **Explainability Layer**: สร้างสรุป Root Cause และขั้นตอนการแก้ปัญหาในภาษาที่มนุษย์เข้าใจได้ง่าย

---

## 3. Claude Code Debugger Subagent Specification
ข้อตกลงและหลักคิดสำหรับ AI Subagent ที่ทำหน้าที่เป็น Debugging Specialist เพื่อการสืบค้นและแก้ไขอย่างรอบคอบ:

### Debugging Checklist (8 Gateways)
- [ ] **Issue reproduced consistently**: ยืนยันพฤติกรรมและการจำลองปัญหาได้ชัดเจน
- [ ] **Root Cause identified clearly**: แยกแยะปัญหาที่แท้จริงออกจากอาการ (Symptoms)
- [ ] **Fix validated thoroughly**: ทดสอบโค้ดหลังแก้ว่าไม่เกิดผลข้างเคียง
- [ ] **Side effects checked completely**: ตรวจสอบผลกระทบต่อระบบข้างเคียง
- [ ] **Performance impact assessed**: ประเมินผลกระทบเชิงประสิทธิภาพ (CPU, Memory, Latency)
- [ ] **Documentation updated properly**: อัปเดตเอกสารประกอบหากมีการเปลี่ยนสถาปัตยกรรม
- [ ] **Knowledge captured systematically**: บันทึกลงใน LLM Wiki เพื่อป้องกันการเกิดซ้ำ
- [ ] **Prevention measures implemented**: วางระบบตรวจสอบ (เช่น Linter หรือ Unit Test) ป้องกันบั๊กเดิม

### Common Bug Patternsที่ควรระวัง
- **Concurrency & Timing**: Race Conditions, Deadlocks, Livelocks, Timing issues
- **Logic & Boundary**: Off-by-one, Exception/Null-pointer, Type mismatch
- **Memory & Resource**: Leaks, Corruption, Buffer overflow, Resource contention
- **Operational**: Configuration mismatch, Environment variations, API Misuse

---

## 4. GitHub-First Debugging Methodology
วิธีการแก้ปัญหาเชิงปฏิบัติโดยการสืบค้นข้อมูลจากชุมชนนักพัฒนาบน GitHub:
1. **documentation & Keyword search**: เริ่มต้นจากการอ่านเอกสารของ Library นั้นๆ หากไม่คืบหน้าให้ค้นหาด้วย Keywords ของอาการเสียใน Issues tab (ค้นหารวมถึง Closed Issues)
2. **Pull Requests Inspection**: หลายครั้ง บั๊กที่พบบนเวอร์ชันทางการได้รับการแก้ไขแล้วใน PRs ที่ยังไม่ถูก Merge สามารถดึงสาขานั้นมาทดสอบหรือดูแนวทางการแก้ได้
3. **Discussions & Community**: ใช้ Discussions tab เพื่อขอความช่วยเหลือ โดยแนบขั้นตอนการเกิดและระบบที่เกี่ยวข้องอย่างชัดเจน

### Case Study: tRPC React Hooks ใน `useEffect`
**ปัญหา**: พยายามเรียกคำสั่งแบบสอบถาม API ใน `useEffect` หรือในเงื่อนไขการทำงาน (เช่น การเรียกใช้ `trpc.projects.checkSlugAvailability.useQuery(...)` เพื่อเช็คความซ้ำของข้อมูลแบบ Real-time 500ms) ซึ่งส่งผลให้เกิดการละเมิดกฎของ React Hooks (ห้ามเรียก Hook ภายใต้เงื่อนไขหรือใน nested function)

**วิธีการแก้ไขที่ถูกต้อง (Pro Practice)**:
หลีกเลี่ยงการใช้ `useQuery` ภายใน `useEffect` โดยเปลี่ยนไปใช้ `useContext` เพื่อดึง Instance ของ API client และเรียกใช้คำสั่ง `.fetch()` แบบ Asynchronous แทน:
```typescript
// 1. ดึง context ของ trpc ที่ระดับบนสุดของ Component (ถูกกฎของ Hooks)
const { projects } = trpc.useContext();

// 2. เรียกใช้ .fetch() ซึ่งไม่ใช่ Hook ภายใน useEffect (ปลอดภัยและถูกกฎ)
useEffect(() => {
  const timeoutId = setTimeout(async () => {
    if (kebabSlug) {
      const isSlugAvailable = await projects.checkSlugAvailability.fetch({
        slug: kebabSlug
      });
      if (!isSlugAvailable) {
        setError("slug", { message: "This slug is not available" });
      } else {
        clearErrors(["slug"]);
      }
    }
  }, 500);
  return () => clearTimeout(timeoutId);
}, [kebabSlug, setError, projects, clearErrors]);
```

---

## 5. Knowledge Relationships
- **Depends On**: [[AGENTS.md]] — กฎและกรอบการทำงานของ AI Agent ในคลังข้อมูลนี้
- **Impacts**: [[lessons-learned/bugs-and-fixes.md]] — ประวัติการแก้ไขบั๊กของโปรเจกต์ QSMS
- **Referenced By**: [[architecture/knowledge-synthesis.md]] — คลังสังเคราะห์ข้อมูลองค์รวม

---
> 🔄 *สร้างเมื่อ 2026-05-21*: สังเคราะห์และรวบรวมมาตรฐานจากแหล่งข้อมูลประวัติและทฤษฎีการดีบั๊กเชิงรุก


## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/How to Debug Your Code, the Right Way — Like a Pro with Examples.md]]
- Ingested Raw Source: [[1_raw/awesome-claude-code-subagentscategories04-quality-securitydebugger.md at main.md]]
- Ingested Raw Source: [[1_raw/ERROR_HANDLING_SETUP_1987677605.ts]]
