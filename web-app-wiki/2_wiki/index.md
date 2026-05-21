# 🎯 Project Knowledge Index — QSMS Rework Management
> อ่านไฟล์นี้ก่อนเสมอ ก่อนเริ่มงานทุกครั้ง

---

## ⚠️ Active Conflicts
_ไม่มีปัญหาค้างคาในขณะนี้_

> 📥 **Ingested**: `1_raw/` + `archive_docs/` + `llm-wiki/` + `tech stack/` + `Mantine/` + `Next.js/` + `Prisma/` + `VoltAgent/` + `Kodezi Chronos/` + `debugger.md/` + `How to Debug Your Code/` — สังเคราะห์แล้วเมื่อ 2026-05-21

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

## 🧩 Architecture & Patterns
- [Design System](nextjs-frontend/design-system.md) - มาตรฐาน Minimal Monochrome (Apple Pro Style)
- [LLM Wiki Pattern](architecture/llm-wiki-pattern.md) - Karpathy Method: Raw → Wiki → Schema
- [Tech Stack 2026](architecture/tech-stack-2026.md) - Next.js+React standard, T3, MERN, Vector DB, Roadmap 7เดือน

## 🧩 Frontend & Components
- [Auth Flow](nextjs-frontend/auth-flow.md) - PIN login → Supabase/GAS → JWT → sessionStorage
- [Portal Shell](nextjs-frontend/portal-shell.md) - Hub กลางพร้อม Live Previews สำหรับทุกโมดูล
- [Rework Module](nextjs-frontend/rework-module.md) - ReworkApp.tsx, Overall, AddCase, Dashboard tabs
- [Roster Module](nextjs-frontend/roster-module.md) - ระบบตารางเวร, Supabase Backend
- [Role & Permissions](nextjs-frontend/roles.md) - UserRole enum, ROLE_PERMISSIONS map
- [shadcn/ui System](nextjs-frontend/shadcn-ui.md) - UI Components และมาตรฐานการดีไซน์
- [Refactoring History](nextjs-frontend/refactoring-history.md) - Component split, Case ID fix, Validation, Logger

## 📋 Lessons Learned & Fixes
- [Bug & Fix History](lessons-learned/bugs-and-fixes.md) - BUG-001 ถึง BUG-007 (Rework Syncing, Timezones, & Images)
- [JS Learning Resources](lessons-learned/js-projects-resource.md) - 100 JavaScript Projects
- [UI Library Research](lessons-learned/ui-libraries-resource.md) - Mantine UI & Next.js Overview
- [Systematic Debugging](lessons-learned/debugging-practices.md) - ระบบดีบั๊กเชิงรุกสไตล์ Chronos & Subagent Specs & Hooks rules

---

> 🔄 *สังเคราะห์ข้อมูลล่าสุดเมื่อ 2026-05-21* — ระบบ wiki อัปเดตโดย AI Agent ตามโปรโตคอล AGENTS.md
