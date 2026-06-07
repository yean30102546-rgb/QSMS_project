# Implementation Plan: QSMS User Guide Redesign

## Objective
Redesign the `GuideApp.tsx` and `MockScreens.tsx` so that the User Guide looks exactly like the real application components. The user has decided to prioritize **100% fidelity to the real project's UI and interactivity**, moving away from the previously proposed "Impeccable" brutalist mock designs if they deviate from the real UI.

## 1. Core Decision: 100% Fidelity without Side Effects
- **Decision**: The user explicitly requested that `MockAddCase` (and other mock screens) must be 100% identical to the real project (`AddCaseTab.tsx`) in both UI and interactivity.
- **Data Safety (No Real DB Saves)**: To prevent dummy training data from polluting the production database, we will **NOT** use the actual `<AddCaseTab />` component directly. 
- **Execution Approach**: We will copy the exact source code of `AddCaseTab` into `MockScreens.tsx` (or a dedicated mock file) and rename it to `MockAddCaseTab`. We will then strip out the real API calls (e.g., `insertCase`) and replace them with a simulated loading state (`setTimeout`). This guarantees identical validation, autofill, and UI behavior without database side effects.

## 2. Component Matching (`MockScreens.tsx`)

### 2.1 MockAddCase (Exact Clone of AddCaseTab)
- Copy the entire structure, state, and form handling (`react-hook-form`, `zod`) from `AddCaseTab.tsx`.
- Replace `insertCase` with a simulated Promise that delays for 1.5 seconds and succeeds.
- Keep `useItemVerification` if we want real autofill, or mock the verification hook to always return mock data for specific barcodes.
- Ensure the surrounding layout matches `MainLayout`.
- **New Feature: Pulsing Hotspots (Tooltips)**: Add interactive hotspots over key elements (e.g., Barcode Input, Cross-Item Link). Hovering a hotspot will highlight the target element and smoothly expand a tooltip card (like a modern video frontend). Taking the mouse off will smoothly collapse it using Framer Motion.

### 2.2 MockPortal (Matches `WorkspacePortal.tsx`)
- Mirror the exact styling of the real WorkspacePortal.

### 2.3 MockOverall (Case List)
- Mirror the exact structure of `OverallTab.tsx` and its DataGrid. 

### 2.4 MockUpdateModal
- Mirror `UpdateModal.tsx` exactly.

### 2.5 MockDashboard
- Mirror `DashboardTab.tsx` exactly.

## 3. GuideApp Presentation Engine Updates
- Maintain the tour overlay cards.

## 4. Execution Steps
1. **MockAddCaseTab Implementation**: Copy `AddCaseTab.tsx` content to `MockScreens.tsx`. Adjust imports and context dependencies.
2. **Remove Real API calls**: Swap `insertCase` with a simulated timeout.
3. **Mock Layout Wrapper**: Render the `MockAddCaseTab` inside a replicated `MainLayout` shell (sidebar, header).
4. **Test**: Run the guide and verify that interacting with the form acts identically to the real app but does not persist data to Supabase.
