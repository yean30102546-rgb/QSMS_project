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

### 19. Hydration Mismatch in Client-Only React 19 Trees (2026-05-18)
- **Problem**: When migrating a client-side Vite single-page application (SPA) to Next.js, importing the root app directly on the entry page (`src/app/page.tsx`) can trigger hydration mismatch warnings or client-side crashes (e.g. `window is not defined` or `localStorage is not defined`) during server-side static rendering phases.
- **Solution**: Used Next.js's dynamic import with `ssr: false` to force client-only execution:
  ```typescript
  const App = dynamic(() => import('../App'), { ssr: false, loading: () => <FallbackSpinner /> });
  ```
- **Learning**: Always leverage dynamic client-side imports (`ssr: false`) when hosting legacy SPA applications inside Next.js pages. This isolates browser-only global contexts safely from server compilation pipelines and yields a clean, resilient, compile-safe production build.

### 20. CSS Line Reference Desynchronization during File Replacements (2026-05-19)
- **Problem**: When replacing base CSS rules inside `src/index.css`, a target content block was specified based on stale line numbers, which caused the replacement tool to accidentally strip out key glassmorphism layout classes.
- **Cause**: Relying on cached or previous summaries of file line ranges without verifying the current state of the file directly before executing a search-and-replace command.
- **Solution**: Executed `git checkout -- src/index.css` to restore the file, re-read the active file context using `view_file` to determine the exact, up-to-date line bounds, and successfully executed a precise targeted replacement.
- **Learning**: Never assume class names or structures remain at the same line positions across git branches or file versions. Always re-inspect the target file's current content layout with `view_file` immediately before applying replacement edits.

### 21. Code Replacement Line Number Shifts and Whitespace Matches (2026-05-19)
- **Problem**: When trying to replace larger code blocks (like Roster employee sidebar or forms) in `RosterApp.tsx`, the tool returned "chunk 0: target content not found in file".
- **Cause**: The line numbers had shifted due to previous inserts of functions, and minor leading whitespace differences (e.g. 14 spaces vs 15 spaces) made the search content mismatch.
- **Solution**: Re-viewed the target lines with `view_file` to find the exact line ranges and matching whitespace, then performed smaller, more precise replacements.
- **Learning**: Keep target content strings exact (including spacing) and use smaller blocks when possible to prevent matching failures during file edits.

### 22. Roster Calendar Initial Saturday Configuration Requirement (2026-05-19)
- **Problem**: When a new employee is added to the roster or has no initial working Saturday configuration set, automatically running the alternating Saturday formula can lead to incorrect calendars and user confusion.
- **Solution**: Set the initial Saturday status of all Saturdays to `'OFF'` by default if `startWorkingSaturday` is not configured. Render a prominent warning callout and a dynamic action button ("ตั้งเป็นเสาร์เริ่มงาน") directly inside Saturday calendar cells, enabling users to set it with a single click.
- **Learning**: Always build explicit UI guardrails and configuration prompts for rule-based systems (like shift rosters) rather than silently calculating fallbacks that might be incorrect.

### 23. Quick Calendar Action Buttons with Hover State (2026-05-19)
- **Problem**: Adding too many quick-action buttons (like sick leave, personal leave) inside every calendar cell makes the UI cluttered, crowded, and reduces readability.
- **Solution**: Use CSS hover states (`opacity-0 group-hover:opacity-100 transition-opacity`) to hide the buttons under normal viewing, but display them beautifully when the user hovers their mouse over a specific workday cell.
- **Learning**: Leverage hover micro-interactions and transitions to provide advanced features without sacrificing clean, minimalist design aesthetics.

### 24. Apps Script Web App Out-of-Sync Errors & Dynamic Guides (2026-05-19)
- **Problem**: When the React frontend is updated with new server actions (e.g. `rosterUpdateEmployeeStartSaturday`), users may see "Unknown action" runtime errors if they haven't copied the latest code to their Google Drive Apps Script or haven't deployed it as a "New Version".
- **Solution**: Implemented a dynamic error interceptor on the UI. When `Unknown action` is detected, the error banner automatically displays a friendly Thai step-by-step tutorial explaining how to open the Apps Script Editor, copy `gas/gas_calendar.gs`, and deploy it as a "New Version".
- **Learning**: When building serverless or Google Apps Script backends, API version mismatches are common. Designing context-aware error banners that guide users step-by-step to deploy updates is critical for a smooth user experience, especially for non-technical administrators.

