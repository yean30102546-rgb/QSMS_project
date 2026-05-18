# Learning Log (QSMS Rework)

## Errors & Solutions

### 1. Import Path Misalignment after Reorganization (2026-05-15)
- **Problem**: Moving components into sub-directories (e.g., `src/components/ui/`) broke imports pointing to `../services/` or `../utils/`.
- **Cause**: The depth of the directory changed, but the relative paths were not automatically updated correctly in all files.
- **Solution**: Updated imports from `../` to `../../` for components moved into nested sub-directories. Used `grep` to verify all imports were fixed.
- **Learning**: When refactoring directory structure, perform a global search for relative imports (`from '..`) to ensure they still resolve correctly from the new location.

### 2. Lazy Loading Paths in MainLayout (2026-05-15)
- **Problem**: Dynamic imports in `MainLayout.tsx` used string literals that didn't automatically update.
- **Solution**: Manually updated `import('../tabs/OverallTab')` etc. in `MainLayout.tsx`.
- **Learning**: Be extra careful with string-based imports (lazy loading, dynamic requires) as they are often missed by automated refactoring tools.

### 3. Date Formatting (2026-05-15)
- **Problem**: User wanted Thai date format `15-05-2026`.
- **Solution**: Created/Updated `formatThaiDateShort` in `helpers.ts` to support specific DD-MM-YYYY format.
- **Learning**: Always clarify the exact date separator and year format (Thai Buddhist year vs Christian year) with the user.

### 4. Prop Naming Inconsistencies (Pre-deployment Review 2026-05-15)
- **Problem**: Components deeply nested had mismatched prop names (`handleAutoFillBlur` vs `handleItemNumberBlur`) resulting in build errors.
- **Learning**: Enforce strict naming conventions across parent and child components, especially when passing callback functions deeply.

### 5. Optimistic UI Updates Data Consistency (Pre-deployment Review 2026-05-15)
- **Problem**: Shallow spreading (`{ ...c, ...updates }`) during Optimistic UI updates failed to accurately merge deeply nested array items.
- **Learning**: When performing optimistic UI updates on complex objects, deep merging or careful specific property overrides are required to prevent UI glitches before the background refetch completes. Specifically, when using `setCases(prev => prev.map(c => ...))`, a simple spread operator `{ ...c, ...updates }` is dangerous for arrays of objects (like `c.items`). Modifying items or deleting them must be handled with a deep merge/filter approach to avoid overwriting the array with stale references or losing other fields.

### 6. Clipboard Paste in React Components (2026-05-15)
- **Issue**: The `onPaste` React event on a container `div` only fires if that exact `div` has `tabIndex` focus. If the user clicks elsewhere inside the container, paste fails.
- **Solution**: Use a `useRef` to find the closest overarching DOM element (e.g., `.glass-card`) and manually attach `element.addEventListener('paste', handlePaste)`. This allows the user to paste anywhere inside that element.

### 7. Form Field NaN/Empty String Handling in Dynamic Calculations (2026-05-18)
- **Problem**: When users type inside numeric input fields (like quantity or unit price in material rows), deleting the last digit can briefly make the input value empty, which React/JavaScript parses as `NaN` or invalid number.
- **Solution**: Safely fallback empty or invalid inputs to empty string visually for typing comfort, while mapping them to `0` or safe fallbacks in calculations (e.g., `Number(val) || 0`). This maintains state integrity, avoids breaking grand totals, and guarantees premium UI responsiveness.

### 8. Safe Array Range Verification in Google Sheets Read Actions (2026-05-18)
- **Problem**: Expanding an existing Google Sheet database schema with new columns (e.g. columns 27-29 for labor count, hours, and rate) means that historical data rows in the spreadsheet may be shorter in array length than new rows.
- **Solution**: In `gas/Code.gs` read operations, always verify if the cell index lies within the parsed row length (`index < row.length && row[index] !== undefined`) before mapping it, rather than directly reading `row[index]`. This guarantees backward-compatibility with older rows, prevents unexpected runtime exceptions, and maintains system resilience.

### 9. Role-Based Save Validation in Dynamic Statuses (2026-05-18)
- **Problem**: WFG users were unable to click the "ยืนยันการบันทึก" (Confirm Save) button when editing resource and labor information inside the `Pending` or `In-Progress` statuses (the button was disabled/greyed out).
- **Cause**: The save button validation logic inside `UpdateModal.tsx` restricted saves in these statuses solely to the `PDB` role: `if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB) return true;`. This accidentally blocked WFG users from recording and saving the materials and labor spent during repairs.
- **Solution**: Updated the disabled verification rule to allow both PDB and WFG roles: `if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB && !isWFG) return true;`. This safely opens write access to WFG workers while maintaining workflow safety.
- **Learning**: When modifying form edit permissions for specific roles, always verify that the overarching action buttons (like Save/Confirm) also grant matching access privileges to those roles, so that they are not locked out of completing the workflow.

