# QSMS Rework Management System - Project Context

## Overview
React + Tailwind + Google Apps Script (GAS) app for product rework tracking via LINE LIFF.

## Core Features & Business Logic (Current)
- **Decentralized Customer Selection**: `customerName` is tracked per **Item** (not per Case).
- **OR Customer Workflow**: 
  - If **ALL items** in a case belong to "OR", the system allows attaching OR-specific documents (Excel, PDF, PNG).
  - This attachment is **Optional at creation** (can save without files). 
  - If no files are attached for an all-OR case, the dashboard shows a "ขาดไฟล์ OR" warning. Users can attach them later via `UpdateModal`.
- **Exports**: `html2canvas` + `jsPDF` (constrained to 1000px width). Thai localization.
- **Images**: Custom `DriveImage` component for CORS-friendly URL conversion from Google Drive.

## Historical Fixes (Archived Context)
- Fixed build/export issues (missing imports, signature removal, live template syncing).
- Relaxed validation for Item/Batch Numbers (allows `. - _ /` and space).
- Solved GAS ID mismatches and duplicate file uploads by generating stable Item IDs and handling file uploads at the Case level.

## Latest Session: Workflow Fix, Column Reordering & Header Recovery (2026-05-13)
- **Header Recovery & Styling**: Fixed issue where Excel headers disappeared or lost formatting. Added `applyHeaderFormatting` to enforce consistent black-on-white, bold, frozen headers.
- **Critical Bug Fixes**:
  - Fixed OR file mapping in `handleUpdate` (Case ID lookup fix).
  - Prevented Status Downgrades (Completed cases no longer revert to Awaiting Valuation when edited).
  - Replaced all hardcoded indices with `COL_` constants.
- **Status Workflow Fix**: Resolved issue where status didn't update automatically. Now frontend explicitly calculates target status (Pending -> In-Progress -> Awaiting Valuation -> Completed) based on actions.
- **Column Reordering**: Moved `Timestamp` and `Status` to columns 0 and 1.
- **Migration Script**: Added `standardizeSheetStructure()` in GAS to reorder existing data safely.
- **Data Model Sync & Item Deletion (Current)**:
  - Fixed `linkedSourceId` (Cross-item link) not persisting in backend updates.
  - Implemented Item-level deletion in `handleUpdate` via backward iteration.
  - Restored missing `createStableReadItemId` helper in GAS.
  - Standardized all column access to use global constants, preventing schema shift errors.

## Rules & Standards
- Follow `.Agent/Bug-Agent.md` and `.Agent/Bug-Skill.md` for debugging.
- All reports must be Thai-friendly.
