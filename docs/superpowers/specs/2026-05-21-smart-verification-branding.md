# Design Spec: Smart Item Verification & Unified Branding

**Date:** 2026-05-21
**Status:** Draft
**Topic:** Intelligent cross-linking of Item Number/Code and platform-wide professional rebranding.

## 1. Overview
This specification addresses the need for a more intuitive and flexible item verification process in the QSMS Rework module. It also ensures consistent branding by renaming the Roster module to match the QSMS prefix.

## 2. Smart Item Verification (V2)

### 2.1 Logic: Last-Edited Priority
- **Tracking:** The system will maintain a `lastActiveField` state for each row in the Rework form.
- **Priority Rules:**
    1. When the "Check Data" button is clicked, the system evaluates the `lastActiveField`.
    2. If the last active field contains data, it is used as the primary search key.
    3. If the last active field is empty, the system falls back to the other identifier field.
- **Auto-Fill Sync:** Successful database matches will trigger a full update of:
    - `itemNumber`
    - `itemCode`
    - `itemName`
- **Goal:** Allow operators to switch between Barcode (Number) and Short Code (Code) interchangeably without manually clearing fields.

### 2.2 UI/UX Enhancements
- **Unified Layout:** Group `Item Number` and `Item Code` into a clear "Search Cluster".
- **Visual Feedback:** The prioritized field (last edited) will feature a slightly more prominent border color or a subtle indicator.
- **Button Styling:** Maintain the **Minimal Monochrome** (Black) style for the "Check Data" button.
- **Thai Localization:** Use clear Thai labels such as "ตรวจสอบข้อมูลสินค้า" (Check Item Data).

## 3. Unified Branding (QSMS Roster)

### 3.1 Rebranding
- **Module Name:** Rename "ShiftHub Roster" to **"QSMS Roster"**.
- **Impact Areas:**
    - Central Portal launcher card.
    - Roster module header.
    - Sidebar labels and page titles.
- **Motivation:** Align all operational modules under the QSMS (Quality System Management Suite) brand for a professional factory-grade experience.

## 4. Technical Implementation Details

### 4.1 Frontend Changes (`ReworkApp.tsx` & `AddCaseTab.tsx`)
- Add state to track `lastActiveField`.
- Update `handleCheckItemNumber` to accept the identifier and its type.
- Refactor the grid layout in `AddCaseTab.tsx` for the Search Cluster.

### 4.2 Backend Changes (`/api/rework`)
- Ensure the `verifyItem` action continues to support OR queries (`item_number` OR `item_code`).

## 5. Success Criteria
- Operators can enter a short code (e.g., FG-001) and have the barcode (e.g., 6000...) and name fill in automatically.
- The UI feels less redundant by using a single, intelligent verification button.
- The platform feels cohesive with unified "QSMS" branding.

---
**Self-Review:**
- [x] Logic handles both Number -> Code and Code -> Number directions.
- [x] UI grouping is explicit about the search intent.
- [x] Rebranding is applied consistently across all touchpoints.