### 10. Role-Based Payload Verification Mismatch (2026-05-18)
- **Problem**: When a WFG user saved a case after entering materials or labor, they encountered a "Permission denied: Only Finance or Admin can update rework cost" pop-up.
- **Cause**: The frontend automatically calculated the grand total of material and labor costs to show a dynamic preview of the `reworkCost` in the UI. When WFG clicked save, the frontend unconditionally sent `updates.reworkCost = Number(reworkCost)` in the payload. The backend Google Apps Script (`Code.gs`) checked this field and strictly blocked non-Finance/non-Admin roles from updating the cost column, throwing an error.
- **Solution**: Conditionally construct the update payload in `UpdateModal.tsx` so that `reworkCost` and `laborRate` are only sent if the user is `Finance` or `Admin`, and `laborCount`/`laborHours` are only sent if the user is `WFG` or `Admin`.
- **Learning**: Always respect database write boundaries inside the frontend payload construction. Avoid sending fields that the current user's role has no permission to update on the backend, even if those fields are locally calculated or previewed in the client UI.

### 11. Workflow Transition Blocked by Input Field Role Mismatch (2026-05-18)
- **Problem**: WFG entered resources used and clicked save, but the case status remained stuck in `In-Progress` instead of automatically moving to `Awaiting Valuation`.
- **Cause**: The automated status transition checks if the `resolutionMethod` is not empty to advance the status. However, the frontend checked `isPDB` (which was false for WFG) to render the "วิธีแก้ไขปัญหา" (Resolution Method) textarea. Because WFG was blocked from seeing or filling this field, it remained empty, blocking the status transition logic upon save.
- **Solution**: Changed the visibility check for the resolution method textarea in `UpdateModal.tsx` from `isPDB` to `isWFG` (`(caseData?.status === 'Pending' || caseData?.status === 'In-Progress') && isWFG`).
- **Learning**: When status transition logic depends on a field being filled, ensure that the role expected to transition the case (in this case, WFG performing the rework) has full write access and UI visibility to that specific field.

### 12. Workflow Blockade for Zero-Cost Valuation Cases (2026-05-18)
- **Problem**: When a case was in `Awaiting Valuation` status but required no actual material cost or labor cost (grand total = 0), clicking Save as Finance did not transition the status to `Completed` (เสร็จสมบูรณ์), causing it to be stuck in valuation forever.
- **Cause**: The transition logic strictly required the cost to be greater than zero (`if (reworkCost !== '' && Number(reworkCost) > 0)`) to advance to `Completed`. Since non-Admin users are blocked from manually clicking the status selection buttons, Finance could not close the case.
- **Solution**: Simplified the transition rule for `Awaiting Valuation` so that any save by a Finance user in this status automatically advances it to `Completed`, allowing zero-cost cases to close successfully.
- **Learning**: Do not use numeric values or inequalities (like cost > 0) as strict gates for status transition completion unless absolutely necessary, to avoid blocking legitimate zero-cost tasks.

### 13. WFG Status Transition Sticky Bug when Entering Resources (2026-05-18)
- **Problem**: When a WFG user filled in material and labor resources spent inside the In-Progress status, saving did not transition the case status to Awaiting Valuation (รอประเมินราคา).
- **Cause**: The auto-transition logic in the frontend `UpdateModal.tsx` was only checking if `resolutionMethod.trim() !== ''` to advance to Awaiting Valuation. If the WFG user only entered materials and labor without entering a resolution method text, the case remained stuck in In-Progress.
- **Solution**: Enhanced the transition logic inside `UpdateModal.tsx` to check for `resolutionMethod.trim() !== ''` OR `materials.length > 0` OR `laborHours > 0 && laborCount > 0` before auto-advancing to Awaiting Valuation.
- **Learning**: When status transitions are linked to a specific step in the workflow (like completing rework), verify all possible indicators of completion (like entering materials used or labor hours spent, not just text-based resolution notes) to avoid workflow stickiness.

