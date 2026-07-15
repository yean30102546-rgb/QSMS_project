# Title: Drawing & Master QoL Recommendations
[Updated: 2026-07-07]

## 1. Summary
This document synthesizes strategic improvements to the Drawing & Master storage system to solve employee pain points: data fragmentation, lack of completion visibility, manual revision adjustments, and unapproved Excel files.

## 2. Key Details

### Strategic Recommendations:
1. **Interactive RAG Chatbot Integration**:
   - Allow employees to query "Show all drawings with missing masters" or "Has drawing D-0127 been updated for Revision 02?" using natural language.
2. **Visual Workflow & Status Registry**:
   - Implement a dashboard that shows each Customer Drawing connected visually to its Internal Master.
   - Status indicators: `Missing Master`, `Draft / Unapproved Master` (Excel upload awaiting review), `Revision Mismatch` (Drawing was updated but Master remains on the old revision), `Approved & Active`.
3. **AI-Driven Visual PDF Change Analysis (Diff)**:
   - When a new revision of a customer Drawing is uploaded, Gemini Vision compares it with the previous revision and generates a change log (e.g. "Dimension A increased by 2mm, Item Code updated from X to Y").
   - This prevents engineers from missing subtle updates in the new drawings.
4. **Excel Ingestion & Digital Approval Trail**:
   - Move away from local Excel storage by allowing engineers to upload Excel masters directly.
   - The system displays the Excel contents in a read-only table in the UI.
   - Supervisors can review it and click "Approve" inside the app, which locks the file and marks it as the official active version.

## 3. Knowledge Relationships
- Depends On (must read): [[../1_raw/DRAWING_MASTER_PAINPOINTS_RAW.md]]
- Impacted By (changes affect): [[../architecture/drawing-master-storage.md]]
