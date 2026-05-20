# 🎯 Project Knowledge Index — QSMS Rework Management
> อ่านไฟล์นี้ก่อนเสมอ ก่อนเริ่มงานทุกครั้ง

---

## ⚠️ Active Conflicts
_ไม่มีปัญหาค้างคาในขณะนี้_

> 📥 **Ingested**: `1_raw/` + `archive_docs/` + `1_raw/llm-wiki/` + `1_raw/tech stack/` — สังเคราะห์แล้วเมื่อ 2026-05-21

---

## 🏗️ Tech Stack & Architecture
- [Next.js Config](nextjs-frontend/nextjs.md) - App Router, API Routes proxy, port 3000
- [GAS Backend](gas-backend/gas-api.md) - doPost actions, Auth Token, Sheet operations
- [Google Sheets Schema](google-sheets/schema.md) - โครงสร้างชีตและคอลัมน์ทั้งหมด
- [Auth System](nextjs-frontend/auth-flow.md) - PIN login → GAS → JWT → sessionStorage

## 🧩 Architecture & Patterns
- [LLM Wiki Pattern](architecture/llm-wiki-pattern.md) - Karpathy Method: Raw → Wiki → Schema, Ingest/Query/Lint
- [Tech Stack 2026](architecture/tech-stack-2026.md) - Next.js+React standard, T3, MERN, Vector DB, Roadmap 7เดือน

## 🧩 Frontend & Components
- [Auth Flow](nextjs-frontend/auth-flow.md) - Login.tsx → auth.ts → /api/rework → GAS
- [Rework Module](nextjs-frontend/rework-module.md) - ReworkApp.tsx, Overall, AddCase, Dashboard tabs
- [Roster Module](nextjs-frontend/roster-module.md) - ระบบตารางเวร, GAS Calendar backend
- [Role & Permissions](nextjs-frontend/roles.md) - UserRole enum, ROLE_PERMISSIONS map
- [Refactoring History](nextjs-frontend/refactoring-history.md) - Component split, Case ID fix, Validation, Logger

## 📋 Lessons Learned & Fixes
- [Bug & Fix History](lessons-learned/bugs-and-fixes.md) - BUG-001 ItemMaster, BUG-002 Image Upload, BUG-003 CORS
- [Auth Migration](nextjs-frontend/auth-flow.md#lessons) - ย้ายจาก local PIN → GAS-issued JWT

---

> 🔄 *สร้าง Index เริ่มต้นเมื่อ 2026-05-21* — ระบบ wiki เริ่มต้นโดย AI Agent
