# Roster Module UX & Vacation Leave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Vacation Leave" type, implement Apple Pro style sidebar selection with animations, and upgrade the Summary view to use full-cell color blocks with a legend bar.

**Architecture:** Update central types and CSS tokens first, then incrementally update components (Sidebar, Summary, Dialogs) to use the new styles and data structures. Use Framer Motion for Sidebar animations.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion (motion/react), TypeScript.

---

### Task 1: Update Types & CSS Tokens

**Files:**
- Modify: `src/modules/roster/types.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Add 'vacation' to Leave types**
- [ ] **Step 2: Update status colors and add full-cell block styles**
- [ ] **Step 3: Commit**

---

### Task 2: Update RosterApp & Dialogs for Vacation Leave

**Files:**
- Modify: `src/modules/roster/RosterApp.tsx`
- Modify: `src/modules/roster/components/RosterDialogs.tsx`
- Modify: `src/modules/roster/components/RosterEmployeeHeader.tsx`

- [ ] **Step 1: Update RosterApp state and handlers**
- [ ] **Step 2: Update RosterDialogs UI**
- [ ] **Step 3: Update RosterEmployeeHeader for vacation option**
- [ ] **Step 4: Commit**

---

### Task 3: Implement Apple Pro Sidebar Selection

**Files:**
- Modify: `src/modules/roster/components/RosterSidebar.tsx`

- [ ] **Step 1: Update Sidebar styles and animations**
- [ ] **Step 2: Commit**

---

### Task 4: Upgrade Roster Summary (Full-Cell & Legend)

**Files:**
- Modify: `src/modules/roster/components/RosterSummary.tsx`
- Create: `src/modules/roster/components/RosterLegend.tsx`

- [ ] **Step 1: Create RosterLegend component**
- [ ] **Step 2: Update RosterSummary to use full-cell blocks and include Legend**
- [ ] **Step 3: Commit**

---

### Task 5: Final Validation & Fixes

- [ ] **Step 1: Check Employee Name Labels**
- [ ] **Step 2: Run verification tests**
- [ ] **Step 3: Commit final fixes**
