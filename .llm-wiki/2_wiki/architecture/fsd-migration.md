# Title: การจัดระเบียบโครงสร้างโฟลเดอร์แบบ Feature-Sliced Design (FSD)
[Updated: 2026-07-14]

## 1. Summary
โปรเจกต์ได้ทำการจัดระเบียบโครงสร้างไฟล์ (Refactoring) ครั้งใหญ่จากเดิมที่นำ UI ทุกรูปแบบไปกองไว้ใน `src/components/` มาใช้แนวคิดแบบ Feature-Sliced Design (FSD) ประยุกต์ เพื่อแยกส่วนประกอบตามความหมายและการใช้งานจริง โดยการย้ายโมดูลเสร็จสิ้นอย่างสมบูรณ์และผ่านการทดสอบแบบ Zero-Error Type Check (`tsc --noEmit`)

## 2. Key Details
โครงสร้างที่จัดระเบียบใหม่มีลำดับชั้นดังนี้:
- **`src/components/ui/`**: เก็บเฉพาะ Base Components ที่เล็กที่สุด (เช่น Button, Card, Dialog) ซึ่งเป็นชิ้นส่วนที่ไม่มี Business Logic เกี่ยวข้อง
- **`src/components/shared/`**: เก็บ UI ที่ใช้ข้ามฟีเจอร์ได้แต่มีความซับซ้อนกว่า Base UI เล็กน้อย (เช่น Toast, LoadingOverlay, Pagination)
- **`src/modules/`**: เก็บ Business Logic ทั้งหมด โดยแยกตามโดเมนและฟังก์ชัน:
  - `auth/`: บริการล็อกอินและลงทะเบียน ประกอบด้วยหน้า `Login.tsx` และ `Register.tsx`
  - `rework/`: หน้าจัดการเคสซ่อม (`AddCaseTab.tsx`, `OverallTab.tsx`, `DashboardTab.tsx`, และ `UpdateModal`)
  - `storage/`: ระบบอัปโหลดและจัดการรูปภาพหลักฐาน (`ImageUpload.tsx`, `ImageEditor.tsx`)
  - `drawings/`: การออกรายงานและแปลน รวมถึงไฟล์ Template PDF/Excel (`ExportTemplate.tsx`, `ExportPDFTemplate.tsx`)
  - `guide/`: คู่มือแนะนำการใช้งานและ Mock Screens สำหรับทดสอบ
  - `platform/`: การลงทะเบียน Component ภายในระบบแบบ Dynamic (`appRegistry.ts`)
  - `rag/`: บริการ SSE AI Chat และ Semantic RAG ในการดึงข้อมูลและคู่มือ Rework
- **`src/utils/`**: เครื่องมือช่วยเหลือทั่วไป (ย้าย `proxy.ts` และ helpers ต่างๆ มาไว้ที่นี่)

### กฎการนำเข้าโมดูล (Import Rules)
1. **ห้ามใช้ Relative Path ย้อนหลังลึก (เช่น `../../../`)**: เนื่องจากทำให้โปรเจกต์พังง่ายเมื่อมีการย้ายโมดูล
2. **บังคับใช้ Absolute Path Alias (`@/src/...`)**: ทุกโมดูลภายใต้ `src/` ต้องระบุการนำเข้าผ่าน `@/src/modules/` หรือ `@/src/components/` เสมอ เพื่อรักษาความสถียรของสถาปัตยกรรมเมื่อย้ายโฟลเดอร์ (R1 Reversibility Gate)

## 3. Knowledge Relationships
- Depends On (must read): [[system-architecture.md]], [[nextjs-frontend/refactoring-history.md]]
- Impacted By (changes affect): สถาปัตยกรรมโมดูลหลัก การประกาศ Path ใน `tsconfig.json` และการจัดการ Routing ภายใน Next.js App Router (Client Components)
- Real-world Cases: [[fsd-update-modal-refactoring.md]], [[lessons-learned/bugs-and-fixes.md#bug-019]]

