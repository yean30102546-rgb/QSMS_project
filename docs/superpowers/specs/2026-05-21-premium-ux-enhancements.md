# Design Spec: Premium Apple UI & Roster Metric View (2026-05-21)

## 1. Overview
ยกระดับความพรีเมียมของระบบผ่านรายละเอียดปลีกย่อย (Micro-interactions) ในระบบ Loading และปรับปรุงหน้าภาพรวม Roster ให้เน้น "ข้อมูลที่ช่วยในการบริหารจัดการ" มากกว่าแค่ตารางเวลา

## 2. Feature Requirements

### 2.1. Premium Apple Loading (v2)
- **Visual details**:
    - **Moving Glow**: เพิ่มแสงวิ่งจางๆ ภายในหลอดโหลด (Indeterminate sweep effect)
    - **Subtle Gradient**: ใช้สีพื้นหลังจากเทาไปดำไล่เฉดเพื่อให้ดูมีมิติ
    - **Dynamic Status Labels**: เปลี่ยนข้อความตามความคืบหน้า (เช่น "Compressing...", "Syncing...")
- **Animation**: ปรับ Timing function ให้เป็น `cubic-bezier(0.23, 1, 0.32, 1)` เพื่อความนุ่มนวลแบบ macOS

### 2.2. Roster Metric View (Summary Upgrade)
- **Columns Replacement**: เปลี่ยนจากตารางปฏิทิน (Heatmap) เป็นตารางสรุปตัวชี้วัด (Metrics)
- **Key Data Points**:
    - **พนักงาน**: แสดงเฉพาะชื่อ (ไม่มี Role/แผนก) พร้อม Smart Alerts (เช่น แจ้งเตือนถ้ายังไม่ตั้งวันเริ่มงาน)
    - **สถานะวันนี้**: Badge บอกสถานะปัจจุบัน (ทำงาน/ลา)
    - **สรุปการลา (เดือนนี้)**: ตัวเลขสรุปยอดลาแยกประเภท (ป่วย/กิจ/พักร้อน)
    - **ความต่อเนื่อง (Retention Bar)**: แถบพลังบอกสัดส่วนการมาทำงานในเดือนนั้น
- **UX**: หน้า Preview ต้องรองรับการ Scroll-down กรณีมีพนักงานจำนวนมาก และหัวตารางต้องคงที่ (Sticky)

## 3. Technical Implementation

### 3.1. Loading Logic
- **`useSaveProgress.ts`**: อัปเดตให้คืนค่า `currentStatus` ตามช่วง % (0-30: Preparing, 30-70: Syncing, 70-90: Finalizing, 100: Done)
- **`AppleProgressBar.tsx`**: เพิ่ม CSS Animation สำหรับ Glow Sweep และ Gradient styling

### 3.2. Roster Metrics Calculation
- **`RosterSummary.tsx`**: 
    - เขียน Logic คำนวณยอดลาสะสมรายเดือนจาก `leaves` array
    - คำนวณสถานะวันนี้โดยใช้ `getCellStatus` ร่วมกับ `todayKey`
    - คำนวณ % การมาทำงาน (Retention)

## 4. Design & Aesthetic
- **Theme**: Minimal Apple Pro (Monochrome)
- **Badges**: ใช้ Soft colors สำหรับสถานะ (Green for work, Rose for sick, Amber for biz, Violet for vacation)

## 5. Success Criteria
- ระบบ Loading ดูมีคุณภาพสูงและลด Cognitive load ของผู้ใช้
- หน้าภาพรวม Roster ให้ข้อมูลที่ "สำคัญและใช้งานได้จริง" (Actionable Insights) ทันทีที่เปิดดู
- ประสิทธิภาพการใช้งานไหลลื่นแม้มีข้อมูลพนักงานจำนวนมาก

---
**Status**: 🟢 Ready for Implementation
