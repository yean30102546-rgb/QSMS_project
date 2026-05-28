# Harness Skills (Agent Skills & MCP Integration)
[วันที่อัปเดต: 2026-05-23]

## 1. Summary & Current Implementation
**Harness Skills** คือชุดของทักษะเอเจนต์ (Agent Skills) ที่ถูกจัดทำขึ้นในรูปแบบโครงสร้างโฟลเดอร์และไฟล์ Markdown พร้อม YAML frontmatter เพื่อช่วยให้ AI coding assistants (เช่น Claude Code, Cursor, GitHub Copilot) สามารถสร้าง, ควบคุม, แก้ไขข้อผิดพลาด และจัดการเวิร์กโฟลว์ CI/CD ของ Harness.io ได้อย่างถูกต้องด้วยภาษาธรรมชาติ

ระบบนี้ไม่ได้เป็นแค่โฟลเดอร์บรรจุ prompt แต่เป็น **Operating Model Workflow System** ที่ทำงานประสานร่วมกับ **Harness MCP v2 Server** โดยมีทักษะแบ่งออกเป็นกลุ่ม:
- **Create & Scaffold**: สร้าง Pipeline, Service, Environment, Infrastructure, Connector, Secret, Trigger
- **Run & Debug**: รันและวิเคราะห์ความล้มเหลวของ Pipeline, ดำเนินงานแก้ไข, แปลงเวอร์ชัน (v0 to v1)
- **Govern & Secure**: จัดการสิทธิ์การเข้าใช้งาน (RBAC), ผู้ใช้งาน, กำหนด Policy ปลอดภัย
- **Analyze & Report**: คำนวณ DORA metrics, วิเคราะห์ค่าใช้จ่าย (CCM), สรุปความพร้อมใช้งาน

---

## 2. Technical Code Snippet (Best Practice)

### การตั้งค่า Harness MCP v2 Server ใน Claude Code Settings (`~/.claude/settings.json`)
```json
{
  "mcpServers": {
    "harness-mcp-v2": {
      "command": "npx",
      "args": ["-y", "harness-mcp-v2"],
      "env": {
        "HARNESS_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

### โครงสร้างไฟล์ทักษะ (Skill Anatomy template: `skills/*/SKILL.md`)
```markdown
---
name: create-pipeline
description: Generate v0 Pipeline YAML (CI, CD, approvals, matrix strategies)
metadata:
  category: Harness
  version: 1.0.0
  mcp-server: harness-mcp-v2
license: Apache-2.0
compatibility: Requires Harness MCP v2 server
---
# Create Pipeline
[Instructions for AI model to follow step-by-step]
```

---

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[lessons-learned/debugging-practices.md]] — การแก้ไขปัญหาระบบด้วยแนวทางดีบั๊กเชิงโครงสร้าง
- **Impacted By**: [[architecture/llm-wiki-pattern.md]] — รูปแบบจัดเก็บความรู้เอเจนต์ (Raw Sources → Compiled Wiki → Control Schema)
- **Contradicts**: ห้ามสร้าง Payload หรืออ้างอิง connectors, secrets, environments ก่อนทำการยืนยันความมีอยู่จริงและการดึงสกีมาจาก `harness_describe` เพื่อป้องกันโมเดลทำข้อมูลหลอน (Hallucination)

---
> 🔄 *สร้างเมื่อ 2026-05-23*: Ingested ข้อมูลทักษะเอเจนต์และ MCP Integration จาก `1_raw/harnessharness-skills ...md`
