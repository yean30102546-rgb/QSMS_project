# QSMS Rework Management System - Project Context

## Project Overview
Digital system for tracking and managing product reworks, integrated with Google Sheets and LINE LIFF.

## Key Accomplishments (2026-05-11)
- **Restored Build Integrity**: Fixed missing `Trash2` import in `UpdateModal.tsx` and type mismatches in `ExportTemplate.tsx`.
- **Relaxed Validation**: Updated `validation.ts`, `App.tsx`, and `Code.gs` to allow special characters (`.`, `-`, `_`, `/`, space) in Item Numbers and Batch Numbers.
- **Fixed Delete Workflow**: Ensured `UpdateModal` closes after successful deletion and added a loading state to the confirmation button.
- **Improved Export Reports**:
    - Synced `ExportTemplate` in `UpdateModal` with live edited state (Items, Resolution, Cost).
    - Removed signatures as requested.
    - Enhanced Thai localization and professional enterprise styling.
- **Localized UI**: Updated `AddCaseTab` and `OverallTab` labels to Thai for a more user-friendly experience.

## Technical Context
- **Frontend**: React + Tailwind + Motion
- **Backend**: Google Apps Script (GAS)
- **Export Engine**: html2canvas + jsPDF
- **Image Handling**: Custom `DriveImage` component with CORS-friendly URL conversion.

## Rules & Standards
- Follow `.Agent/Bug-Agent.md` and `.Agent/Bug-Skill.md` for debugging.
- All reports must be Thai-friendly.
- Width constraint for export templates is 1000px.
