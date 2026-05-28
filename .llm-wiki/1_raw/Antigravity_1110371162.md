# QSMS Rework Project Context

## Current State (2026-05-20) — Compile v2 Complete

### Wiki Status
- ✅ `brain/web-app-wiki/2_wiki/system-architecture.md` — **สร้างใหม่**: Knowledge Graph connector พร้อม Mermaid diagram
- ✅ `brain/web-app-wiki/2_wiki/index.md` — **อัปเดต**: ลิงก์ `system-architecture.md` เป็น Start Here
- ✅ `brain/web-app-wiki/2_wiki/log.md` — **อัปเดต**: บันทึก Compile v2
- ✅ `brain/web-app-wiki/2_wiki/project-history.md` — **Archive**: ประวัติงานทั้งหมดจาก Antigravity.md

### Architecture Overview (ล่าสุด)
- **Stack**: Next.js (App Router) + TypeScript + Tailwind v4
- **Portal Shell**: `App.tsx` → `WorkspacePortal` → [rework | roster]
- **API Proxies**: `/api/rework` (env: `GAS_WEB_APP_URL`) | `/api/roster` (env: `GAS_CALENDAR_WEB_APP_URL`)
- **Backends**: `gas/Code.gs` (Rework) | `gas/gas_calendar.gs` (Roster)
- **Storage**: Google Sheets — แยกกันระหว่าง Rework และ Roster อย่างสมบูรณ์

### Active Conflicts (ต้องติดตาม)
- `[OPEN]` WFG/OPERATOR alias — ตรวจสอบใน `gas_calendar.gs` ด้วย
- `[OPEN]` Base64 image payload size limit
- `[OPEN]` GAS deployment sync (ต้อง redeploy เป็น New Version ทุกครั้งที่แก้ gas)
