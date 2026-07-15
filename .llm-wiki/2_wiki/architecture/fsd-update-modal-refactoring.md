# FSD Architecture Refactoring (UpdateModal)

## บริบทและความเป็นมา
`UpdateModal.tsx` เดิมทีถูกออกแบบมาเป็น Monolithic Component ไฟล์เดียว (ความยาวกว่า 1,500 บรรทัด) ซึ่งรวมเอาลอจิกของการจัดการ State (ข้อมูลเคส, สิทธิ์การใช้งาน, ลอจิกการคำนวณ, ระบบอัปโหลดรูปภาพ) รวมไปถึง UI ทั้งแบบอ่าน (View) และแบบแก้ไข (Edit) ไว้ด้วยกันทั้งหมด
การทำงานในรูปแบบนี้สร้างปัญหาเรื่อง Code Readability, ความซับซ้อนในการจัดการ TypeScript และก่อให้เกิด Bug ที่แก้ไขได้ยาก (Regression Bugs) เมื่อโปรเจคขยายตัวตามแนวทางการพัฒนาแบบระบบปิด (Enterprise Engineering Guidelines)

เพื่อแก้ไขปัญหานี้และบังคับให้เกิดความเสถียร (Stability) ระบบจึงได้ปรับปรุงสถาปัตยกรรมของ `UpdateModal` ใหม่ ให้อยู่ในโครงสร้างแบบ **FSD (Feature-Sliced Design)** อย่างเข้มงวด

---

## โครงสร้าง FSD ใหม่
โฟลเดอร์หลัก: `src/modules/rework/components/UpdateModal/`

ประกอบด้วยไฟล์ย่อย 4 ไฟล์ ดังนี้:

### 1. `UpdateModalContext.tsx`
รับผิดชอบเรื่อง **State Management, API, และ Business Logic**
- **บทบาท**: ทำหน้าที่เป็น Headless Controller (ไม่มี UI) โดยทำการห่อหุ้ม `useUpdateModal` Custom Hook และ Context Provider (`UpdateModalProvider`)
- **ข้อมูลที่จัดการ**: ดึงและกำหนดค่าเริ่มต้นจาก Props (เช่น `caseData`), จัดการสถานะสิทธิ์แบบ RBAC (`isAdmin`, `isFinance`), การอัปโหลดหลักฐาน/ลบข้อมูลเคส, ลอจิกการคำนวณ (เช่น แปลงวันเดือนปี, คำนวณค่าแรง)
- **ประโยชน์**: แยกลอจิกคำนวณที่หนักหน่วงออกไป ทำให้โค้ดสะอาดและทดสอบได้ง่ายขึ้น (TDD-friendly)

### 2. `UpdateModalView.tsx`
รับผิดชอบเรื่อง **Read-Only UI (Presentation Layer)**
- **บทบาท**: แสดงผลข้อมูล (View Mode) ของเคสที่เลือก
- **การทำงาน**: ดึงข้อมูลและฟังก์ชันจาก `useUpdateModal()` มาแสดง เช่น ตาราง `Detail Section`, ไทม์ไลน์สถานะเคส, รวมไปถึงปุ่ม `ExportPDF`, `ExportExcel` และโชว์รูปภาพในรูปแบบ `DriveImage`
- **ประโยชน์**: ทำให้สามารถโฟกัสเรื่อง Design Aesthetics และ UX/UI ได้อย่างเต็มที่ โดยไม่ถูกรบกวนจากลอจิกแบบฟอร์ม

### 3. `UpdateModalEdit.tsx`
รับผิดชอบเรื่อง **Interactive Forms (Edit Mode)**
- **บทบาท**: หน้าฟอร์มแบบแก้ไขข้อมูล (Interactive Elements)
- **การทำงาน**: รับผิดชอบเรื่อง Form Validation, การเปลี่ยนแปลงข้อมูล Material, การแก้ไขค่าใช้จ่าย/แรงงาน, การอัปโหลดรูปภาพหลักฐานเพิ่ม และการเปิดหน้าจอเพื่อบันทึกการกระทำ (Transaction Handling)
- **ประโยชน์**: แยกความเสี่ยงในการทำให้ UI พังออกจาก View Mode ได้ชัดเจน

### 4. `index.tsx`
รับผิดชอบเรื่อง **Component Orchestration (Entry Point)**
- **บทบาท**: เป็นจุดศูนย์รวมและเชื่อมโยง Components เข้าด้วยกัน
- **การทำงาน**: ครอบ `UpdateModalProvider` ให้กับ Children และเป็นตัวสลับระหว่าง `UpdateModalView` หรือ `UpdateModalEdit` ตามสถานะ `isEditMode` 
- **ตัวอย่างการเรียกใช้**: ภายนอกจะสามารถเรียกใช้ `<UpdateModal isOpen={...} caseData={...} />` ได้โดยไม่ต้องสนว่าภายในแบ่งเป็นไฟล์ย่อยกี่ไฟล์ 

---

## กลไกความปลอดภัยและ Best Practices ที่ได้รับ
1. **Separation of Concerns (SoC)**: แยกโค้ด UI (JSX) ออกจาก State Logic เด็ดขาด ทำให้แก้ UI ได้โดยไม่ต้องกลัวลอจิกข้อมูลพัง
2. **Path Alias Strictness**: มีการใช้ alias `@/src/...` อย่างเคร่งครัดแทนที่การใช้ `../../` relative path ที่มักทำให้เกิดบั๊กตอนย้ายโครงสร้างโฟลเดอร์ใน Next.js
3. **No 'any' Rule**: ลบล้างการใช้ Type แบบ `any` โดยเฉพาะในตัวรับ Parameter กิจกรรม (Events) ให้ใช้ Type Inference และ Generics อย่างเคร่งครัดตามข้อกำหนด `tsconfig.json`

---

## ขั้นตอนการสร้าง (Reusability Guide สำหรับฟีเจอร์อื่น)
หากในอนาคตพบเจอ Monolithic Component ที่ใหญ่เกิน 500 บรรทัด ให้ยึดแนวทางนี้:
1. วิเคราะห์ State & API Calls แล้วแยกใส่ `[FeatureName]Context.tsx`
2. แยก UI ฝั่งดูข้อมูลเป็น `[FeatureName]View.tsx`
3. แยก UI ฝั่งฟอร์ม/โต้ตอบเป็น `[FeatureName]Edit.tsx`
4. ผูกรวมทุกส่วนใน `index.tsx`
5. กำจัด Relative Imports (เปลี่ยนเป็น `@/src/`)
6. เช็ค Type Safety โดยการรัน `npx tsc --noEmit` ทันทีหลังทำเสร็จ (Reversibility R1)
