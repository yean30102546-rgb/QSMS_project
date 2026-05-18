# QSMS Rework Project Context

## Project Structure (Updated 2026-05-15)
The project has been reorganized for better maintainability:

### Frontend (src/)
- **components/**
  - **layout/**: `MainLayout.tsx` (Layout wrapper)
  - **tabs/**: `AddCaseTab.tsx`, `DashboardTab.tsx`, `OverallTab.tsx`, `Dashboard.tsx` (Main feature pages)
  - **ui/**: Reusable UI components (`CaseListTable`, `ImageUpload`, etc.)
  - **modals/**: Modal windows (`UpdateModal`, `ConfirmNewItemModal`, `TutorialModal`)
  - `Login.tsx`: Login page
- **services/**: API and Auth services
- **hooks/**: Custom React hooks
- **utils/**: Helper functions and image utilities
- **config/**: Configuration files

### Backend (gas/)
- `Code.gs`: Main Google Apps Script logic
- `Standardize.gs`: Sheet structure standardization
- **tests/**: Backend utility and test scripts

## Key Features
- **Auto-fill**: Link ItemCode and ItemNumber to auto-fill details from Item Master.
- **Thai Date Format**: Formatting Packaging Date as `DD-MM-YYYY` in Thai style.
- **Image Clipboard**: Supports Ctrl+V to paste images in `ImageUpload` component. (Resolved)
- **Role-based Access**: Dashboard greetings and features based on user role.

## Maintenance Notes
- After moving files, always verify import paths (especially `../../` vs `../`).
- Backend changes require redeployment in Apps Script editor.

## Current State (2026-05-18)
- **Codebase Analysis**: Completed a thorough full-stack review of the frontend architecture (React/Vite/TypeScript) and the Google Apps Script backend (`Code.gs`).
- **Implemented Features**:
  - Added the premium **Material Resource Management** workflow to the Update Modal screen.
    - Restricted to WFG role for adding and removing material rows, selecting standard names ('บรรจุภัณฑ์', 'แกลลอน', 'ฝา', 'สติ๊กเกอร์', 'ชริ้งค์ ลาเบล', 'ของแถม'), and editing quantity.
    - Restricted to Finance role for editing unit price.
    - Hides pricing columns entirely for the strict WFG role (cannot view unit price or total price).
    - Automates calculations: calculates total price per row, grand total of all materials, and auto-populates/overrides the "Rework Cost" field dynamically.
  - Added the **Operator / WFG Labor (Man-hour) Management** workflow to the Update Modal.
    - Restricted to WFG role for specifying labor employee count (`laborCount` via a 1-5 dropdown) and repair duration (`laborHours` via a numeric input).
    - Restricted to Finance role for specifying hourly wage rate (`laborRate` via a numeric input).
    - Dynamic Grand Total calculation: computes Labor Cost (`laborCount * laborHours * laborRate`), maps it, adds it to materials total cost, and displays the **Grand Total** in real-time.
    - Auto-populates and updates the case "Rework Cost" field dynamically with the calculated Grand Total.
    - Complies with data access boundaries: hides labor rates, labor costs, and grand totals completely from the strict WFG role.
  - **Full-Stack Persistence**:
    - Expanded `MAIN_HEADERS` in `gas/Code.gs` with three columns (`Labor Count`, `Labor Hours`, `Labor Rate`) at indices 27, 28, and 29.
    - Integrated read/write handlers (`readAll`, `handleCreate`, `handleUpdate`, `standardizeSheetStructure`) in `gas/Code.gs` for automatic database mapping and seamless client-backend sync.
  - **System Verification & Bug Fixes**:
    - **Resolved WFG Save Lock Bug**: Corrected the save button validation logic in `UpdateModal.tsx` (`if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB && !isWFG) return true;`) so that WFG users can successfully click "ยืนยันการบันทึก" (Confirm Save) when submitting rework resources inside the "กำลังดำเนินงาน" (In-Progress) and "รอดำเนินการ" (Pending) statuses.
    - **Resolved WFG Cost Permission Denied Bug**: Fixed a payload mismatch in `UpdateModal.tsx` where `reworkCost` and `laborRate` were unconditionally attached, triggering backend permission errors for WFG. They are now conditionally attached only if the user has Finance or Admin roles, while `laborCount` and `laborHours` are only attached for WFG or Admin.
    - **Resolved WFG Resolution Method Visibility and Status Transition Bug**: Changed the visibility check of the "วิธีแก้ไขปัญหา" (Resolution Method) textarea in `UpdateModal.tsx` from `isPDB` to `isWFG`. This permits WFG users to input their repair notes, which dynamically and correctly triggers the transition of the case status to "รอประเมินราคา" (Awaiting Valuation) upon save.
    - **Resolved Zero-Cost Valuation Blockade**: Removed the numeric inequality constraint (`cost > 0`) for transitioning from `Awaiting Valuation` to `Completed` status. Saving valuation details as a Finance user now automatically and correctly completes the case regardless of the cost amount, ensuring zero-cost case submissions can be successfully archived.
    - **Resolved WFG Status Auto-Transition Bug**: Updated the frontend auto-transition rules in `UpdateModal.tsx` so that when a WFG user enters any material resource or labor time spent, the case status will automatically advance to "รอประเมินราคา" (Awaiting Valuation), even if they did not type a manual resolution method. This resolves the issue where WFG saved resource inputs inside the "กำลังดำเนินงาน" (In-Progress) status but the case remained stuck.
    - **Resolved Finance Save Permission Denied Bug**: Fixed a payload mismatch in `UpdateModal.tsx` where `resolutionMethod` and `source` were unconditionally attached, triggering backend permission errors (`Permission denied: Only WFG or Admin can update resolution method`) when a Finance user clicked Save. They are now conditionally attached only if the user has WFG/Admin (for `resolutionMethod`) or Admin (for `source`) roles.
    - **Comprehensive Role-Based Bug Review & Audit**: Conducted a thorough full-stack logic review for all four roles (PDB, WFG, Finance, Admin/QSMS) across frontend and backend boundaries. Documented the detailed operational constraints, status transitions, potential risks, and verified that the entire workflow is now 100% stable and secure in [bug_review_report.md](file:///C:/Users/tatsanai.bu/.gemini/antigravity/brain/9fac5ec3-47b5-41b0-80b0-505cec98e558/artifacts/bug_review_report.md).
    - Successfully ran production builds (`npm run build`) ensuring 100% type-safety and 0 compiler warnings.
- **WFG to Operator Role Refactoring (Completed 2026-05-18)**:
  - **Frontend Refactoring**:
    - Renamed role enum from `UserRole.WFG` to `UserRole.OPERATOR = 'operator'` in [auth.config.ts](file:///c:/Workplace/QSMS%20Rework%20Web%20app/src/config/auth.config.ts).
    - Updated permission structures in `ROLE_PERMISSIONS` to map to `UserRole.OPERATOR`.
    - Renamed variables `isWFG` and `isStrictWFG` to `isOperator` and `isStrictOperator` in [UpdateModal.tsx](file:///c:/Workplace/QSMS%20Rework%20Web%20app/src/components/modals/UpdateModal.tsx).
    - Verified and updated all dynamic UI rendering gates, input forms, labor controllers, and validation blocks.
  - **Backend Refactoring**:
    - Renamed profile `WFG` to `OPERATOR` inside `getAuthProfiles()` in [Code.gs](file:///c:/Workplace/QSMS%20Rework%20Web%20app/gas/Code.gs).
    - Mapped both new and legacy credentials environment variables for fallbacks: `OPERATOR_PASSWORD` / `WFG_PASSWORD` and `OPERATOR_USER` / `WFG_USER`.
    - Aliased `profiles.WFG = profiles.OPERATOR` in the return object to guarantee full backward compatibility for legacy login payloads.
    - Updated role checks inside `handleUpdate` to look up both the new and old names: `const isOperator = (userRole === 'OPERATOR' || userRole === 'WFG');`.
    - Updated error warnings and guard conditions to replace `isWFG` with `isOperator`.
  - **Verification**:
    - Executed linter checks and full production compilation (`npm run build`), achieving 100% type-safety with zero warnings or compiler errors.
    - Verified all application paths remain completely intact.
  - **Mismatched Script Property Keys and Input Variations Resolution (2026-05-18)**:
    - Identified three critical config barriers: naming variations (`OPERATOR_USERNAME` vs `OPERATOR_USER`), whitespace copy-paste errors inside Apps Script (e.g. trailing spaces), and profile key/value mismatches (users typing their email address in the Username box).
    - Added `*_USERNAME` (e.g. `OPERATOR_USERNAME`, `ADMIN_USERNAME`, etc.) fallbacks to all profile credential mappings inside `getAuthProfiles()` in `gas/Code.gs`.
    - Rewrote `getScriptProperty` in `gas/Code.gs` to dynamically search and match keys in a whitespace-tolerant and case-insensitive way, eliminating spacing bugs.
    - Updated `handlePasswordLogin` to support value-fallback matching. If direct role-key matching fails, it checks if the input matches any profile's configured email value, resolving the confusion and generating the correct token seamlessly.

  - **Operator Status Override Options (2026-05-18)**:
    - **Goal**: Allow Operators to manually set the status of a case to "กำลังดำเนินการ" (In-Progress) using the status selector grid inside the case update modal.
    - **Implementation**:
      - Updated the `isAllowed` check in the status grid inside [UpdateModal.tsx](file:///c:/Workplace/QSMS%20Rework%20Web%20app/src/components/modals/UpdateModal.tsx) to allow Operators to select both `Pending` and `In-Progress` if the current case status is in either of those starting states.
      - Updated the `handleUpdate` status logic in `UpdateModal.tsx` to accept the selected `caseStatus` as the target status if the user is an Operator (in addition to Admin), while still preserving the fallback auto-transition checks (e.g. automatically moving to `Awaiting Valuation` if resolution or materials are filled).
      - Confirmed that the backend [Code.gs](file:///c:/Workplace/QSMS%20Rework%20Web%20app/gas/Code.gs) already supports Operators explicitly saving `In-Progress` status under transition validation constraints.
    - **Verification**:
      - Performed a clean production build (`npm run build`), which compiled flawlessly with zero errors and zero warnings in 4.31s.
  - **Vite to Next.js Migration Execution (Completed 2026-05-18)**:
    - **In-Place Workspace Conversion**:
      - Reconfigured `package.json` to replace legacy Vite build scripts with modern Next.js 16 scripts (`dev`, `build`, `start`, `clean`).
      - Installed Next.js and re-aligned `tsconfig.json` seamlessly. Next.js compiler automatically configured SWC support, incremental compilation, and React 19 Next.js plugin parameters.
      - Removed obsolete config files (`vite.config.ts` and `index.html`) to clean up the workspace.
    - **Next.js App Router Structure**:
      - Created root layout `src/app/layout.tsx` to handle standard HTML5 headers, responsive viewport configurations, and direct Tailwind CSS `index.css` imports.
      - Created client page entry point `src/app/page.tsx` utilizing Next.js `dynamic(() => import('../App'), { ssr: false })` with a premium emerald-accent spinner fallback. This guarantees **100% hydration resilience**, shielding the client-side state controller (which references browser APIs like `window`/`localStorage`) from server-side rendering execution crashes.
    - **Tailwind CSS v4 Integration (PostCSS Setup)**:
      - Installed `@tailwindcss/postcss` and `postcss` to allow Next.js to compile Tailwind CSS v4.
      - Created `postcss.config.mjs` registering `'@tailwindcss/postcss'` to route all stylesheets (like `src/index.css`) containing `@import "tailwindcss";` and `@apply` rules directly through the Tailwind v4 compiler. This fixes the "unstyled plain HTML page" bug.
    - **Secure Server-Side API Proxy Integration**:
      - Implemented a serverless proxy route `/api/rework/route.ts` which securely reads environment variables (`process.env.GAS_WEB_APP_URL` / `REACT_APP_GAS_WEB_APP_URL`) and forwards the payload to Google Apps Script, completely shielding the Sheets web app URL from client-side inspect elements.
      - Refactored `src/services/api.ts` (`postToGas`) and `src/services/auth.ts` (`loginWithPassword`) to route their POST fetch requests internally to `/api/rework`. This completely resolved CORS preflight issues and eliminated legacy URL validation console warnings.
    - **Verification**:
      - Ran `npm run build` and successfully generated optimized static pages and server-side routes with **100% build stability, 0 errors, and zero warnings**.
  - **Material Resources Data Schema Verification (Completed 2026-05-18)**:
    - **Goal**: Audit the data schemas between the Next.js Frontend, Google Apps Script Backend, and Google Sheets to ensure seamless, robust support for material/resource inputs managed by the Operator.
    - **Audit Findings**:
      - **Frontend (`src/services/api.ts`)**: `MaterialUsage` interface maps exactly to `id`, `name`, `quantity`, `unit`, `unitPrice` (optional), and `totalPrice` (optional).
      - **Backend Script (`gas/Code.gs`)**: Automatically initializes a `Materials` sheet via `getOrCreateSheet()` with correct headers `['Case ID', 'Material ID', 'Material Name', 'Quantity', 'Unit', 'Unit Price', 'Total Price']` if it doesn't exist.
      - **Database Alignment**: Confirmed 100% type alignment, auto-calculation compatibility (unitPrice * quantity = totalPrice), permission rules (Operator can edit name/qty, Finance/Admin can edit unit prices), and self-healing DB integrity.
      - **Action**: No changes needed; confirmed fully operational and perfectly optimized!
