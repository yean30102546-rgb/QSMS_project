# Vacation Leave Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate 'vacation' leave into the application logic and UI components, following existing patterns for 'sick' and 'business' leave with a violet/purple theme.

**Architecture:** Update state definitions and component props to include 'vacation' leave type, and update UI logic to provide visual feedback specific to vacation leave.

**Tech Stack:** React (TypeScript), TailwindCSS, motion/react.

---

### Task 1: Update RosterApp State and Logic

**Files:**
- Modify: `src/modules/roster/RosterApp.tsx`

- [ ] **Step 1: Update leaveType and activeLeaveDialog state definitions**

```tsx
// Around line 62
const [leaveType, setLeaveType] = useState<'sick' | 'business' | 'vacation'>('sick');
// ...
// Around line 67
const [activeLeaveDialog, setActiveLeaveDialog] = useState<{
  dateKey: string;
  leaveType: 'sick' | 'business' | 'vacation';
} | null>(null);
```

- [ ] **Step 2: Update handleUpsertLeave to handle 'vacation'**

```tsx
// Around line 228
const handleUpsertLeave = (dateKey: string, leaveType: 'sick' | 'business' | 'vacation') => {
  setLeaveNoteInput(
    leaveType === 'sick' ? 'ลาป่วย 🤒' : 
    leaveType === 'business' ? 'ลากิจ 💼' : 
    'ลาพักร้อน 🏖️'
  );
  setActiveLeaveDialog({ dateKey, leaveType });
};
```

- [ ] **Step 3: Update executeUpsertLeave default note logic**

```tsx
// Around line 237
const executeUpsertLeave = async () => {
  if (!selectedEmployee || !activeLeaveDialog) return;
  const { dateKey, leaveType: type } = activeLeaveDialog;
  const note = leaveNoteInput.trim() || (
    type === 'sick' ? 'ลาป่วย 🤒' : 
    type === 'business' ? 'ลากิจ 💼' : 
    'ลาพักร้อน 🏖️'
  );
  // ...
```

- [ ] **Step 4: Commit changes**

```bash
git add src/modules/roster/RosterApp.tsx
git commit -m "feat: update RosterApp state and logic for vacation leave"
```

---

### Task 2: Update RosterDialogs for Vacation Leave

**Files:**
- Modify: `src/modules/roster/components/RosterDialogs.tsx`

- [ ] **Step 1: Update RosterDialogsProps interface**

```tsx
// Around line 12
interface RosterDialogsProps {
  activeLeaveDialog: { dateKey: string; leaveType: 'sick' | 'business' | 'vacation' } | null;
  // ...
```

- [ ] **Step 2: Update DialogTitle to show "ลาพักร้อน"**

```tsx
// Around line 43
<DialogTitle className="text-center text-xl font-bold">
  {activeLeaveDialog?.leaveType === 'sick' ? '🤒 ระบุหมายเหตุลาป่วย' : 
   activeLeaveDialog?.leaveType === 'business' ? '💼 ระบุหมายเหตุลากิจ' : 
   '🏖️ ระบุหมายเหตุลาพักร้อน'}
</DialogTitle>
```

- [ ] **Step 3: Update the "บันทึกการลา" button color logic**

```tsx
// Around line 74
className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
  activeLeaveDialog?.leaveType === 'sick'
    ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
    : activeLeaveDialog?.leaveType === 'business'
    ? 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'
    : 'bg-violet-600 shadow-violet-600/20 hover:bg-violet-700'
}`}
```

- [ ] **Step 4: Commit changes**

```bash
git add src/modules/roster/components/RosterDialogs.tsx
git commit -m "feat: update RosterDialogs UI for vacation leave"
```

---

### Task 3: Update RosterEmployeeHeader for Vacation Leave

**Files:**
- Modify: `src/modules/roster/components/RosterEmployeeHeader.tsx`

- [ ] **Step 1: Update RosterEmployeeHeaderProps interface**

```tsx
// Around line 7
interface RosterEmployeeHeaderProps {
  selectedEmployee: Employee;
  leaves: LeaveRecord[];
  leaveType: 'sick' | 'business' | 'vacation';
  setLeaveType: (type: 'sick' | 'business' | 'vacation') => void;
  leaveDate: string;
  setLeaveDate: (date: string) => void;
  onCreateLeave: (employeeId: string) => void;
}
```

- [ ] **Step 2: Add "ลาพักร้อน" option to the leave type select**

```tsx
// Around line 46
<select
  value={leaveType}
  onChange={(e) => setLeaveType(e.target.value as 'sick' | 'business' | 'vacation')}
  className="border border-[#e4e4e7] rounded-lg bg-white px-2 py-1 text-xs text-[#3f3f46] outline-none"
>
  <option value="sick">ลาป่วย</option>
  <option value="business">ลากิจ</option>
  <option value="vacation">ลาพักร้อน</option>
</select>
```

- [ ] **Step 3: Commit changes**

```bash
git add src/modules/roster/components/RosterEmployeeHeader.tsx
git commit -m "feat: add vacation leave option to RosterEmployeeHeader"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Verify all files are updated correctly**
- [ ] **Step 2: Run a quick check for any linting errors (if applicable)**
- [ ] **Step 3: Final Commit**

```bash
git commit --allow-empty -m "feat: implement vacation leave logic and UI in Dialogs/Header"
```
