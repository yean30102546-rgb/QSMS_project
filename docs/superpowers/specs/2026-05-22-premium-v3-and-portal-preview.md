# Design Spec: Premium Apple V3 UI & Roster Portal Preview (2026-05-21)

## 1. Overview
ปรับปรุงส่วนติดต่อผู้ใช้งาน (UI) ให้พรีเมียมยิ่งขึ้นตามสไตล์ Apple V3 และเพิ่มส่วนสรุปข้อมูล Roster ไว้ที่หน้า Portal เพื่อให้ผู้ใช้เห็นภาพรวมกำลังคนได้ทันทีโดยไม่ต้องเข้าสู่โมดูล

## 2. Feature Requirements

### 2.1. Premium Apple Loading V3 (Upgrade)
- **Sleeker Design**: ปรับความหนาของหลอดโหลดลดลงเหลือ **4px** เพื่อความมินิมอล
- **Glassmorphism**: เพิ่มเอฟเฟกต์ Backdrop Blur และความโปร่งใสอ่อนๆ ให้กับพื้นหลังหลอด (Track)
- **Morphing Entry**: ปรับการปรากฏตัวของหลอดโหลดให้มีความนุ่มนวล (Fade-in & Scale) แทนที่ตำแหน่งปุ่มกดแบบไร้รอยต่อ
- **Visual Glow**: ปรับปรุงแสงวิ่ง (Sweep Glow) ภายในหลอดให้ดูนวลตาขึ้น

### 2.2. Roster Portal Preview (New Dashboard Widget)
- **Portal Card Integration**: เพิ่มส่วนแสดงผลสรุปข้อมูลจริงในหน้า `WorkspacePortal.tsx` ภายใต้การ์ด Roster
- **Key Metrics to Display**:
    - **Staff Present Today**: จำนวนพนักงานที่มาทำงานจริงในวันนี้
    - **On Leave Today**: จำนวนพนักงานที่ลางานในวันนี้ (สรุปยอดป่วย/กิจ/พักร้อน)
    - **Retention Indicator**: แถบความต่อเนื่องของการมาทำงานเฉลี่ยของทั้งทีมในเดือนนั้น
- **Live Data**: ดึงข้อมูลจริงจาก `fetchRosterMonth` มาประมวลผลและแสดงผลแบบ Real-time บน Portal

## 3. Technical Implementation

### 3.1. AppleProgressBar V3
- แก้ไข `src/components/ui/AppleProgressBar.tsx`
- ปรับ Tailwind classes: `h-[4px]`, `bg-black/5`, `backdrop-blur-sm`
- อัปเกรด Framer Motion transitions ให้ใช้ `stiffness: 100`, `damping: 30` สำหรับ morphing effect

### 3.2. Portal Data Enhancement
- แก้ไข `src/components/apps/portal/WorkspacePortal.tsx`
- เพิ่ม Logic ใน `useEffect` เพื่อคำนวณ:
    - วนลูปหาพนักงานที่ "ทำงาน" และ "ลา" ในวันที่ปัจจุบัน (Today)
    - สรุปยอดรวมเพื่อแสดงในการ์ด
- อัปเดต JSX ส่วน `rosterStats` ให้แสดง UI ที่พรีเมียมขึ้นตามสไตล์ Metric View ที่ออกแบบไว้

## 4. Design & Aesthetic
- **Loading**: "Less is More" - เน้นความบางและแสงเงาที่นุ่มนวล
- **Portal Preview**: "Actionable Metrics" - ใช้ Badge สี (Green/Rose/Violet) เพื่อให้สื่อความหมายได้ทันทีที่มอง

## 5. Success Criteria
- ระบบ Loading ดูหรูหราและมีความเป็นมืออาชีพสูงขึ้น
- หน้า Portal ให้ข้อมูลสำคัญของทีม Roster ได้ครบถ้วนและแม่นยำ (อ้างอิงข้อมูลจริง)
- ประสิทธิภาพการโหลดหน้า Portal ยังคงรวดเร็ว

---
**Status**: 🟢 Ready for Implementation
