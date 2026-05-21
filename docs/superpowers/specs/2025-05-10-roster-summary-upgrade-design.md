# Design Spec: Roster Summary Upgrade (Full-Cell & Legend)

**Date:** 2025-05-10
**Status:** Draft

## 1. Overview
Upgrade the Roster Summary view from a dot-based display to a high-legibility "Heatmap" style. This includes adding a color legend and transforming table cells into full-color blocks.

## 2. Components

### 2.1 RosterLegend.tsx (New)
A clean, horizontal legend component to be displayed above the Roster Summary table.

- **Props:** None
- **Content:**
  - ทำงาน (WORK): `#10b981`
  - หยุด (OFF): `#cbd5e1`
  - ลาป่วย (SICK): `#f43f5e`
  - ลากิจ (BIZ): `#f59e0b`
  - ลาพักร้อน (VAC): `#8b5cf6`
- **Styling:** Flex row with small colored squares and labels. Minimal padding and gap.

### 2.2 RosterSummary.tsx (Modify)
Transform the existing table into a heatmap.

- **Legend Integration:** Import and place `RosterLegend` at the top of the component.
- **Heatmap Cells:**
  - Replace `<span className="status-dot ...">` with a `div` that fills the cell.
  - Cell padding should be reduced (e.g., `p-0.5` or `p-1`) to maximize color block size.
  - Colors should follow the standard palette:
    - WORK: `#10b981`
    - OFF: `#cbd5e1`
    - SICK: `#f43f5e`
    - BIZ: `#f59e0b`
    - VAC: `#8b5cf6` (ensure 'vacation' type uses this)
    - HOLIDAY: `#94a3b8` (optional, for consistency with calendar)
- **Table Enhancements:**
  - **Zebra Stripes:** Alternate row backgrounds (e.g., `even:bg-slate-50/50`) for horizontal tracking.
  - **Sticky Column:** Ensure "Employee Name" remains sticky on the left.
  - **Hover Effects:** Maintain row hover highlighting but ensure it doesn't obscure the color blocks.

## 3. Implementation Plan

### Step 1: Create RosterLegend.tsx
- Implement the UI with the specified colors and labels.

### Step 2: Refactor RosterSummary.tsx
- Update the cell rendering logic.
- Implement the Zebra striping.
- Integrate the legend.

### Step 3: Verification
- Verify colors match the requirement.
- Verify horizontal scrolling and sticky column.
- Verify responsiveness.

## 4. Success Criteria
- [ ] Roster Summary displays a legend at the top.
- [ ] Table cells are colored blocks (Heatmap style).
- [ ] Vacation leave is correctly colored `#8b5cf6`.
- [ ] Horizontal tracking is improved with zebra stripes.
