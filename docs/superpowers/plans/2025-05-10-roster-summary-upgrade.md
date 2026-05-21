# Roster Summary Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Roster Summary into a high-legibility Heatmap with a color legend.

**Architecture:** Create a standalone `RosterLegend` component and refactor `RosterSummary` to use full-cell background colors instead of status dots.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React.

---

### Task 1: Create RosterLegend Component

**Files:**
- Create: `src/modules/roster/components/RosterLegend.tsx`

- [ ] **Step 1: Implement RosterLegend component**

```tsx
import React from 'react';

export function RosterLegend() {
  const items = [
    { label: 'ทำงาน (WORK)', color: '#10b981' },
    { label: 'หยุด (OFF)', color: '#cbd5e1' },
    { label: 'ลาป่วย (SICK)', color: '#f43f5e' },
    { label: 'ลากิจ (BIZ)', color: '#f59e0b' },
    { label: 'ลาพักร้อน (VAC)', color: '#8b5cf6' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 px-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm shadow-sm" 
            style={{ backgroundColor: item.color }} 
          />
          <span className="text-xs font-medium text-[#71717a]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/roster/components/RosterLegend.tsx
git commit -m "feat: add RosterLegend component"
```

---

### Task 2: Refactor RosterSummary Heatmap

**Files:**
- Modify: `src/modules/roster/components/RosterSummary.tsx`

- [ ] **Step 1: Import RosterLegend and update cell rendering**

```tsx
// At the top of RosterSummary.tsx
import { RosterLegend } from './RosterLegend';

// Inside RosterSummary component, update TableBody mapping:
// Replace the dot rendering with full-cell blocks and update status-to-color mapping
```

- [ ] **Step 2: Implement full-cell logic and zebra stripes**

```tsx
// Inside RosterSummary.tsx

// Update TableBody mapping:
<TableBody>
  {employees.map((emp) => (
    <TableRow
      key={emp.id}
      onClick={() => onNavigateToEmployee(emp.id)}
      className="cursor-pointer group even:bg-slate-50/50" // Zebra stripes
    >
      <TableCell className="font-semibold text-[#18181b] sticky left-0 bg-white z-10 group-hover:bg-[#fafafa] border-r">
        {emp.name}
        {!emp.startWorkingSaturday && <span className="text-amber-500 ml-1">⚠️</span>}
      </TableCell>
      {saturdaysInMonth.map((sat) => {
        const dayStatus = getEmployeeDayStatus(emp, sat);
        const leave = leaveMap.get(`${emp.id}:${sat.dateKey}`);
        
        let bgColor = '#10b981'; // Default WORK
        if (leave) {
          if (leave.leaveType === 'sick') bgColor = '#f43f5e';
          else if (leave.leaveType === 'business') bgColor = '#f59e0b';
          else if (leave.leaveType === 'vacation') bgColor = '#8b5cf6';
        } else {
          if (dayStatus === 'OFF' || dayStatus === 'OFF_SWAP') bgColor = '#cbd5e1';
          else if (dayStatus === 'HOLIDAY') bgColor = '#94a3b8';
          else if (dayStatus === 'OT2X') bgColor = '#3b82f6';
        }

        return (
          <TableCell key={sat.dateKey} className="p-0.5 text-center min-w-[50px] h-10">
            <div 
              className="w-full h-full min-h-[32px] rounded-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: bgColor }}
              title={getStatusLabel(dayStatus)}
            />
          </TableCell>
        );
      })}
    </TableRow>
  ))}
</TableBody>
```

- [ ] **Step 3: Add RosterLegend at the top**

```tsx
// Inside RosterSummary return
return (
  <div className="space-y-4">
    <RosterLegend />
    <div className="overflow-x-auto rounded-xl border border-[#e4e4e7] bg-white shadow-sm">
      <Table>
        {/* ... table content ... */}
      </Table>
    </div>
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/roster/components/RosterSummary.tsx
git commit -m "feat: upgrade Roster Summary with Legend and full-cell color blocks"
```

---

### Task 3: Verification

- [ ] **Step 1: Check UI**
- Ensure Legend shows all 5 categories.
- Ensure Heatmap colors match the Legend.
- Ensure Zebra stripes are visible.
- Ensure "Employee Name" column is still sticky.
- Ensure "vacation" leave is purple (#8b5cf6).
