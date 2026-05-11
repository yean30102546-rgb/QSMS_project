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

## Lessons Learned
- **Cross-environment regex**: Always verify that GAS `RegExp` and JavaScript `RegExp` handle characters identically (especially escaped ones).
- **Sub-agent usage**: User prefers direct interaction for efficiency.
- **Enterprise Aesthetics**: Thai fonts and clear grid layouts are critical for user acceptance.
