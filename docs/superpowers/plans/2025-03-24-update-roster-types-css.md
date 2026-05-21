# Update Roster Types & CSS Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 'vacation' leave type and update CSS for status dots and full-cell blocks to support enhanced roster visualization.

**Architecture:** Update TypeScript domain types to include the new leave category and extend the global CSS stylesheet with consistent design tokens for status indicators.

**Tech Stack:** TypeScript, Vanilla CSS.

---

### Task 1: Update Roster Types

**Files:**
- Modify: `src/modules/roster/types.ts`

- [ ] **Step 1: Define LeaveType union and update LeaveRecord**

Update `src/modules/roster/types.ts` to export `LeaveType` and use it in `LeaveRecord`.

```typescript
export type LeaveType = 'sick' | 'business' | 'vacation';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  dateKey: string;
  leaveType: LeaveType;
  note?: string;
}
```

- [ ] **Step 2: Commit types update**

```bash
git add src/modules/roster/types.ts
git commit -m "chore: add LeaveType union and update LeaveRecord"
```

### Task 2: Update CSS Status Tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update .status-dot colors**

Update the `.status-dot` section in `src/index.css` with the new color palette.

```css
/* Status dots */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.status-dot.work { background: #10b981; }
.status-dot.off { background: #cbd5e1; }
.status-dot.holiday { background: #94a3b8; }
.status-dot.ot { background: #3b82f6; }
.status-dot.leave-sick { background: #f43f5e; }
.status-dot.leave-business { background: #f59e0b; }
.status-dot.leave-vacation { background: #8b5cf6; }
```

- [ ] **Step 2: Add .status-block classes**

Add the `.status-block` classes for full-cell display in `src/index.css`.

```css
/* Status blocks for full-cell display */
.status-block {
  width: 100%;
  height: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 6px;
}
.status-block.work { background: #10b981; }
.status-block.off { background: #f1f5f9; }
.status-block.leave-sick { background: #f43f5e; }
.status-block.leave-business { background: #f59e0b; }
.status-block.leave-vacation { background: #8b5cf6; }
.status-block.holiday { background: #e2e8f0; }
```

- [ ] **Step 3: Commit CSS updates**

```bash
git add src/index.css
git commit -m "chore: update CSS status tokens and add status-block classes"
```
