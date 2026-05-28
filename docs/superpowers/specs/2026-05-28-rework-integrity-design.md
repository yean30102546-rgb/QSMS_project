# QSMS Rework Integrity Specification

**Date:** 2026-05-28
**Status:** Draft
**Topic:** Implementation of CONTEXT.md Integrity Rules

## 1. Overview
This specification details the implementation of strict data integrity rules for the QSMS Rework Management System, as defined in the `CONTEXT.md` glossary. The goal is to ensure that Item Master identity is preserved, evidence is always provided, and case submissions are atomic.

## 2. Verification Lifecycle & State Machine
The item verification logic in the frontend and API will be refactored to support a strict state machine.

### 2.1 States
- `idle`: Default state, waiting for input.
- `checking`: Debounced (600ms) verification in progress via API.
- `verified`: Match found in Item Master (triggers autofill).
- `new`: No match found; item will be registered as a new master record upon submission.
- `conflict`: **HARD BLOCK.** Triggered when `itemNumber` and `itemCode` resolve to different records.

### 2.2 Strict Identity Logic (Frontend/Backend)
The `verifyItem` API action will perform a two-way lookup:
1. Lookup by `itemNumber`.
2. Lookup by `itemCode`.
3. If both queries return different IDs, return `{ success: true, data: { conflict: true } }`.

## 3. UI/UX & Evidence Integrity
Visual enforcement of data rules to prevent invalid submissions.

### 3.1 Conflict Modal
- Triggered immediately when an item enters the `conflict` state.
- **Title:** Identity Conflict Detected (ข้อผิดพลาด: ข้อมูลขัดแย้งกัน).
- **Body:** Explains that the Item Number and Barcode belong to different products.
- **Action:** Forced closure/reset of the conflicting field to clear the state.

### 3.2 Evidence Enforcement
- Each Rework Item card will monitor its `uploadedImages` count.
- **Warning:** Display "รูปภาพเป็นสิ่งจำเป็น" (Image Required) if count < 1.
- **Button Block:** The "Submit" button will be disabled (`disabled={isSaveDisabled}`) if any item:
  - Has `verificationStatus === 'conflict'`.
  - Has zero images.
  - Is missing required fields (Item Name, Amount, Reason, Responsible).

## 4. Transaction Integrity (Atomic Submission)
Ensuring that data and images are treated as a single unit.

### 4.1 Implementation Strategy
- The `insertCase` logic in `ReworkApp.tsx` and the `rework` API will ensure that if the GAS proxy (handling Drive uploads and Sheet updates) fails, the Supabase insertion is never attempted or is rolled back.
- **Rollback:** Since Supabase doesn't support distributed transactions with GAS easily, the backend `route.ts` will strictly sequence the calls:
  1. Proxy to GAS (Drive Folders/Images).
  2. If GAS fails → Stop and return error.
  3. If GAS succeeds → Insert into Supabase.
  4. If Supabase fails → (Manual Rollback if necessary, or rely on GAS as the source of truth for assets).

## 5. Technical Changes
- **`src/modules/rework/ReworkApp.tsx`**: Update `updateFormItem`, `verifySingleItem`, and `handleSubmit`.
- **`src/app/api/rework/route.ts`**: Update `verifyItem` case to handle identity conflicts.
- **`src/services/validation.ts`**: Update `isSaveDisabled` and `validateReworkItem` to include image count and conflict status.
- **`src/components/modals/ConflictModal.tsx`**: (New) To display identity errors.

## 6. Testing Criteria
- **Conflict Test:** Enter Item Number of Product A and Item Code of Product B. Modal should appear.
- **Evidence Test:** Try to submit without an image. Button should be disabled.
- **Autofill Test:** Enter only Item Number. Item Code and Name should fill automatically (Verified state).
