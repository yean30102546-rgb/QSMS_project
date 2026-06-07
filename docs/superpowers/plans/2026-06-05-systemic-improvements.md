# Systemic Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve critical systemic issues in QSMS by prioritizing Type-Safety fixes and JWT Security migrations before tackling larger architectural changes.

**Architecture:** We will first fix the broken mock data in our test files to ensure `npm run lint` passes and enforce it in the build process. Next, we will migrate the JWT authentication from `sessionStorage` to HTTP-Only secure cookies via Next.js API Routes and Middleware to prevent XSS vulnerabilities. The remaining systemic issues (GAS migration, RAG Async Queue, App Router migration) are independent subsystems and will be addressed in separate future plans.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Playwright

---

## Phase 1: High Priority (Quick Wins & Security)

### Task 1: Fix Type-Safety Debt in Tests

**Files:**
- Modify: `src/components/ui/CaseListTable.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Run type checking to verify failure**

Run: `npm run lint`
Expected: FAIL with "Property 'error', 'searchQuery', 'hasActiveFilters' are missing in type..."

- [ ] **Step 2: Fix the mock props in CaseListTable.test.tsx**

Modify `src/components/ui/CaseListTable.test.tsx` to include the missing props in the render function.

```tsx
// Inside src/components/ui/CaseListTable.test.tsx
// Update the render calls to include the missing props:
render(
  <CaseListTable 
    cases={mockCases} 
    onRowClick={vi.fn()} 
    isLoading={false} 
    isEmpty={false} 
    isFilterEmpty={false} 
    onRetry={vi.fn()} 
    onClearFilters={vi.fn()} 
    error={null}
    searchQuery=""
    hasActiveFilters={false}
  />
);
```
*(Make sure to update all instances of `<CaseListTable>` in the test file)*

- [ ] **Step 3: Run type checking to verify it passes**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/CaseListTable.test.tsx
git commit -m "test: fix CaseListTable mock props for strict type safety"
```

### Task 2: Migrate JWT to HTTP-Only Cookie

*(Deferred to Phase 2: Will be implemented alongside the GAS to Next.js API migration to avoid breaking the client-side SPA which currently relies on synchronous token access for API Headers.)*

---

## Phase 2: Medium/Low Priority (Future Plans)

Due to the architectural complexity, the following items require their own separate sub-project plans. Once Phase 1 is complete, we will brainstorm and generate separate implementation plans for:

1. **RAG Async Pipeline (Medium Priority):** Moving PDF parsing and embedding to a background queue to avoid Serverless timeouts.
2. **JWT to HTTP-Only Cookie Migration (Medium Priority):** Moving authentication from sessionStorage to secure cookies via Next.js Proxy/Middleware.
3. **App Router SPA Migration (Low Priority):** Refactoring `src/App.tsx` routes into Next.js App Router directories for RSC/SSR optimization.
