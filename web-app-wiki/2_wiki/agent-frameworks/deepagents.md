# Deep Agents Framework (SDK & CLI)
[วันที่อัปเดต: 2026-05-23]

## 1. Summary & Current Implementation
**Deep Agents** คือเฟรมเวิร์ก Open Source สำหรับทำ Agent Harness (ตัวจัดการและควบคุมพฤติกรรมเอเจนต์) พัฒนาต่อยอดบน **LangGraph** และ **LangChain** เพื่อทำหน้าที่เป็นเอเจนต์อัจฉริยะที่สามารถทำงานที่มีความยาว (long-horizon) และมีหลายขั้นตอน (multi-step) ได้ทันทีตั้งแต่แกะกล่อง มีจุดเด่นคือ Opinionated defaults, Extensible, Model-agnostic, และ Production-ready

โครงสร้างโปรเจกต์เป็นแบบ Python Monorepo ที่มีแพ็กเกจแยกการทำงานและจัดการเวอร์ชันอิสระ:
- `libs/deepagents`: แกนหลัก SDK (สร้างเอเจนต์, จัดการ sub-agents, memory, filesystem, และ skills)
- `libs/cli`: เครื่องมือ Command Line สำหรับสั่งการพัฒนาและ Deploy (`init`, `dev`, `deploy` ไปยัง LangGraph Platform)
- `libs/code`: ส่วนควบคุม Interactive Textual REPL (เช่น หน้าต่างดีบั๊กและสั่งการผ่าน Terminal)
- `libs/acp`: รองรับ Agent Context Protocol (ACP)
- `libs/evals`: ชุดทดสอบประเมินผลและการเชื่อมโยงกับ Harbor

---

## 2. Technical Code Snippet (Best Practice)

### การสร้าง Deep Agent (Python SDK Example)
```python
from deepagents import create_deep_agent

# สร้าง Agent ที่ติดตั้งระบบ Filesystem, Context, และ Sub-agents ไว้อัตโนมัติ
agent = create_deep_agent(
    model="openai:gpt-4o",  # ใช้โมเดลล่าสุดที่รองรับ Tool Calling
    tools=[my_custom_tool],
    system_prompt="You are a research assistant that uses tools to inspect files.",
)

# สั่งประมวลผลกระบวนการทำงาน
result = agent.invoke({"messages": "Research LangGraph and write a summary"})
```

### การสั่งการทดสอบและการดีบั๊กใน Monorepo (Commands)
```bash
# ติดตั้ง dependencies และเครื่องมือรันผ่าน uv
uv add deepagents

# รัน unit tests (ห้ามเรียกใช้เน็ตเวิร์ก)
make test

# รันไฟล์ทดสอบเฉพาะเจาะจง
uv run --group test pytest tests/unit_tests/test_specific.py

# รัน Linter และ Formatter ผ่าน ruff
make lint
make format
```

---

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[architecture/system-architecture.md]] — การใช้แนวคิดเอเจนต์ในการประสานงานระบบ
- **Depends On**: [[lessons-learned/debugging-practices.md]] — ระบบการดีบั๊กผ่าน Sub-agents และ Tools
- **Impacted By**: [[architecture/llm-wiki-pattern.md]] — การใช้ความรู้และ Guidelines ของเอเจนต์แบบ Dynamic Context
- **Contradicts**: หลีกเลี่ยงการใช้ `[tool.ruff.lint.per-file-ignores]` เพื่อปิดกฎ linter สำหรับทั้งไฟล์เมื่อพบจุดผิดพลาด ให้ใช้ inline comment `# noqa: RULE` กำกับเฉพาะบรรทัดแทนเพื่อไม่ให้ปิดความปลอดภัยทั้งหมดของไฟล์

---
> 🔄 *สร้างเมื่อ 2026-05-23*: Ingested ข้อมูลโครงสร้างและกฎการพัฒนาจาก `deepagents-main` Workspace และ `1_raw/langchain-aideepagents The batteries-included agent harness.md`
