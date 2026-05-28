# QSMS Rework Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement strict data integrity rules (Strict Identity Conflict, Evidence Integrity, Transaction Integrity) as defined in `CONTEXT.md`.

**Architecture:** Refactor the `verificationStatus` into a robust state machine, enhance backend verification for cross-field conflicts, and enforce image requirements at the UI and validation layers.

**Tech Stack:** React, TypeScript, Next.js API Routes, Supabase, Tailwind CSS (Vanilla CSS preferred per project style).

---

### Task 1: Backend Conflict Detection API

**Files:**
- Modify: `src/app/api/rework/route.ts`

- [ ] **Step 1: Update `verifyItem` logic to check for identity conflicts**

```typescript
// Inside POST function, switch(action), case 'verifyItem':
// Change logic to check both itemNumber and itemCode and detect if they point to different records.

const { itemNumber, itemCode } = body;
const conditions = [];
if (itemNumber) conditions.push(`item_number.eq.${itemNumber}`);
if (itemCode) conditions.push(`item_code.eq.${itemCode}`);

// ... existing code ...

const { data, error } = await supabaseServer
  .from('rework_master_items')
  .select('*')
  .or(conditions.join(','));

if (error) throw error;

if (!data || data.length === 0) {
  return NextResponse.json({ success: true, data: { found: false } });
}

// Check for conflict
const matchByNumber = itemNumber ? data.find(i => i.item_number === itemNumber) : null;
const matchByCode = itemCode ? data.find(i => i.item_code === itemCode) : null;

if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
  return NextResponse.json({ success: true, data: { found: true, conflict: true } });
}

const record = matchByNumber || matchByCode;
// ... return found record ...
```

- [ ] **Step 2: Test with mock request**

Run: `node -e "fetch('http://localhost:3000/api/rework', {method:'POST', body:JSON.stringify({action:'verifyItem', itemNumber:'A', itemCode:'B'})}).then(r => r.json()).then(console.log)"`
(Note: Requires actual data in Supabase or a mock environment)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rework/route.ts
git commit -m "feat(api): add identity conflict detection to verifyItem"
```

---

### Task 2: Frontend Validation & Evidence Rules

**Files:**
- Modify: `src/services/validation.ts`
- Modify: `src/modules/rework/ReworkApp.tsx` (interface update)

- [ ] **Step 1: Update `ReworkItemValidationInput` and `validateReworkItem`**

```typescript
// src/services/validation.ts
export interface ReworkItemValidationInput {
  // ...
  imageCount?: number; // Add this
}

export function validateReworkItem(item: ReworkItemValidationInput): ValidationResult {
  const errors = [
    // ... existing ...
    (!item.imageCount || item.imageCount < 1)
      ? { field: 'images', message: 'กรุณาแนบรูปภาพอย่างน้อย 1 รูป' } : null,
  ].filter(Boolean);
  // ...
}

export function isSaveDisabled(items: ReworkItemValidationInput[]): boolean {
  return items.some(item => !validateReworkItem(item).isValid || item.verificationStatus === 'conflict');
}
```

- [ ] **Step 2: Update `ReworkApp.tsx` to pass image count to validator**

- [ ] **Step 3: Commit**

```bash
git add src/services/validation.ts
git commit -m "feat(validation): enforce mandatory evidence (images)"
```

---

### Task 3: Conflict Modal Component

**Files:**
- Create: `src/components/modals/ConflictModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold">!</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ข้อมูลขัดแย้งกัน (Identity Conflict)</h3>
            <p className="text-gray-600 mb-6">
              รหัสสินค้า และ บาร์โค้ด ที่คุณกรอกเป็นของสินค้าคนละชนิดกัน กรุณาตรวจสอบและแก้ไขให้ถูกต้อง
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              ตกลง (รับทราบ)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/ConflictModal.tsx
git commit -m "feat(ui): add ConflictModal component"
```

---

### Task 4: State Machine Integration in ReworkApp

**Files:**
- Modify: `src/modules/rework/ReworkApp.tsx`

- [ ] **Step 1: Integrate `ConflictModal` and state logic**
- [ ] **Step 2: Update `verifySingleItem` to trigger modal on conflict**
- [ ] **Step 3: Ensure UI shows "Evidence Required" warning**
- [ ] **Step 4: Commit**

```bash
git add src/modules/rework/ReworkApp.tsx
git commit -m "refactor(rework): integrate verification state machine and conflict modal"
```

---

### Task 5: Transaction Integrity (Submission Flow)

**Files:**
- Modify: `src/modules/rework/ReworkApp.tsx`
- Modify: `src/app/api/rework/route.ts`

- [ ] **Step 1: Tighten submission sequence**
Ensure GAS success is verified before any Supabase mutations.
- [ ] **Step 2: Commit**

```bash
git add src/modules/rework/ReworkApp.tsx src/app/api/rework/route.ts
git commit -m "feat(integrity): enforce atomic submission lifecycle"
```
