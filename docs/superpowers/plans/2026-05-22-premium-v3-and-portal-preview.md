# Premium Apple V3 & Roster Portal Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the loading progress bar to a sleek 4px design and add a real-time data preview for the Roster module on the Portal page.

**Architecture:**
- Refine `AppleProgressBar.tsx` for minimalist proportions and better animations.
- Enhance `WorkspacePortal.tsx` with logic to calculate "Today's Status" and "Leave Summary" from fetched Roster data.

**Tech Stack:** React 19, Tailwind CSS v4, motion/react, Lucide Icons.

---

### Task 1: Refine AppleProgressBar to V3

**Files:**
- Modify: `src/components/ui/AppleProgressBar.tsx`

- [ ] **Step 1: Apply minimalist styling and glassmorphism**

```tsx
// src/components/ui/AppleProgressBar.tsx
// 1. Change height to h-[4px]
// 2. Add bg-black/5 and backdrop-blur-sm to the track (background)
// 3. Improve the glow sweep animation (opacity and blur)
// 4. Wrap entry in AnimatePresence for morphing feel
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/AppleProgressBar.tsx
git commit -m "style: upgrade AppleProgressBar to V3 (4px sleek design)"
```

---

### Task 2: Implement Real-time Roster Preview on Portal

**Files:**
- Modify: `src/components/apps/portal/WorkspacePortal.tsx`

- [ ] **Step 1: Add Roster calculation logic to fetchRoster**

```typescript
// Inside fetchRoster in WorkspacePortal.tsx
// 1. Get todayKey (YYYY-MM-DD)
// 2. Loop through employees
// 3. For each employee, check if they have leave on todayKey
// 4. Calculate: staffPresentCount, onLeaveCount (Sick/Biz/Vac)
// 5. Update rosterStats state
```

- [ ] **Step 2: Update Portal JSX for Roster Preview**

```tsx
// Update the 'else' branch of App Preview Section (Roster card)
// 1. Display 'Staff Present Today' badge
// 2. Display 'On Leave Today' summary counters
// 3. Use the soft badge colors (Green for present, Rose/Amber/Violet for leaves)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/apps/portal/WorkspacePortal.tsx
git commit -m "feat(portal): add real-time roster data preview to workspace portal"
```

---

### Task 3: Final Validation

- [ ] **Step 1: Check UI consistency**
- [ ] **Step 2: Run lint/type checks**
- [ ] **Step 3: Final Commit**

```bash
git commit -m "chore: final validation for portal preview and loading v3"
```
