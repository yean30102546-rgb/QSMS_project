# 🧠 Knowledge Synthesis & Cross-Module Connections
[วันที่รวบรวม: 2026-05-21]

## 1. The "Blueprint" Pattern (Modularization)
จากการ Refactor โมดูล **Roster** พบว่าโครงสร้างที่เหมาะสมสำหรับ QSMS คือ **Container-Component Pattern** (หรือ Smart/Dumb components):
- **Container**: `RosterApp.tsx` ทำหน้าที่ถือ State, Fetching, และ Logic ใหญ่ๆ
- **Components**: แบ่งย่อยตามหน้าที่ (Header, Controls, Sidebar, Content, Dialogs)
- **Insight**: โมดูล **Rework** (ใน `src/modules/rework/ReworkApp.tsx`) ควรถูก refactor ตามแนวทางนี้เพื่อลด Technical Debt.

## 2. UI Convergence (shadcn/ui)
ปัจจุบันระบบมี "UI Split":
- **Roster**: ใช้ `shadcn/ui` (Modern, Accessible, Standardized)
- **Rework**: ใช้ Legacy Custom UI (Mixed Tailwind, Framer Motion แบบ custom)
- **Connection**: `components/ui/` กลายเป็นจุดเชื่อมต่อสำคัญ (Single Source of Truth สำหรับ UI) แนะนำให้ทยอยย้าย Rework มาใช้คอมโพเนนต์ร่วมกัน เช่น `Table`, `Dialog`, และ `Button`.

## 3. GAS API Pattern Consistency
แม้จะแยกไฟล์ backend (`Code.gs` สำหรับ Rework และ `gas_calendar.gs` สำหรับ Roster) แต่ทั้งคู่ใช้รูปแบบ:
1. `doPost` wrapper พร้อม JWT Validation.
2. Action mapping (insert, update, readAll).
3. Google Sheets as database.
- **Synthesized Knowledge**: เราสามารถสร้าง `BaseGasService` ใน `src/services/` เพื่อลดโค้ดซ้ำซ้อนใน `reworkApi.ts` และ `rosterApi.ts`.

## 4. Shared Data Logic
- **ItemMaster**: ปัจจุบันใช้ใน Rework แต่ในอนาคต Roster อาจต้องการดึงข้อมูลพนักงานจากแหล่งเดียวกัน (Sheet เดียวกัน) เพื่อไม่ให้ชื่อพนักงานซ้ำซ้อน
- **Auth Flow**: ระบบ Login เป็นแบบ Global (Portal Level) ส่งผลให้ Token ที่ได้สามารถสลับไปมาระหว่างโมดูลได้ทันทีโดยไม่ต้อง Login ใหม่

## 5. Potential Conflicts & Risks
- **Tailwind Versioning**: โปรเจกต์ใช้ Tailwind v4 ซึ่งเป็นแบบ CSS-only config หากมีการเพิ่ม Plugin ในอนาคตต้องระวังความเข้ากันได้กับ shadcn
- **Performance**: การแยกคอมโพเนนต์ช่วยเรื่องความสะอาดของโค้ด แต่อาจต้องระวังเรื่อง Re-render หากไม่ได้ใช้ `useMemo`/`useCallback` ในจุดที่เหมาะสม (มีการเริ่มใช้แล้วใน RosterApp).

---

> 🔄 *คอมไพล์ความรู้ล่าสุด*: การ Refactor Roster สำเร็จเป็น "Proof of Concept" ว่าการใช้ shadcn + Modularization ช่วยให้โปรเจกต์สเกลได้ดีขึ้นอย่างเห็นได้ชัด
