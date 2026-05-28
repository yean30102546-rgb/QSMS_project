# LLM Wiki Pattern — Karpathy Method
[วันที่อัปเดต: 2026-05-21]
**Source**: `1_raw/llm-wiki/llm-wiki.md` (Andrej Karpathy's Gist)

## 1. Summary — แนวคิดหลัก
ระบบ wiki นี้สร้างตามแนวคิดของ Karpathy: แทนที่จะใช้ RAG ค้นเอกสารดิบทุกครั้ง
LLM จะ **สร้างและรักษา wiki ถาวร** ที่สรุป + เชื่อมโยงความรู้ไว้ล่วงหน้า
ผลคือ: ค้นเร็วขึ้น, Token ถูกลง, ความรู้สะสมทบต้น

> **"The wiki is a persistent, compounding artifact."**

## 2. Architecture — 3 Layers
```
1_raw/        ← Raw Sources  [Read-Only] — Source of Truth
2_wiki/       ← The Wiki     [LLM writes] — สรุป, เชื่อมโยง, สังเคราะห์
AGENTS.md     ← The Schema   [AI behavior rules] — วิธีทำงานของ AI
```

## 3. Operations — 3 โหมดหลัก

### 🔵 Ingest (คำสั่ง: "ingest X")
1. อ่าน raw source
2. หา key information
3. อัปเดต wiki pages ที่เกี่ยวข้อง (อาจแตะ 10-15 หน้า/source)
4. อัปเดต `index.md`
5. บันทึกใน `log.md`

### 🟢 Query (คำถามทั่วไป)
1. อ่าน `index.md`
2. ดึง pages ที่เกี่ยวข้อง
3. สังเคราะห์คำตอบ
> ✅ **คำตอบที่มีคุณค่าควร file กลับเข้า wiki เป็น page ใหม่**

### 🔴 Lint (Health Check)
ตรวจสอบ:
- ข้อขัดแย้งระหว่าง pages
- ข้อมูล stale ที่ถูกแทนที่แล้ว
- Orphan pages (ไม่มี inbound links)
- Missing cross-references
- Data gaps ที่ควรค้นเพิ่ม

## 4. index.md — Best Practice
- 1 บรรทัด/หน้า — เน้น **high-density, low-token**
- จัดเป็นหมวดหมู่ (Tech, Components, Lessons ฯลฯ)
- LLM อ่านไฟล์นี้ **ก่อนเสมอ** ก่อนตอบคำถาม

## 5. log.md — Best Practice
- Append-only — **ห้ามลบ**
- Format: `## [YYYY-MM-DD] action | description`
- ทำให้ grep ได้: `grep "^## \[" log.md | tail -5`

## 6. ทำไมถึงได้ผล
| ปัญหา RAG ทั่วไป | วิธีแก้ของ LLM Wiki |
|---|---|
| ค้น + สังเคราะห์ใหม่ทุกครั้ง | สังเคราะห์ไว้ล่วงหน้า |
| Cross-reference ต้องหาเอง | เชื่อมโยงฝังไว้ใน wiki แล้ว |
| Contradiction ไม่รู้ | Flag ไว้เป็น `[Conflict Note]` |
| Maintenance ยาก | LLM ทำแทนหมด |

## 7. Knowledge Relationships
- **Impacted By**: [[AGENTS.md]] — Schema ของโปรเจกต์นี้อิงแนวคิดนี้
- **Depends On**: [[index.md]] — เป็น implementation ของ index.md concept

> 🔄 *สร้างเมื่อ 2026-05-21*: Ingested จาก `1_raw/llm-wiki/llm-wiki.md` (Karpathy Gist)

## 8. Agent Protocol Update
[Updated: 2026-05-28]

`AGENTS.md` ถูกเรียบเรียงใหม่เป็น QSMS Agent Protocol ที่แบ่งงานเป็นลำดับใช้งานจริง: Start-of-Task, Skill Selection, Working, Wiki Retrieval, Wiki Writing, Post-Task, และ Communication Style.
แกนเดิมยังคงอยู่ครบ: อ่าน `index.md` ก่อน, ห้ามแก้ `.llm-wiki/1_raw/`, ห้ามสร้าง wiki ซ้ำ, ต้อง cross-link, และ ingest เฉพาะความรู้ที่ช่วยลด Token ในอนาคต.

### Knowledge Relationships
- **Depends On**: [[index.md]] — protocol ใหม่ยังใช้ Flat Index เป็น entry point หลัก
- **Impacted By**: [[../../AGENTS.md]] — agent behavior schema ของ repo
- **Contradicts**: [Deprecated] AGENTS.md เวอร์ชันเก่ามีตัวอย่างซ้ำและลำดับงานกระจัดกระจาย; เวอร์ชัน 2026-05-28 ปรับเป็น workflow ที่สั้นและตรวจตามได้ง่ายกว่า

## 9. Harness Portability Note
[Updated: 2026-05-28]

เพิ่ม `HARNESS.md` ที่ root repo เพื่ออธิบาย runtime contract สำหรับนำ agent workflow ไปใช้กับ IDE อื่น: context injection, file/search/shell/patch tools, sandbox approval, message channels, skill loading, safe editing, verification, และ post-task wiki ingestion.

### Knowledge Relationships
- **Depends On**: [[../../HARNESS.md]], [[../../AGENTS.md]]
- **Impacted By**: [[index.md]]
- **Contradicts**: ไม่มี; เป็นเอกสาร portability ที่ทำให้ AGENTS.md ใช้ข้าม IDE ได้ง่ายขึ้น
