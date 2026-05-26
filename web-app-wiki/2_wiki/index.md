# 🎯 Project Knowledge Index — QSMS Rework Management
> อ่านไฟล์นี้ก่อนเสมอ ก่อนเริ่มงานทุกครั้ง

---

## ⚠️ Active Conflicts
_ไม่มีปัญหาค้างคาในขณะนี้_

> 📥 **Ingested**: `1_raw/` + `archive_docs/` + `llm-wiki/` + `tech stack/` + `Mantine/` + `Next.js/` + `Prisma/` + `VoltAgent/` + `Kodezi Chronos/` + `debugger.md/` + `How to Debug Your Code/` + `7 Key UI Design Principles.../` + `10 UX/` + `การออกแบบ UX/` + `Next.js คืออะไร.../` + `NotebookLM Tech Stack 2026/` + `SESSION_KNOWLEDGE/` — สังเคราะห์แล้วเมื่อ 2026-05-26

---

## 🏗️ Tech Stack & Architecture
- [System Architecture](architecture/system-architecture.md) - **Start Here**: สถาปัตยกรรมองค์รวม Next.js + Supabase + Drive
- [Supabase Hybrid Migration](architecture/supabase-hybrid-migration.md) - แผนการย้ายข้อมูลและโมเดล Hybrid Storage
- [Prisma ORM](architecture/prisma-orm.md) - ระบบจัดการฐานข้อมูลแบบ Type-safe สำหรับ Supabase
- [Project History](architecture/project-history.md) - ประวัติการพัฒนาและ Milestone สำคัญ
- [Knowledge Synthesis](architecture/knowledge-synthesis.md) - สรุปความเชื่อมโยงและแนวทางการพัฒนาองค์รวม
- [Next.js Config](nextjs-frontend/nextjs.md) - App Router, API Routes proxy, port 3000
- [GAS Backend](gas-backend/gas-api.md) - doPost actions, Auth Token, Sheet operations
- [Google Sheets Schema](google-sheets/schema.md) - โครงสร้างชีตและคอลัมน์ทั้งหมด
- [CORS & CSP Configurations](architecture/cors-csp-setup.md) - การจัดการนโยบายความปลอดภัยและปัญหา CORS ข้ามโดเมนของ Google Apps Script
- [Deployment Guide](architecture/deployment.md) - ขั้นตอนการ Deploy ทั้งระบบ Google Apps Script, Google Sheets, และ Next.js
- [Serverless Multimodal RAG](architecture/multimodal-rag.md) - สถาปัตยกรรมการทำ RAG ค้นหาข้อมูลสเปก PDF และ Excel บนคลาวด์ร่วมกับ Supabase pgvector

## 🧩 Architecture & Patterns
- [Design System](nextjs-frontend/design-system.md) - มาตรฐาน Minimal Monochrome (Apple Pro Style)
- [UI/UX Design Principles](nextjs-frontend/ui-ux-principles.md) - Figma UI principles, BIZIDEA guidelines, and portfolio inspiration patterns
- [LLM Wiki Pattern](architecture/llm-wiki-pattern.md) - Karpathy Method: Raw → Wiki → Schema
- [Tech Stack 2026](architecture/tech-stack-2026.md) - Next.js+React standard, T3, MERN, Vector DB, Roadmap 7เดือน

## 🧩 Frontend & Components
- [Auth Flow](nextjs-frontend/auth-flow.md) - PIN login → Supabase/GAS → JWT → sessionStorage
- [Portal Shell](nextjs-frontend/portal-shell.md) - Landing Page (Guest Mode) พร้อมข้อมูลจริงล่าสุด (Live Preview) และ Auto-redirect
- [Rework Module](nextjs-frontend/rework-module.md) - ReworkApp.tsx, Overall, AddCase, Dashboard tabs
- [Roster Module](nextjs-frontend/roster-module.md) - ระบบตารางเวร, Supabase Backend
- [Role & Permissions](nextjs-frontend/roles.md) - UserRole enum, ROLE_PERMISSIONS map
- [shadcn/ui System](nextjs-frontend/shadcn-ui.md) - UI Components และมาตรฐานการดีไซน์
- [Refactoring History](nextjs-frontend/refactoring-history.md) - Component split, Case ID fix, Validation, Logger
- [Image Upload & Compression](nextjs-frontend/image-upload-system.md) - การบีบอัดรูปภาพฝั่ง Client และการอัปโหลดผ่าน Base64 ไปยัง Google Drive
- [Testing Pipeline](nextjs-frontend/testing-pipeline.md) - โครงสร้างและคำสั่งรันทดสอบของ Vitest และ Playwright
- [Testsprite Testing](nextjs-frontend/testsprite-testing.md) - รายละเอียดแผนการทดสอบอัตโนมัติ (RBAC & Multi-item Flow) ด้วย Playwright Python

