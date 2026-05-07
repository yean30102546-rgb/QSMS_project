# Antigravity.md — Project Context

## Project: QSMS Rework Management System
**Last Updated:** 2026-05-07

## Architecture
- **Frontend:** React + Tailwind CSS (Vite dev server)
- **Backend:** Google Apps Script (GAS)
- **Database:** Google Sheets
- **Storage:** Google Drive (per-case folders)

## Key Files
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app, state management, API bridge |
| `src/components/OverallTab.tsx` | รายการ Rework + Filters (ใช้ sub-components) |
| `src/components/CaseListTable.tsx` | ตารางรายการ + Skeleton/Empty/Error states |
| `src/components/Pagination.tsx` | ส่วนเลือกหน้า (reusable) |
| `src/components/Tooltip.tsx` | คำอธิบายเมื่อ hover (เพื่อผู้ใช้ใหม่) |
| `src/components/ToastContainer.tsx` | Toast notification UI |
| `src/hooks/useToast.ts` | Hook จัดการ toast state |
| `src/hooks/useImageCompression.ts` | Hook บีบอัดรูปภาพด้วย browser-image-compression |
| `src/components/Dashboard.tsx` | สถิติ/กราฟ + Interactive Filters |
| `src/components/DashboardTab.tsx` | Wrapper สำหรับ Dashboard |
| `src/components/Login.tsx` | Login ด้วย Password (ไม่ใช่ PIN) |
| `src/components/AddCaseTab.tsx` | ฟอร์มเพิ่มงาน Rework |
| `src/services/auth.ts` | Authentication service (loginWithPassword) |
| `src/services/api.ts` | API bridge ไปยัง GAS |
| `src/components/ExportTemplate.tsx` | Ghost template สำหรับ Export รายงาน (PNG/PDF) |
| `src/hooks/useExportReport.ts` | Hook จัดการ Export PNG (Long Image) และ PDF (Multi-page) |
| `gas/Code.gs` | Backend ทั้งหมด (Auth, CRUD, Drive) |
| `src/components/TutorialModal.tsx` | ระบบคู่มือการใช้งานแบบ Modal ภายในแอป |
| `artifacts/user_guide.md` | คู่มือการใช้งานฉบับสมบูรณ์ (Markdown) |

## Authentication (Password-based)
- Login ใช้ `loginWithPassword()` ส่ง `password` (ไม่จำกัดรูปแบบ/ความยาว)
- GAS ใช้ Script Properties: `QSMS_PASSWORD`, `WFG_PASSWORD`
- Backend function: `handlePasswordLogin()`

## Recent Changes (2026-05-06)
1. **OverallTab Filters** — Quick Status Pills + Advanced Filter Panel (Source, Reason, Responsible, Date Range) + Active Filter Tags
2. **Dashboard Filters** — Status Pills + Reason chips + Date Range, reactive charts
3. **Fixed Pagination** — ใช้ flex-grow ให้ Pagination ตรึงล่างเสมอ
4. **No Auto Scroll** — OverallTab ได้ full-height ตรงจาก MainLayout
5. **Skeleton Screen** — แสดง 10 แถว placeholder ระหว่างโหลด
6. **PIN → Password Migration** — Login.tsx, auth.ts, Code.gs ทั้งหมดเปลี่ยนแล้ว
7. **Validation Warning** — เพิ่มการแจ้งเตือน "กรุณาเลือกแผนก SFC" และ "กรุณาเลือก Supplier"
8. **New Item Logic & Notification** — Modal กรอกชื่อ New Item ทันที, บันทึกลง Master ตอนกด Save Case
9. **Update Logo** — ใช้ `/img/logo.png` แทนโลโก้ Text เก่า
10. **Anti-Scroll & Stable Layout** — ลบ double-scroll wrapper, ใช้ flex-grow ดัน Pagination
11. **Refactor & Friendly UI** — แยก CaseListTable, Pagination, Tooltip, ToastContainer ออกจาก OverallTab + สร้าง useImageCompression hook + useToast hook + ปรับ Empty State เป็นภาษาไทย + เพิ่ม Tooltip บนปุ่ม icon
12. **UpdateModal Image Gallery** — เพิ่มส่วนแสดงรูปภาพแนบในหน้าต่าง UpdateModal แบ่งตาม Item (Item 1, Item 2...) พร้อม Lightbox ดูรูปเต็มจอ + ลิงก์ไปยัง Google Drive + fallback เมื่อโหลดรูปไม่ได้
13. **Bangkok Timezone Fix** — แก้ทุกฟังก์ชัน date/time (formatThaiDate, formatTimestamp, formatDateThai, generateCaseId) ให้ lock เป็น `Asia/Bangkok` เสมอ ทั้งใน helpers.ts และ CaseListTable.tsx
14. **Image URL Fix (GAS)** — แก้ `uploadImageToDrive` ให้ return URL + setSharing public, `handleInsert` เก็บ URL แต่ละรูปแยก item (pipe-separated ในคอลัมน์ 15, folder URL ในคอลัมน์ 16), `handleReadAll` แยก imageUrls[] กลับเป็น array
15. **Export Report (PNG/PDF)** — เพิ่มปุ่ม Export PNG (Long Image) และ Export PDF (Multi-page A4) ใน UpdateModal + สร้าง Ghost ExportTemplate ที่มี Header/Footer บริษัท + ใช้ html2canvas + jsPDF + Image Preload Sync + Loading Overlay แสดงสถานะการ Export
16. **Tutorial System** — สร้าง `TutorialModal.tsx` และเพิ่มปุ่ม "คู่มือการใช้งาน" ใน Sidebar เพื่อให้ผู้ใช้เข้าถึงคำแนะนำการใช้งานฟังก์ชันต่างๆ ได้ทันที พร้อมสร้างไฟล์ `user_guide.md` เป็นเอกสารอ้างอิงหลัก

## GAS Script Properties Required
```
AUTH_TOKEN_SECRET, QSMS_PASSWORD, QSMS_EMAIL, QSMS_NAME, QSMS_ROLE,
WFG_PASSWORD, WFG_EMAIL, WFG_NAME, WFG_ROLE, DRIVE_FOLDER_ID
```

## Environment
- `.env` → `REACT_APP_GAS_WEB_APP_URL` ต้องตรงกับ GAS deployment ID
- ทุกครั้งที่แก้ `Code.gs` ต้อง Deploy version ใหม่ใน GAS IDE

