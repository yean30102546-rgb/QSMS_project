# Design Spec: Apple-Style Progress Loading (2026-05-21)

## 1. Overview
เพิ่มระบบ **Determinant Progress Loading** (หลอดโหลดแบบบอกเปอร์เซ็นต์) สำหรับสถานะ "Holding" ระหว่างที่ระบบกำลังบันทึกข้อมูล (Save) เพื่อเพิ่มความมั่นใจให้กับผู้ใช้งาน (UX) โดยใช้สไตล์การออกแบบที่นุ่มนวลและพรีเมียมแบบ Apple

## 2. Feature Requirements

### 2.1. Determinant Progress Bar
- **สไตล์**: แถบแคปซูลบางเฉียบ (Height: 6px) ขอบมน (Rounded-full)
- **สี**: แถบความคืบหน้าสีดำสนิท (#1d1d1f) บนพื้นหลังเทาจาง (#f2f2f7)
- **ความคืบหน้า (Progress)**: ค่อยๆ เพิ่มขึ้นจาก 0% ถึง 100% ตามสถานะการทำงานจริง (หรือจำลองกรณี Async)
- **ข้อความ**: แสดง "กำลังบันทึกข้อมูล..." พร้อมตัวเลข % ด้านบนแถบ

### 2.2. Interaction & Logic
- **Trigger**: แสดงผลเมื่อผู้ใช้กดปุ่ม "บันทึก" (Save) ใน Modal หรือ Form
- **Transition**: แถบโหลดจะปรากฏขึ้นมาแทนที่ตำแหน่งของปุ่ม Action เดิม (Button Replacement) เพื่อป้องกันการกดซ้ำ (Double Submission)
- **Completion**: เมื่อโหลดถึง 100% และระบบบันทึกสำเร็จ ให้แสดงสัญลักษณ์ Checkmark (✔) สีเขียว และปิด Modal อัตโนมัติ (หรือตาม Workflow เดิม)
- **Animation**: ใช้ความเร็วแบบ `cubic-bezier(0.4, 0, 0.2, 1)` เพื่อความพรีเมียม

## 3. Technical Implementation

### 3.1. Reusable Component
- สร้างคอมโพเนนต์ `AppleProgressBar.tsx` ภายใต้ `src/components/ui/`
- รองรับ props: `progress` (number 0-100), `isComplete` (boolean), `label` (string)

### 3.2. State Management
- เพิ่มสถานะ `savingProgress` (number) และ `isSaving` (boolean) ในหน้าต่างที่เกี่ยวข้อง (เช่น `UpdateModal.tsx`, `AddCaseTab.tsx`)
- จำลองการวิ่งของหลอดระหว่างรอ API response (เช่น วิ่งไปถึง 90% แล้วรอจนกว่าจะ 100% เมื่อได้ response)

### 3.3. Integration Points
- **`UpdateModal.tsx`**: แทนที่ปุ่ม "บันทึกการเปลี่ยนแปลง" ระหว่าง Saving
- **`AddCaseTab.tsx`**: แทนที่ปุ่ม "บันทึกข้อมูลเข้าสู่ระบบ" ระหว่าง Saving
- **`RosterDialogs.tsx`**: แทนที่ปุ่ม "บันทึกการลา" ระหว่าง Saving

## 4. Design & Aesthetic
- **Theme**: Minimal Monochrome / Apple Pro
- **Typography**: ใช้ Font 'Inter' หรือ 'Sarabun' (Medium weight) สำหรับข้อความสถานะ

## 5. Success Criteria
- ผู้ใช้เห็นความคืบหน้าในการบันทึกข้อมูลชัดเจน
- ไม่สามารถกดปุ่มบันทึกซ้ำได้ระหว่างที่ระบบกำลังทำงาน
- อนิเมชั่นไหลลื่น ไม่กระตุก และเข้ากับธีมหลักของระบบ

---
**Status**: 🟢 Ready for Implementation
