# Tech Stack 2026 — Full Stack Development Guide
[วันที่อัปเดต: 2026-05-21]
**Source**: `1_raw/tech stack/tech stack 2026.md` (NotebookLM Summary จาก 10 แหล่ง)

## 1. Summary
เอกสารสรุปจาก 10 แหล่งข้อมูลเกี่ยวกับ Tech Stack และ Full Stack Development ในปี 2026
**ผลสรุป**: Next.js + React กลายเป็น default มาตรฐาน, AI integration สำคัญขึ้นเรื่อยๆ

## 2. Tech Stacks ยอดนิยมในปี 2026

| Stack | ประกอบด้วย | เหมาะสำหรับ |
|---|---|---|
| **Modern Web** | Next.js + React + Tailwind CSS | เว็บทั่วไป, SEO สำคัญ |
| **T3 Stack** | TypeScript + Tailwind + tRPC + Next.js | Type safety สูง, ทีมเก่ง TS |
| **MERN** | MongoDB + Express + React + Node.js | NoSQL, flexible data |
| **PERN** | PostgreSQL + Express + React + Node.js | Relational data, ACID |
| **AI-Native** | Python(FastAPI) + Vector DB + LLM | AI/ML features |
| **Enterprise** | .NET 8+ / Java + PostgreSQL | ระบบใหญ่, ความปลอดภัยสูง |

## 3. Frontend Trends 2026
- **Next.js + React** = มาตรฐานใหม่ (ทำ SSR/SSG ในตัว, API Routes)
- **Tailwind CSS** = styling standard
- **TypeScript** = ต้องใช้ทุก stack ที่จริงจัง
- **AI-first tools** — GitHub Copilot, Cursor เข้ามาช่วยเขียนโค้ด
- **Edge Computing** — ประมวลผลใกล้ผู้ใช้
- **Micro-frontends** — ทีมย่อยปล่อยฟีเจอร์แยกกัน

## 4. Backend ยอดนิยม
| ภาษา/Framework | จุดเด่น |
|---|---|
| Node.js + Express | JavaScript ครบวงจร, ecosystem ใหญ่ |
| Python + FastAPI/Django | AI/ML, ประมวลผลข้อมูล |
| .NET 8+ | Enterprise, performance |
| Go | High concurrency |
| Java | Enterprise-grade |

## 5. Database ในปี 2026
| ประเภท | ตัวอย่าง | ใช้เมื่อ |
|---|---|---|
| Relational | PostgreSQL | ข้อมูลมีความสัมพันธ์, ACID |
| NoSQL | MongoDB | Flexible schema |
| Serverless | Supabase, DynamoDB | Deploy เร็ว, ค่าดูแลต่ำ |
| **Vector DB** | Pinecone, Qdrant, Weaviate | AI, Semantic Search, LLM |

> 💡 **Vector Database** = จัดเก็บ embeddings, ทำ Semantic Search, รองรับ LLM

## 6. หลักการเลือก Tech Stack (5 ปัจจัย)
1. **Team Expertise** — ปัจจัยสำคัญที่สุด ใช้ที่ทีมถนัด
2. **Project Requirements** — SEO → Next.js, NoSQL → MongoDB, Relational → PostgreSQL
3. **Don't Over-Engineer** — เริ่มง่ายๆ ก่อน เพิ่มความซับซ้อนเมื่อจำเป็น
4. **Scalability & Community** — เลือก proven tech ที่มี community ใหญ่
5. **Timeline & Budget** — Next.js + Vercel/Supabase deploy เร็ว ค่าดูแลต่ำ

## 7. Full Stack Roadmap 7 เดือน (BorntoDev)
| เดือน | เนื้อหา |
|---|---|
| 1-2 | HTML, CSS, JavaScript Core, DOM, Responsive Design |
| 3-5 | React + TypeScript (Frontend), Node.js + Express (Backend), PostgreSQL + MongoDB |
| 6-7 | Full Stack Project, CI/CD, Docker, Cloud Deployment |

