# Forbid Any Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce type safety in the project by forbidding the use of `any` and refactoring all existing occurrences of `any` in TypeScript files.

**Architecture:** We will set `"noImplicitAny": true` in `tsconfig.json` and replace all 30 occurrences of explicit `any` with precise types (`unknown`, specific interfaces, or domain types). We will use a TypeScript compiler dry run (`npm run lint`) to verify strict type correctness.

**Tech Stack:** TypeScript, Next.js, React

---

### Task 1: Add Rules to `tsconfig.json`

**Files:**
- Modify: `tsconfig.json`

**Step 1: Edit compilerOptions**
Add `"noImplicitAny": true` to the compiler options in `tsconfig.json`.

```diff
     "jsx": "react-jsx",
+    "noImplicitAny": true,
     "paths": {
```

**Step 2: Verify lint script fails**
Run: `npm run lint`
Expected: FAIL due to implicit and explicit `any` errors.

---

### Task 2: Refactor API Rework Route

**Files:**
- Modify: `src/app/api/rework/route.ts`

**Step 1: Replace any in case Res/Leaves processing**
Define interfaces for Leave records and DB Cases, replacing `c: any` and `l: any` on lines 75, 91 with defined structures.

**Step 2: Replace any in fetchAllCases mapping**
Define a `DBCase` interface representing the raw Supabase response for cases. Update lines 147, 168 to use it instead of `any`.

**Step 3: Replace any in insertCase and updateCaseStatus**
Replace `i: any` and `matchByNumber: any` with strong types.
Change `proxyToGAS(body: any)` to `proxyToGAS(body: Record<string, unknown>)`.

**Step 4: Verify route compilation**
Run: `npx tsc --noEmit src/app/api/rework/route.ts`
Expected: PASS

---

### Task 3: Refactor Rework Dashboard Components

**Files:**
- Modify: `src/modules/rework/ReworkApp.tsx`
- Modify: `src/components/modals/UpdateModal.tsx`

**Step 1: Replace any in ReworkApp catch blocks and updates casting**
Replace catch blocks `err: any` with `err: unknown`.
Remove `updates as any` and use proper Type assertions.

**Step 2: Replace any in UpdateModal handlers**
Update `value: any` on line 151 of `UpdateModal.tsx` to `string | number | MaterialUsage[]`.
Fix `'' as any` usages for empty numeric states.

---

### Task 4: Refactor RAG and Roster Modules

**Files:**
- Modify: `src/modules/rag/RagApp.tsx`
- Modify: `src/modules/roster/RosterApp.tsx`
- Modify: `src/app/api/rag/route.ts`
- Modify: `src/app/api/roster/route.ts`

**Step 1: Replace any in RAG Route and App**
Define the `User` and `Chunk` interfaces in the RAG app. Replace `chunk: any`, `c: any` with their respective types.

**Step 2: Replace any in Roster Route and App**
Clean up roster catch blocks and type parameters.

---

### Task 5: Refactor Tests and Final Verification

**Files:**
- Modify: `src/components/modals/UpdateModal.test.tsx`

**Step 1: Fix test mocks**
Change `mockCaseData: any` to `mockCaseData: ReworkCase`.

**Step 2: Run final lint verification**
Run: `npm run lint`
Expected: PASS with no compilation errors.
