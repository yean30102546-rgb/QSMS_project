# Antigravity.md — Project Context

## Project: QSMS Rework Management System
**Last Updated:** 2026-05-05

## Architecture
- **Frontend:** React + Tailwind CSS (Vite dev server)
- **Backend:** Google Apps Script (GAS)
- **Database:** Google Sheets
- **Storage:** Google Drive (per-case folders)

## Key Files
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app, state management, API bridge |
| `src/components/OverallTab.tsx` | รายการ Rework + Filters + Pagination |
| `src/components/Dashboard.tsx` | สถิติ/กราฟ + Interactive Filters |
| `src/components/DashboardTab.tsx` | Wrapper สำหรับ Dashboard |
| `src/components/Login.tsx` | Login ด้วย Password (ไม่ใช่ PIN) |
| `src/components/AddCaseTab.tsx` | ฟอร์มเพิ่มงาน Rework |
| `src/services/auth.ts` | Authentication service (loginWithPassword) |
| `src/services/api.ts` | API bridge ไปยัง GAS |
| `gas/Code.gs` | Backend ทั้งหมด (Auth, CRUD, Drive) |

## Authentication (Password-based)
- Login ใช้ `loginWithPassword()` ส่ง `password` (ไม่จำกัดรูปแบบ/ความยาว)
- GAS ใช้ Script Properties: `QSMS_PASSWORD`, `WFG_PASSWORD`
- Backend function: `handlePasswordLogin()`

## Recent Changes (2026-05-05)
1. **OverallTab Filters** — Quick Status Pills + Advanced Filter Panel (Source, Reason, Responsible, Date Range) + Active Filter Tags
2. **Dashboard Filters** — Status Pills + Reason chips + Date Range, reactive charts
3. **Fixed Pagination** — ใช้ `min-height: 640px` ให้ Pagination ไม่กระโดด
4. **No Auto Scroll** — ลบ `layout` animation ออก, ใช้ `overflowAnchor: none`
5. **Skeleton Screen** — แสดง 10 แถว placeholder ระหว่างโหลด
6. **PIN → Password Migration** — Login.tsx, auth.ts, Code.gs ทั้งหมดเปลี่ยนแล้ว

## GAS Script Properties Required
```
AUTH_TOKEN_SECRET, QSMS_PASSWORD, QSMS_EMAIL, QSMS_NAME, QSMS_ROLE,
WFG_PASSWORD, WFG_EMAIL, WFG_NAME, WFG_ROLE, DRIVE_FOLDER_ID
```

## Environment
- `.env` → `REACT_APP_GAS_WEB_APP_URL` ต้องตรงกับ GAS deployment ID
- ทุกครั้งที่แก้ `Code.gs` ต้อง Deploy version ใหม่ใน GAS IDE