## 8. DevOps Essentials 2026
- **CI/CD**: GitHub Actions
- **Containerization**: Docker → Kubernetes
- **IaC**: Terraform
- **Monitoring**: Logs + Metrics + Preview deployments

## 9. ทักษะ AI ที่ Full Stack Developer ควรมี (2026)
- ใช้ GitHub Copilot / Cursor ช่วยเขียนโค้ด
- เข้าใจ Vector Database และ Semantic Search
- ออกแบบระบบที่เชื่อมต่อ LLM APIs ได้
> AI ไม่ได้มาแย่งงาน แต่ทำให้คนที่ "รู้จริง" ทำงานทรงพลังขึ้น

## 10. Relevance กับ QSMS Project
| QSMS ใช้ | เทียบกับ Trend 2026 |
|---|---|
| Next.js + React | ✅ Modern Web Stack มาตรฐาน |
| TypeScript | ✅ ต้องใช้ทุก stack จริงจัง |
| Tailwind CSS | ✅ Styling standard |
| Google Sheets | ⚠️ Non-standard (แทน PostgreSQL) — เหมาะสำหรับ small-scale |
| GAS as Backend | ⚠️ Serverless approach — ประหยัดค่าใช้จ่าย แต่ limited |
| No Vector DB | ℹ️ ไม่จำเป็นตอนนี้ — หาก integrate AI ในอนาคตควรพิจารณา |

## 11. Modern Full-Stack LMS Tech Stack (NotebookLM 2026 Ingestion)
ถอดรหัสคู่มือการพัฒนา Full-Stack Web Application (เช่น ระบบ LMS) เพื่อทดแทน WordPress ด้วยเทคโนโลยีปี 2026 ที่เน้นความเร็ว ความคุ้มค่า และ Type-safety 100% ตั้งแต่หน้าบ้านถึงหลังบ้าน:
- **Core Framework**: **Next.js (App Router) + React 19** ดึงข้อมูลตรงผ่าน React Server Components และควบคุมหลังบ้านด้วย Server Actions
- **Database & ORM**: **Drizzle ORM + MySQL** ทางเลือกที่เบาและเร็วกว่า Prisma ทำงานแบบ TypeScript-first และคิวรีได้เร็วบน Serverless/Edge
- **E2E Type Safety**: **TypeScript + Zod** ใช้ Validate ข้อมูลทุกเลเยอร์เพื่อลดบั๊กบน Production ได้ถึง 99%
- **Auth & Security**: **NextAuth v5** ทำงานร่วมกับ Edge Middleware และ Drizzle เชื่อมต่อ Google/GitHub ได้รวดเร็ว
- **Styling**: **Tailwind CSS v4** รันไว คอมไพล์เร็ว ไร้การกำหนดคอนฟิกที่วุ่นวาย
- **Testing**: **Vitest + Playwright** (Vitest ทำ Unit/Integration test ได้ไวกว่า Jest และ Playwright คลุม E2E ผู้ใช้จริง)
- **Modern Tooling**:
  - *Tiptap*: Headless Rich Text Editor สำหรับการทำ content management
  - *dnd kit*: ระบบ Drag-and-drop สำหรับจัดการลำดับอย่างลื่นไหล
  - *Stripe*: Payment Gateway ยอดนิยม
  - *Resend*: บริการส่งอีเมลผ่าน Next.js ที่รวดเร็ว

## 12. Knowledge Relationships
- **Impacted By**: [[nextjs-frontend/nextjs.md]] — QSMS ใช้ Next.js ตาม trend
- **Impacted By**: [[gas-backend/gas-api.md]] — GAS แทน conventional backend (trade-off)
- **Depends On**: [[architecture/llm-wiki-pattern.md]] — Wiki นี้ใช้ LLM Wiki pattern
- **Connected To**: [[lessons-learned/ui-libraries-resource.md]] — การเปรียบเทียบไลบรารีและแนวทาง UI/UX

> 🔄 *อัปเดตเมื่อ 2026-05-26*: Ingested ข้อมูลเพิ่มเติมจาก `1_raw/Tech Stack 2026/Note Taking & Research Assistant Powered by AI.md` (NotebookLM Summary)