### 25. TypeScript Compiler Error on Destructured Props in MainLayout (2026-05-19)
- **Problem**: Next.js production build (`npm run build`) failed with `Property 'onBackToPortal' does not exist on type 'IntrinsicAttributes & MainLayoutProps'` because the Rework module attempted to pass the back-to-portal handler, but the `MainLayout` component interface was not updated to accept it.
- **Solution**: Added `onBackToPortal: () => void;` to `MainLayoutProps` interface, destructured the parameter in `MainLayout`, and registered the `ArrowLeft` sidebar navigation item.
- **Learning**: When refactoring shell layouts and portal page navigation pathways, ensure all interface specifications (props) are aligned across parent-child boundaries to avoid breaking compilation processes.

### 26. TypeScript Compiler Strict Union Type Warning in Array Operations (2026-05-19)
- **Problem**: Build error occurred in `RosterApp.tsx` because the status string variable `status` was being pushed into an array of `RosterOverride` which expects strict `RosterCellStatus` type values.
- **Solution**: Performed typing assertion using `status: status as RosterCellStatus` inside the array push operation.
- **Learning**: TypeScript's strict typing system requires union strings to be matched explicitly. Type casting with `as` is a lightweight, safe mechanism when interacting with values that are dynamically routed but verified.

### 27. Duplicate Calendar Year Display in Dropdown Options (2026-05-19)
- **Problem**: The Saturday start date select dropdown showed the Buddhist year twice (e.g. "เสาร์ที่ 4 เมษายน 2569 2569").
- **Cause**: The custom helper function `getThaiMonthLabel(curr)` was built using `Intl.DateTimeFormat` with `{ year: 'numeric' }`, which already outputs the full month name and Buddhist year (e.g., "เมษายน 2569"). The template string in `RosterApp.tsx` manually appended `${curr.getFullYear() + 543}` on top of it, resulting in the duplication.
- **Solution**: Removed the manual year addition from the formatted string, changing it to ``เสาร์ที่ ${curr.getDate()} ${getThaiMonthLabel(curr)}``.
- **Learning**: Before manually formatting dates and years, verify the exact return format of localization helper functions to prevent duplication of year or month names in the UI.

### 28. Blocked Add Employee Button and Redundant Dropdown (2026-05-19)
- **Problem**: The "เพิ่มพนักงาน" (Add Employee) button was disabled/blocked, and the dropdown for selecting initial working Saturdays in the employee form was redundant.
- **Cause**: The button validation required both the name input and the Saturday dropdown value (`newEmployeeStartSaturday`) to be filled. However, users were confused by the dropdown, or it failed to populate correctly, locking the button. Furthermore, we already implemented a click handler directly inside the calendar cells to let users dynamically set the initial Saturday with a single click, making the initial dropdown redundant.
- **Solution**: Removed the redundant `newEmployeeStartSaturday` state and the dropdown select input from the JSX form, updated the disabled validation condition of the button to check only for the name input (`disabled={!newEmployeeName.trim()}`), and configured the `addEmployee` action to submit the initial Saturday as an empty string (`''`).
- **Learning**: Design UI forms to be as lean as possible. If a configuration step (like setting the initial starting Saturday) can be done interactively on the calendar itself, remove it from the creation form to avoid validation blockers and improve UX.

### 29. Next.js App Router Compilation Error Due to JSX Structural Misalignment (2026-05-20)
- **Problem**: Next.js production compilation failed with syntax errors regarding unclosed tags and mismatched fragments (`</>` instead of `</div>` and `</section>` instead of `</motion.div>`).
- **Cause**: During the transition to a state-driven 2-tab layout, we replaced section elements with `AnimatePresence` and `motion.div` grids but missed updating the corresponding closing tags at the bottom of the main conditional block, leading to parser errors.
- **Solution**: Traced the opening tags carefully, replaced the incorrect `</section>` with `</motion.div>` and `</AnimatePresence>`, and changed the mismatched `</>` to `</div>`.
- **Learning**: When refactoring large UI trees, verify that every opening tag (especially conditionals or wrapper blocks) is matched exactly by its closing counterpart at the same indentation level before running full checks.

### 30. Missing React Event Modifier Typo (2026-05-20)
- **Problem**: The drag-and-drop handler was configured using `dragEnd` instead of `onDragEnd` on the drag handle span.
- **Cause**: Typo in drag-and-drop JSX attributes, leading to a silent bug where state was not reset after dropping an item.
- **Solution**: Changed `dragEnd` to `onDragEnd` in the element attributes.
- **Learning**: Always double-check React's native event mapping conventions (prefixed with `on`, e.g., `onDragStart`, `onDragEnd`, `onDragOver`).

