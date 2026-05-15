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