## 🤖 Agent Frameworks
- [Deep Agents](agent-frameworks/deepagents.md) - โครงสร้าง Python SDK/CLI, LangGraph, agent memory, acp และ test commands ในการพัฒนาเอเจนต์
- [Harness Skills](agent-frameworks/harness-skills.md) - ระบบจัดการและตั้งค่าทักษะเอเจนต์เพื่อรันและดีบั๊กเวิร์กโฟลว์ CI/CD ร่วมกับ Harness MCP server

## 🧠 AI, ML & Data Utilities
- [Chroma Vector Database](ai-ml-utilities/vector-search-chroma.md) - ระบบโครงสร้างพื้นฐานจัดเก็บเวกเตอร์สำหรับการค้นหาแบบ Semantic Search และ API การคิวรี
- [PyThaiNLP](ai-ml-utilities/thai-nlp-pythainlp.md) - ระบบประมวลผลคำภาษาไทย ตัดประโยค ตรวจแก้คำสะกด และยูทิลิตี้อย่างบาทเท็กซ์/วันที่ไทย
- [Hugging Face Transformers](ai-ml-utilities/deep-learning-transformers.md) - การเรียกใช้งานโมเดล Deep Learning (Text, Vision, Audio, Multimodal) ผ่าน Pipeline API
- [Image Processing (CLIP & Pillow)](ai-ml-utilities/image-processing-clip-pillow.md) - การจัดการรูปภาพ ย่อขนาด แปลงสี และการทำ Zero-shot Image Classification ด้วย CLIP
- [PyMuPDF & PyMuPDF4LLM](ai-ml-utilities/document-processing-pymupdf.md) - การดึงข้อมูลเอกสาร PDF/Office แบบความเร็วสูง แปลงเป็น Markdown สำหรับ LLM/RAG
- [Gradio Web UI Builder](ai-ml-utilities/gradio-ui.md) - การสร้างและแชร์หน้าเว็บสำหรับทดสอบโมเดล AI และคำสั่งฟังก์ชัน Python แบบด่วน

## 📋 Lessons Learned & Fixes
- [Bug & Fix History](lessons-learned/bugs-and-fixes.md) - BUG-001 ถึง BUG-010 (Rework Syncing, Timezones, Progress Bar, & Apple Logout Overlay Redesign)
- [Server Auth & Partial Updates](lessons-learned/server-auth-and-partial-updates.md) - server-side JWT verification และการ merge partial update เพื่อกันข้อมูล valuation หาย
- [JS Learning Resources](lessons-learned/js-projects-resource.md) - 100 JavaScript Projects
- [UI Library Research](lessons-learned/ui-libraries-resource.md) - Mantine UI & Next.js Overview
- [Systematic Debugging](lessons-learned/debugging-practices.md) - ระบบดีบั๊กเชิงรุกสไตล์ Chronos & Subagent Specs & Hooks rules
- [RBAC Enum Casing & Playwright Locators](lessons-learned/rbac-casing-and-e2e.md) - การแก้ปัญหา UserRole Uppercase Enum และการเปลี่ยน XPath เป็น Semantic Locators ใน Playwright
- [Item Master Upsert & Auto Fill Sync Flow](lessons-learned/item-master-upsert-flow.md) - การจัดการ Auto Fill แบบ Debounce 600ms, การเช็ค Conflict และ Complete Item Protection
- [Session Knowledge 2026-05-25](SESSION_KNOWLEDGE_2026_05_25.md) - การปรับปรุง UX เรียงลำดับตามความเร่งด่วน, ระบบ Remember Me, และการแสดงผล Explicit Date
- [Box Number & JWT E2E Test Fix](lessons-learned/box-number-binding-and-jwt-e2e.md) - การแก้ปัญหาการผูกช่องเลขกล่องไม่ตรงกับ State และการปรับ E2E Test ด้วย Mock JWT และลำดับตรวจสอบ

---

> 🔄 *สังเคราะห์ข้อมูลล่าสุดเมื่อ 2026-05-26* — ระบบ wiki อัปเดตโดย AI Agent ตามโปรโตคอล AGENTS.md