### 31. Cache Invalidation Misses in Optimistic UI (2026-05-20)
- **Problem**: Changing employee phase, deleting employees, or swapping Saturdays updated the React state instantly but caused old data to flash briefly when navigating away or refreshing the browser.
- **Cause**: The application uses `sessionStorage` for caching monthly API payloads. When data mutations occurred, the cache was not explicitly cleared (invalidated).
- **Solution**: Added explicit calls to `clearSessionCache()` directly after executing successful local state updates inside `deleteEmployee`, `setSaturdayOffAnchor`, `handleSwapSaturdayStatus`, and `resetMonthOverrides`.
- **Learning**: Whenever you implement Optimistic UI updates that commit to a backend database, always remember to invalidate or update the local cache storage (`localStorage`/`sessionStorage` or query caching layers) to prevent stale data from resuscitating.

### 32. Popover Dismissal Trap with Generic Selectors (2026-05-20)
- **Problem**: Clicking outside a Saturday popover menu properly closed it, but clicking on a Weekday calendar cell left the Saturday popover permanently stuck open.
- **Cause**: The `mousedown` event listener checked `!target.closest('[data-popover-container]')` to determine if the click was "outside" the menu. However, the `data-popover-container` attribute was applied to *every* calendar cell, so clicking a Weekday cell falsely told the logic "the user clicked inside the container."
- **Solution**: Replaced the generic `data-popover-container` with specific IDs: `data-popover-id={day.dateKey}`. Updated the listener to specifically verify the target is within the *currently active* popover: `!target.closest('[data-popover-id="${activePopover}"]')`.
- **Learning**: Avoid using generic container selectors for "click-away" dismiss logic when multiple sibling components share the same class or attribute. Instead, bind the check explicitly to the actively open instance's unique ID.

### 33. Apps Script Boolean Coercion Issue (2026-05-20)
- **Problem**: Soft-deleted employees (with `Active = FALSE` in Google Sheets) or inactive holidays reappeared on the calendar when changing months.
- **Cause**: The Google Apps Script code used `rows[i][3] || 'TRUE'` to parse the Active state. When the sheet cell contained the boolean value `false`, the logical OR (`||`) evaluated it as falsy and fell back to `'TRUE'`, bypassing the filter.
- **Solution**: Checked if the cell was non-empty first: `rows[i][3] !== '' ? rows[i][3] : 'TRUE'`, ensuring the actual boolean `false` value is parsed correctly as `'FALSE'`.
- **Learning**: Be careful with logical OR (`||`) defaults in Google Apps Script when reading boolean cells, as `false` is falsy and will trigger the default. Check for empty strings explicitly first.

### 34. TypeScript Strict Union Type Conflict (2026-05-20)
- **Problem**: Adding a temporary status `'CLEAR'` inside `handleSwapSaturdayStatus` caused TypeScript compilation errors (`Type '"CLEAR"' is not assignable to type 'RosterCellStatus'`).
- **Cause**: The local variables `mappedSource` and `mappedTarget` were strictly typed as `RosterCellStatus`. Since `'CLEAR'` is not part of the union type `RosterCellStatus` (and we cannot modify `types.ts`), it triggered a type mismatch.
- **Solution**: Updated the local variable type declarations to allow `'CLEAR'` as a temporary value: `let mappedSource: RosterCellStatus | 'CLEAR' = 'OFF_SWAP'`.
- **Learning**: When using strict union types, if a variable needs to hold a temporary control or sentinel value (like `'CLEAR'`), declare the local variable type as a union of the base type and the sentinel value (`BaseType | 'SENTINEL'`) instead of modifying the global type definition.

### 35. Google Apps Script Boolean Simplification (2026-05-20)
- **Problem**: Ternary logic and type coercion checking (`String(val !== '' ? val : 'TRUE').toUpperCase() === 'FALSE'`) in Apps Script is complex and hard to maintain for beginners.
- **Solution**: Replaced the ternary logic with a straightforward `sanitizeText(val, 20) || 'TRUE'` followed by a clean `.toUpperCase() === 'FALSE'`. This relies on our existing robust trimming function and is far more readable.
- **Learning**: Strive for maximum readability in shared scripts, especially when target platforms like Google Sheets might contain mixed string and boolean values.

### 36. Single-Transaction Batch Updates on Sheet Collections (2026-05-20)
- **Problem**: Swapping Saturdays required calling `upsertOverrideRow` twice in succession, causing Google Apps Script to perform two independent read-write cycles on the spreadsheet, adding substantial network latency.
- **Solution**: Developed `upsertOverrideRows(employeeId, overridesList, updatedBy)` which processes multiple cell modifications in a single read-write transaction by accumulating updates in-memory and writing to the spreadsheet once.
- **Learning**: When modifying multiple cells or rows in Google Sheets backends, batch the modifications into a single write transaction to drastically improve execution speed and reduce the chances of concurrent write collisions.

