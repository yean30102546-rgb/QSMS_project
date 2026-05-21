# Design Spec: Roster Module Enhancements (2026-05-21)

## 1. Overview
ปรับปรุงโมดูล **Roster** เพื่อเพิ่มความยืดหยุ่นในการจัดการวันลา (Vacation Leave) และยกระดับประสบการณ์ผู้ใช้งาน (UX) ผ่านการออกแบบ Sidebar และหน้าภาพรวม (Summary) ใหม่ตามสไตล์ Minimal Apple Pro และ Industrial Heatmap

## 2. Feature Requirements

### 2.1. Vacation Leave (ลาพักร้อน)
- เพิ่มตัวเลือก **"ลาพักร้อน" (Vacation)** ในระบบบันทึกการลา
- **สีประจำสถานะ**: ม่วง (#8b5cf6)
- อัปเดตข้อมูลระดับ API และ Database (Supabase) ให้รองรับ `leaveType: 'vacation'`

### 2.2. Roster Sidebar UX Improvements
- **Selected State**: เพิ่มอนิเมชั่น (Smooth scale & fade) เมื่อเลือกพนักงาน
- **Styling**: เมื่อพนักงานถูกเลือก ให้ใช้พื้นหลังแบบ **"ถมดำ" (Pitch Black #1d1d1f)** และตัวอักษรสีขาว
- **Labels**: แสดงผลเฉพาะ **ชื่อพนักงาน (Name)** เท่านั้น (ตัด Role และ ID ออก) เพื่อความคลีน
- **Spacing**: ปรับปรุงระยะห่างและขนาดตัวอักษรให้ดูพรีเมียมขึ้น

### 2.3. Roster Summary (Overall View) UX
- **Cell Style**: เปลี่ยนจาก "จุดสี" เป็น **"Full-Cell Color Blocks"** (ระบายสีเต็มช่อง) เพื่อให้อ่านง่ายขึ้น
- **Legend Bar**: เพิ่มแถบอธิบายสัญลักษณ์ (Color Legend) ที่ด้านบนของตาราง
- **Grid Layout**: ปรับปรุง Spacing และใช้ Zebra Stripes (สลับสีแถว) เพื่อความสบายตา

## 3. Technical Implementation

### 3.1. Types & Services
- **`src/modules/roster/types.ts`**: อัปเดต `LeaveRecord` หรือ enum ที่เกี่ยวข้อง
- **`src/services/rosterApi.ts`**: ตรวจสอบการส่งค่า `vacation` ไปยัง GAS/Supabase
- **`src/modules/roster/RosterApp.tsx`**: เพิ่ม `leaveType: 'vacation'` ใน state และ handler

### 3.2. Components
- **`RosterSidebar.tsx`**: แก้ไข Framer Motion logic และ Tailwind classes สำหรับสถานะ selected
- **`RosterSummary.tsx`**: 
    - แก้ไข Table body ให้เรนเดอร์พื้นหลังสีเต็มช่อง (bg-color) แทน `status-dot`
    - เพิ่ม Legend Component ที่ด้านบน
- **`RosterDialogs.tsx`**: เพิ่มตัวเลือก "ลาพักร้อน" ในหน้าต่างระบุเหตุผลการลา

## 4. Design & Aesthetic
- **Theme**: Minimal Monochrome / Apple Pro
- **Typography**: เน้นความหนา (Font Weight) เพื่อแยกแยะชื่อพนักงาน และใช้สี Slate สำหรับข้อมูลรอง
- **Animations**: ใช้ `motion` จาก `motion/react` (Framer Motion) สำหรับการ transition

## 5. Success Criteria
- ผู้ใช้สามารถบันทึก "ลาพักร้อน" และเห็นสีม่วงในตารางได้ถูกต้อง
- Sidebar มีการตอบสนอง (Feedback) ที่ชัดเจนเมื่อคลิกเลือกพนักงาน
- หน้าภาพรวมสามารถอ่านเข้าใจได้ทันทีโดยไม่ต้องจำรหัสสี (ผ่าน Legend) และมองเห็นรูปแบบการทำงานชัดเจนจากบล็อกสี

---
**Status**: 🟢 Ready for Implementation Planning
