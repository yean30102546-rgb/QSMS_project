# Learning Log & Bug Tracker

## Solved Issues

### 1. Build Error: Missing Icons
- **Bug**: `Trash2` was imported but not installed or correctly referenced in `lucide-react`.
- **Fix**: Replaced with compatible icons and verified `lucide-react` version.

### 2. Validation Rigidity
- **Bug**: Alphanumeric-only regex prevented valid inputs like `24.05.10` or `ITEM-01`.
- **Fix**: Updated regex to `[a-zA-Z0-9.\-_/ ]+` across frontend and backend. Always coordinate regex changes between `validation.ts` and `Code.gs`.

### 3. Delete Modal UX
- **Bug**: Clicking "Confirm Delete" closed the confirmation sub-modal but left the main `UpdateModal` open with stale data.
- **Fix**: Added `onClose()` call to `confirmDelete` success branch.

### 4. Stale Export Data
- **Bug**: `ExportTemplate` in `UpdateModal` was bound to `caseData` (initial load) instead of `editedItems` (live edits).
- **Fix**: Updated `ExportTemplate` props to use reactive local state.

### 5. File Naming/Type Issue
- **Bug**: Exported files sometimes didn't have correct extensions or were named generically.
- **Fix**: Explicitly set `fileName` with `.pdf`/`.png` extensions in `useExportReport` hook and ensured `ExportTemplate` container has unique ID.

### 6. Disappearing Headers
- **Bug**: Excel headers disappeared or lost formatting after GAS updates because `initializeSheet` used outdated headers and `getOrCreateSheet` didn't re-apply formatting.
- **Fix**: Centralized header application in `applyHeaderFormatting` and synced all initialization logic with `MAIN_HEADERS`.

### 7. Item Deletion Not Persisting
- **Bug**: Deleting an item in `UpdateModal` removed it from the frontend but it remained in the Google Sheet because `handleUpdate` only updated existing rows.
- **Fix**: Re-implemented `handleUpdate` loop to iterate backwards and delete rows whose `itemId` is missing from the update payload (Admin only).

### 8. Read Operation Failing (Missing Helper)
- **Bug**: `handleReadAll` failed with "createStableReadItemId is not defined".
- **Fix**: Restored the missing `createStableReadItemId` function in `Code.gs`.

### 9. Linked Source ID Not Updating
- **Bug**: Changes to `linkedSourceId` in the frontend weren't saved to the sheet.
- **Fix**: Added `linkedSourceId` update logic to the Administrative Edit section of `handleUpdate`.

## Lessons Learned
- **Cross-environment regex**: Always verify that GAS `RegExp` and JavaScript `RegExp` handle characters identically (especially escaped ones).
- **Enterprise Aesthetics**: Thai fonts and clear grid layouts are critical for user acceptance.
- **GAS File Uploads**: When sending multiple files (like OR files) to Google Apps Script, convert them to Base64 on the client side. GAS `doPost` handles JSON payloads best when files are embedded as strings rather than multi-part form data.
- **Header-Data Sync**: เมื่อเพิ่มคอลัมน์ใหม่ให้ `handleInsert` ต้องอัปเดต `initializeSheet()` headers ด้วยเสมอ มิฉะนั้นถ้ารัน init ใหม่จะ shift data ทั้ง sheet
- **Loop Placement**: OR file upload ถูกวางใน forEach item loop ทำให้ upload ซ้ำ N ครั้ง — logic ที่ทำ per-case ต้องอยู่นอก per-item loop
- **ID Normalization**: Frontend normalize Item ID ผ่าน `createNormalizedItemId` แต่ GAS ใช้ raw ID จาก sheet → ทำให้ match ไม่เจอตอน update
- **Schema Migration Cascade**: เมื่อย้ายคอลัมน์ใน Google Sheet (เช่น Customer Name) ต้องอัปเดต **ทุกฟังก์ชัน** ที่อ้าง column index รวมถึง `handleDashboardStats`, `fixSheetDataShift` ที่มักถูกลืม เพราะไม่ได้อยู่ใน CRUD path หลัก
- **Header Integrity**: Use `applyHeaderFormatting` to ensure headers are always visible (Black BG, White Text) and frozen.
- **Status Persistence**: Always check the *current* status in the sheet before auto-transitioning in `handleUpdate` to prevent accidental downgrades (e.g., Completed -> Awaiting Valuation).
- **Column Constants**: Never use hardcoded indices like `data[j][21]`. Always use `COL_` constants to ensure reliability across schema shifts.
- **Mapping Accuracy**: Verify that Case ID lookups use `COL_CASE_ID` (index 4) not `COL_STATUS` (index 1).
- **Item Deletion Strategy**: เมื่อจัดการข้อมูลแบบ Multi-row Case การลบ row ต้องใช้ Backward loop เสมอเพื่อป้องกัน index shift
- **Utility Integrity**: ระวังการลบ function helper ที่ใช้ร่วมกัน (เช่น `createStableReadItemId`) ระหว่างการ refactor logic ใหญ่ๆ
- **Persistence Symmetry**: ทุก field ที่ส่งจาก Frontend (เช่น `linkedSourceId`) ต้องมี logic รองรับใน Backend `handleUpdate` และ `handleInsert` เสมอ