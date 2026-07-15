# Raw Research: Drawing & Master Quality of Life (QoL) Improvements
Date: 2026-07-07

## 1. Pain Points Identified by Staff
- **Lack of Visibility on Completion**: Staff don't know which Customer Drawings already have their corresponding Internal Masters completed vs. which ones are still pending.
- **Data Fragmentation**: Drawings and Masters are stored in separate files/places, and there is no unified linkage mapping.
- **Manual Revision Chasing**: When a customer sends a new Revision of a Drawing, staff must manually identify and update the corresponding Master.
- **Unapproved/Draft Masters**: Many Masters are left as unapproved Excel files, leading to confusion about which file is the "Single Source of Truth".

## 2. Industry Solutions & Best Practices
- **Digital Thread / PLM (Product Lifecycle Management)**: Creating a parent-child relationship between Drawing (Source) and Master (Output).
- **Status-based Dashboard (Kanban / Registry)**: Displaying a matrix of Drawings vs. Masters with color-coded status badges (Pending, Draft, Awaiting Approval, Approved).
- **AI-Driven Diff / Revision Checker**: AI automatically compares the new Customer Drawing PDF with the old one, highlighting what changed (e.g., dimension changes, formulation changes) so the engineer knows exactly what to edit in the Master Excel.
- **Excel Ingestion & Auto-Approve Workflow**: Direct import of Excel Masters to the system with a digital approval trail (Draft -> Approved) directly in the UI, eliminating orphaned Excel files on local computers.

## 3. Recommended QoL Features for QSMS Project
- **Gap Analysis Tracking Dashboard**: 
  - A visual grid of Customer Drawings and their linked Masters.
  - Quick status filters: "Missing Master", "Draft Master", "Outdated Master (Revision Mismatch)", "Approved".
- **AI Revision Diff assistant**:
  - When uploading a new Revision of a Drawing, Gemini AI reads both the old and new revisions, generating a "Change Summary" (e.g., "Product Code changed from 40001059 to 40001954") to help the engineer update the Master Excel.
- **Excel Master Converter & Approval System**:
  - Instead of managing Excel files locally, allow importing the Excel Master into the database.
  - Implement a simple "Approve" button for supervisors in the UI, which lock the Master and flag it as active.