### 14. Finance Save Permission Denied Bug (2026-05-18)
- **Problem**: When a Finance user attempted to save a case in Awaiting Valuation status, the save failed, throwing a "Permission denied: Only WFG or Admin can update resolution method" error.
- **Cause**: In `UpdateModal.tsx`, the `resolutionMethod` and `source` payload attributes were unconditionally sent to the Google Apps Script backend. The backend `Code.gs` strictly validated `updates.resolutionMethod !== undefined` and threw a permission error if the current user role was not WFG or Admin. Since Finance has neither role, the save was completely blocked.
- **Solution**: Wrapped the assignment of `updates.resolutionMethod` and `updates.source` inside role-based condition blocks (`if (isWFG || isAdmin)` for `resolutionMethod` and `if (isAdmin)` for `source`) in `UpdateModal.tsx`.
- **Learning**: Just as WFG had permission boundaries for Rework Cost, Finance has strict boundaries on the backend for Rework Resolution notes. Frontend updates must align perfectly with these boundaries by only sending fields that the current user's role has explicit permission to edit, avoiding unconditional payload assignments.

### 15. Backward-Compatible Role & Profile Mappings (2026-05-18)
- **Problem**: Changing a user role or authentication profile name (e.g., from WFG to Operator) in a live system can immediately crash or lock out existing active client sessions, cached browser tokens, or automated tests that are still configured with the old credentials.
- **Solution**: Implemented backward-compatible mappings on the backend script (`gas/Code.gs`). Specifically, the profile credentials now alias the old name (`profiles.WFG = profiles.OPERATOR`) and the role-check helper handles both roles (`isOperator = role === 'OPERATOR' || role === 'WFG'`).
- **Learning**: Always build alias and fallback support when renaming key entities or security roles. This guarantees zero-downtime upgrades, maintains seamless automated testing, and allows users with active sessions to transition transparently without requiring immediate cache-clearing or token refreshes.

### 16. Mismatched Script Property Keys and Input Variations for Credentials (2026-05-18)
- **Problem**: Login failed with "Authentication profile is not configured." even though OPERATOR properties were set.
- **Causes**:
  1. **Whitespace copying**: Copy-pasting properties inside the Apps Script properties GUI often introduces leading/trailing spaces (e.g. `OPERATOR_USER `), which blocks exact key matching.
  2. **Profile Key vs Value confusion**: Users may type their actual configured email value (e.g. `operator@domain.com`) in the Username input box rather than the profile role key (`OPERATOR`).
  3. **Naming variations**: Setting properties to `OPERATOR_USERNAME` instead of `OPERATOR_USER`.
- **Solutions**:
  1. Enhanced `getScriptProperty()` inside [Code.gs](file:///c:/Workplace/QSMS%20Rework%20Web%20app/gas/Code.gs) to search keys dynamically by trimming and uppercasing both the target key and all stored property keys, making it 100% space-tolerant and case-insensitive.
  2. Enhanced `handlePasswordLogin()` to support value-fallback matching. If a direct key lookup fails, the script iterates through profiles to check if the typed username matches any configured email value, then signs the token using the mapped profile key.
  3. Added `*_USERNAME` fallbacks for all user profiles in `getAuthProfiles()`.
- **Learning**: Build systems to be highly resilient against minor human settings deviations. Space-trimming lookup loops for key-value stores and value-fallback matchers for inputs eliminate confusion and guarantee a flawless user experience.

### 17. Automatic TypeScript Reconfiguration in Next.js Migration (2026-05-18)
- **Problem**: Moving a project from Vite to Next.js usually requires manually writing or updating `next-env.d.ts` and `tsconfig.json` configurations (such as paths, strict modes, and React 19 plugins).
- **Solution**: Next.js automatically detects TypeScript on the first build (`npm run build`), scans the project, and automatically reconfigures `tsconfig.json` with SWC and Webpack-compatible rules (e.g. setting `esModuleInterop` to true, `resolveJsonModule` to true, and registering the `{ name: 'next' }` plugin) without manual intervention.
- **Learning**: Trust the modern framework's build tools to handle compiler standardizations automatically. Simply initiate a production build test (`next build`) to trigger these automatic refactorings, ensuring clean compiling environments.

### 18. Tailwind CSS v4 Integration Pitfalls in Next.js Migrations (2026-05-18)
- **Problem**: After migrating a Vite project to Next.js, the styling compiles successfully, but the browser loads the pages as unstyled plain HTML.
- **Cause**: In Vite, Tailwind v4 is compiled via the `@tailwindcss/vite` plugin. In Next.js, standard styling files importing `@import "tailwindcss";` are not processed unless the PostCSS preprocessor is configured.
- **Solution**: Installed `@tailwindcss/postcss` and `postcss`, then created a `postcss.config.mjs` registering `'@tailwindcss/postcss': {}`. This registers the Tailwind v4 compiler into Next.js's style loading system.
- **Learning**: Always configure PostCSS when using Tailwind CSS v4 in Next.js migrations to guarantee stylesheets are parsed and compiled correctly. If a dev server was already running, it must be terminated and restarted (`npm run dev`) so that Next.js registers the new configuration file on startup.
