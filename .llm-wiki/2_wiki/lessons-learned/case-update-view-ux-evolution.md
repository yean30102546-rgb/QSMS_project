# CaseUpdateView UX Evolution & Form Parity
[Updated: 2026-08-26]

## 1. Summary
บันทึกบทเรียนและวิวัฒนาการการปรับปรุง User Experience (UX/UI) ของหน้าจอแก้ไขเคส `CaseUpdateView.tsx` ให้มีสัดส่วนสมดุลตามแนวทาง `AddCaseTab` พร้อมระบบบันทึกรายไอเทมแบบโฟกัส (Focus Queue) และแผงแสดงสถานะความคืบหน้าแบบลอย (Floating Save Island)

---

## 2. Problems & Root Causes

1. **Unbalanced Field Widths & Ragged Grid**:
   - การจัดวางเดิมแบบตารางคอลัมน์กว้างเท่ากันทำให้ช่องข้อมูลสั้น (เช่น เลขกล่อง `2`, แม่พิมพ์ `21`, สายผลิต `23`) ถูกยืดกว้างเกินจำเป็น ขณะที่ชื่อสินค้ายาวกลับถูกบีบ
2. **Browser Default Focus Outlines (ขอบดำทึบซ้อนทับ)**:
   - ช่องตัวเลข `amount` มีคลาส `focus:ring-2` แต่ขาด `focus:outline-none` ทำให้เกิด Browser Default Outline สีดำหนาครอบรอบช่องเมื่อคลิก
3. **Action Button Disruptions by Progress Bar**:
   - การนำ `<AppleProgressBar />` ไปแทนที่ปุ่ม `[บันทึกร่าง]` บน Header Bar ขณะกำลังบันทึก ทำให้ปุ่มในแถบ Action กระตุกหายไป และตัวหลอดถูกบีบอัดเหลือ 140px ที่มุมขวาบน มองเห็นยาก

---

## 3. Solutions & Architecture Design

1. **AddCaseTab 4-Block Layout Parity**:
   - **Block 1**: ข้อมูลสินค้า 3 ช่องบน (`Customer`, `Item Number`, `Item Code`) + `Part Name` กว้างเต็มแถว
   - **Block 2 (Highlight Sub-Panel)**: แผงสีเทาอ่อน 5 ช่องสมดุล (`Batch No`, `Gallon Date`, `Mold`, `Line`, `จำนวนกล่อง *` เน้นสี Indigo)
   - **Block 3**: สาเหตุที่พบ & ผู้รับผิดชอบ 2 ช่องคู่ + อาการเสียเต็มแถว
   - **Block 4**: รูปภาพหลักฐาน + ปุ่ม `[💾 บันทึกรายการนี้ ➔ ย้ายลงล่าง]`
2. **Focus Ring Uniformity**:
   - เพิ่ม `focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20` ให้กับทุกอินพุต
   - ซ่อนลูกศร Spinner ด้วย `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`
3. **Floating Island Progress & Top Stripe**:
   - **Top Edge Slim Stripe**: เส้นแสงเรืองแสง 3px ที่ขอบบนสุดของจอ
   - **Floating Island Pill**: กล่อง Dark Glassmorphism ลอยกลางจอด้านล่าง (`bottom-6`) พร้อมแอนิเมชัน `Loader2` ➔ `CheckCircle2` และตัวเลข % เรียลไทม์

---

## 4. Knowledge Relationships
- Depends On: [[nextjs-frontend/rework-module.md]]
- Affects: [[lessons-learned/bugs-and-fixes.md]]
