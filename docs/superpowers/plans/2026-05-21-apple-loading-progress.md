# Apple-Style Progress Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a sleek Apple-style determinant progress bar and integrate it into saving workflows across the QSMS system.

**Architecture:** 
- Create a stateless `AppleProgressBar` component for UI.
- Create a `useSaveProgress` hook to handle the "simulated increment" logic (0% to ~90% while waiting, then 100% on success).
- Inject the hook and component into `UpdateModal`, `AddCaseTab`, and `RosterDialogs`.

**Tech Stack:** React 19, Tailwind CSS v4, motion/react (Framer Motion).

---

### Task 1: Reusable AppleProgressBar Component

**Files:**
- Create: `src/components/ui/AppleProgressBar.tsx`

- [ ] **Step 1: Create the component with sleek Apple aesthetics**

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface AppleProgressBarProps {
  progress: number;
  label?: string;
  isComplete?: boolean;
}

export function AppleProgressBar({ progress, label = 'กำลังบันทึกข้อมูล...', isComplete }: AppleProgressBarProps) {
  return (
    <div className="w-full py-2">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-bold text-slate-900">บันทึกสำเร็จ!</span>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-[13px] font-bold text-slate-900 tracking-tight uppercase">{label}</span>
              <span className="text-[13px] font-mono font-bold text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
              <motion.div
                className="h-full bg-slate-900 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              />
            </div>
            <p className="text-[11px] text-center text-slate-400 font-medium">กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/AppleProgressBar.tsx
git commit -m "feat(ui): add reusable AppleProgressBar component"
```

---

### Task 2: useSaveProgress Hook for Logic

**Files:**
- Create: `src/hooks/useSaveProgress.ts`

- [ ] **Step 1: Implement progress simulation logic**

```typescript
import { useState, useCallback, useRef } from 'react';

export function useSaveProgress() {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSaving = useCallback(() => {
    setIsSaving(true);
    setProgress(0);
    setIsComplete(false);

    // Simulate progress to 90%
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 90;
        }
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 90);
      });
    }, 400);
  }, []);

  const finishSaving = useCallback((onFinished?: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    setIsComplete(true);

    // Stay on complete for a moment then cleanup
    setTimeout(() => {
      setIsSaving(false);
      setIsComplete(false);
      setProgress(0);
      if (onFinished) onFinished();
    }, 1500);
  }, []);

  const failSaving = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSaving(false);
    setProgress(0);
    setIsComplete(false);
  }, []);

  return { isSaving, progress, isComplete, startSaving, finishSaving, failSaving };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSaveProgress.ts
git commit -m "feat(hooks): add useSaveProgress hook for loading simulation"
```

---

### Task 3: Integration into UpdateModal

**Files:**
- Modify: `src/components/modals/UpdateModal.tsx`

- [ ] **Step 1: Inject hook and replace button**

```tsx
// src/components/modals/UpdateModal.tsx
import { AppleProgressBar } from '../ui/AppleProgressBar';
import { useSaveProgress } from '../../hooks/useSaveProgress';

// ... Inside Component
const { isSaving: isHolding, progress, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();

const handleUpdate = async () => {
  // ... validation ...
  startSaving(); // 1. Start progress
  
  try {
    const success = await onUpdate(caseData.id, updates);
    if (success) {
      finishSaving(() => {
        // 2. Original success logic (close modal, etc)
        setIsEditMode(false);
      });
    } else {
      failSaving();
    }
  } catch (err) {
    failSaving();
  }
};

// ... In Render (Replace the Save Button)
<div className="mt-8 flex justify-end">
  {isHolding ? (
    <AppleProgressBar progress={progress} isComplete={isComplete} />
  ) : (
    <motion.button ...>บันทึกการเปลี่ยนแปลง</motion.button>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/UpdateModal.tsx
git commit -m "feat(rework): integrate apple loading progress in UpdateModal"
```

---

### Task 4: Integration into AddCaseTab

**Files:**
- Modify: `src/components/tabs/AddCaseTab.tsx`

- [ ] **Step 1: Inject hook and replace button**

```tsx
// src/components/tabs/AddCaseTab.tsx
import { AppleProgressBar } from '../ui/AppleProgressBar';
import { useSaveProgress } from '../../hooks/useSaveProgress';

// ... Inside Component
const { isSaving: isHolding, progress, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();

// Wrap handleSubmit or update handleSubmit caller in App.tsx
// Note: App.tsx handles the actual call, but the UI is here.
// I might need to lift useSaveProgress to App.tsx if logic is complex.
// For now, let's assume we update the props or handle locally if possible.
```

- [ ] **Step 2: Lift state if needed (Checking App.tsx)**
Wait, Task 4 might touch `src/App.tsx` instead of `AddCaseTab.tsx` because `App.tsx` contains the `handleSubmit` logic.

- [ ] **Step 3: Update App.tsx for AddCase progress**

```tsx
// src/App.tsx
// Integrate useSaveProgress into MainAppContent
// Pass isHolding, progress, isComplete props down to AddCaseTab
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/tabs/AddCaseTab.tsx
git commit -m "feat(rework): integrate apple loading progress in AddCaseTab"
```

---

### Task 5: Integration into RosterDialogs

**Files:**
- Modify: `src/modules/roster/components/RosterDialogs.tsx`

- [ ] **Step 1: Replace "บันทึกการลา" button with progress bar**

```tsx
// src/modules/roster/components/RosterDialogs.tsx
// Update RosterDialogsProps to receive progress state
// Replace button in DialogFooter when saving
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/roster/components/RosterDialogs.tsx src/modules/roster/RosterApp.tsx
git commit -m "feat(roster): integrate apple loading progress in Leave Dialog"
```
