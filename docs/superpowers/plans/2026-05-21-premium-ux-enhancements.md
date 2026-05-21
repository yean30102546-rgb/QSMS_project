# Premium Apple UI & Roster Metric View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the saving progress bar to a premium Apple-style design and transform the Roster Summary into an actionable "Metric View".

**Architecture:**
- Enhance `AppleProgressBar` with CSS animations for glow effects and dynamic status labels.
- Update `useSaveProgress` hook to manage stage-based status messages.
- Completely refactor `RosterSummary` to display calculated metrics (Today's Status, Monthly Leaves, Retention) instead of the daily heatmap.

**Tech Stack:** React 19, Tailwind CSS v4, motion/react (Framer Motion), Lucide Icons.

---

### Task 1: Premium Apple Loading Component & Hook

**Files:**
- Modify: `src/components/ui/AppleProgressBar.tsx`
- Modify: `src/hooks/useSaveProgress.ts`

- [ ] **Step 1: Enhance AppleProgressBar UI with Glow and Dynamic Status**

```tsx
// src/components/ui/AppleProgressBar.tsx
// Add 'statusText' prop
// Add CSS keyframe for 'sweep'
// Implement gradient and moving glow div
```

- [ ] **Step 2: Update useSaveProgress hook for Dynamic Status Labels**

```typescript
// src/hooks/useSaveProgress.ts
// Add statusText state
// Logic: 0-25% "Compressing images...", 25-50% "Syncing with Supabase...", 
//        50-85% "Updating Google Sheets...", 85-100% "Finalizing..."
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/AppleProgressBar.tsx src/hooks/useSaveProgress.ts
git commit -m "feat(ui): upgrade to premium apple-style loading with glow and dynamic status"
```

---

### Task 2: Upgrade Roster Summary to Metric View

**Files:**
- Modify: `src/modules/roster/components/RosterSummary.tsx`
- Modify: `src/modules/roster/RosterApp.tsx` (If prop changes are needed)

- [ ] **Step 1: Refactor RosterSummary structure**

```tsx
// src/modules/roster/components/RosterSummary.tsx
// Replace Saturdays columns with:
// 1. พนักงาน (Name + Alerts)
// 2. สถานะวันนี้ (Badge)
// 3. สรุปการลา (เดือนนี้) (Pills/Counters)
// 4. ความต่อเนื่อง (Progress Bar)
```

- [ ] **Step 2: Implement Metrics Calculation Logic**

```tsx
// Inside RosterSummary component:
// const todayKey = format(new Date(), 'yyyy-MM-dd');
// const getEmployeeMetrics = (emp) => {
//    const monthLeaves = leaves.filter(l => l.employeeId === emp.id && l.dateKey.startsWith(monthKey));
//    const sick = monthLeaves.filter(l => l.leaveType === 'sick').length;
//    ...
//    const retention = (workingDays / totalWorkingDays) * 100;
// }
```

- [ ] **Step 3: Styling and UX Fixes**

```tsx
// Ensure the table container has overflow-y-auto and max-height for scrolling
// Apply sticky header styles
// Use Zebra stripes
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/roster/components/RosterSummary.tsx
git commit -m "feat(roster): upgrade Summary to Metric View with actionable data"
```

---

### Task 3: Final Validation & Cleanup

- [ ] **Step 1: Run type checks**
- [ ] **Step 2: Verify scrollability and Sticky Header in Summary**
- [ ] **Step 3: Verify the "Glow" animation in Loading**
- [ ] **Step 4: Final Commit**

```bash
git commit -m "chore: final validation and cleanup for premium UX enhancements"
```
