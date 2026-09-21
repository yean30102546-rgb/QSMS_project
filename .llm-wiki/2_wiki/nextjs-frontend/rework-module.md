# Rework Module — QSMS
[วันที่อัปเดต: 2026-08-20]

## 1. Summary & Current Implementation
Module หลักของระบบ อยู่ที่ `src/modules/rework/ReworkApp.tsx`
มี 3 Tab หลัก: **Overall** (ดูเคสและรายการ) | **Add Case** (เพิ่มเคสใหม่) | **Dashboard** (Analytics)
ระบบดึงและบันทึกข้อมูลผ่าน `/api/rework` (Next.js server-side API) ซึ่งเชื่อมต่อโดยตรงกับ **Supabase Database (PostgreSQL)** และจัดการรูปภาพหลักฐานผ่าน **Cloudinary** (Unsigned Upload ฝั่ง Client บีบอัดเป้าหมาย 300KB)

## 2. Tab Structure & Mobile-First Responsive Layout
```
ReworkApp.tsx
├── Tab: ภาพรวม (Overall)     → แสดงรายการเคสทั้งหมด, ค้นหา, กรองขั้นสูง, Pagination, Mobile-First Card Layout
├── Tab: เพิ่มงานใหม่ (Add Case) → ฟอร์มเพิ่มเคส, Multi-item ต่อ 1 เคส, บีบอัดรูปภาพ, OR Attachments
└── Tab: Dashboard              → Analytics: Total, Pending, Completion Rate, Defect Chart, Workload by Source
```

### Apple Pro Minimal Industrial Redesign (`CaseListTable.tsx`, `CaseUpdateView.tsx`, `AddCaseTab.tsx`)
- **Apple Parchment Canvas**: เปลี่ยนพื้นหลังหลักเป็นโทนเทานวลตา `#F5F5F7` พร้อมการ์ดสีขาวบริสุทธิ์ `#FFFFFF` ขอบบาง 1px Hairline (`#E5E5E7`)
- **Action Blue Accent**: ใช้สี `#0071E3` เป็นปุ่มแอ็กชันหลักจุดเดียว ตัดสีนีออนและเงา Glow หนาเตอะออกทั้งหมด
- **Apple Inset Cards (`CaseListTable.tsx`)**: เน้น 3 ข้อมูลหลัก (รหัสเคส, ชื่อสินค้า, หลอดความคืบหน้ายอดกล่องเสร็จ/รวม) ซ่อนชิปย่อยเพื่อลด Cognitive Overload
- **Apple Segmented 3 Tabs (`CaseUpdateView.tsx`)**: ตัดแถบ Sidebar แนวดิ่งขนาด 280px ออก แล้วแทนที่ด้วยแถบ Segmented Capsule 3 แท็บด้านบน:
  1. `ภาพรวม & ยอดกล่อง`: อัปเดตยอดกล่องเสร็จ, รายงานวัสดุขาด (กล่อง/แกลลอน/น้ำมัน) และปัญหาหน้างาน (Defend)
  2. `รายการสินค้า & รูปภาพ`: รายการสินค้าแบบ Accordion พร้อมภาพหลักฐาน
  3. `ตรวจ QC & เอกสาร`: ตรวจปล่อยผ่าน 100%, ใบเบิกภาชนะ และส่งออก Excel
- **Clean Form Initiation (`AddCaseTab.tsx`)**: ตัดแถบ 5 ขั้นตอนที่ซ้ำซ้อนออก และใช้ Segmented Capsule สลับระหว่างเคส RW (โรงงาน) และ RT (ลูกค้า) อย่างเรียบง่าย



## 3. Data Schema & Dynamic Auto-Status Lifecycle
- `customerName` (ลูกค้า): เช่น Eneos, BCP, OR (รองรับการตั้งค่ายืดหยุ่นราย item)
- `batchNo` (Batch number): เลขการผลิตราย item (จัดเก็บในฟอร์แมต `DD/MM/YYYY`)
- `packagingDate` / `gallonDate` (วันผลิตแกลลอน): วันที่ผลิตบรรจุ
- `mold` (แม่พิมพ์): หมายเลขหรือชื่อโมลด์
- `line` (สายการผลิต): สายการผลิต
- `missingBoxes`, `missingGallons`, `missingOil`: ฟิลด์บันทึกอุปสรรค/วัสดุที่ขาด (ล้างค่าอัตโนมัติเมื่อ Completed)
- `completedBoxes`: จำนวนกล่องที่ผลิตเสร็จแล้วรายไอเทม
- `Dynamic Auto-Status`: สถานะของเคสจะถูกคำนวณแบบ Real-time จากยอดกล่องที่ผลิตเสร็จจริง (`completedBoxes`) เทียบกับยอดรวมทั้งหมด (`amount`):
  - `Pending` (รอดำเนินการ): ยอดเสร็จสิ้น = 0%
  - `In-Progress` (กำลังดำเนินการ): ยอดเสร็จสิ้น > 0% และ < 100%
  - `Completed` (เสร็จสิ้น): ยอดเสร็จสิ้น = 100%

## 4. Smart Item Verification & Two-Way Autofill
- **Priority Rules**: ตรวจจับ `lastActiveField` เพื่อค้นหาข้อมูลสินค้าจาก `Item Number` หรือ `Item Code` อัตโนมัติ (Debounce 600ms)
- **Zero-Value Restriction**: ไม่อนุญาตให้ระบุยอดสินค้า (`amount`) หรือจำนวนกล่องเป็น 0 เพื่อป้องกันข้อมูลขยะ
- **Cross-Item Link**: เปิดตัวเลือกเชื่อมโยงสินค้าเปื้อนไปยังสินค้าที่รั่วในเคสเดียวกันผ่านฟิลด์ `linkedSourceId`
- **RT Mandatory Attachments vs RW Instant Creation**:
  - **เคส RT (Customer / ลูกค้า)**: บังคับแนบเอกสารหรือไฟล์อ้างอิงอย่างน้อย 1 ไฟล์ก่อนเปิดเคส (เช่น ใบส่งของ, ใบแจ้งเคลม, ไฟล์ Excel/PDF อ้างอิง) หากไม่มีการแนบไฟล์ ระบบจะไม่ยอมให้เปิดเคส
  - **เคส RW (SFC ภายใน)**: สามารถเปิดเคสได้ทันทีโดยไม่ต้องมีเอกสารแนบ (เอกสารแนบเป็น Optional)

## 5. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — สิทธิ์และการยืนยันตัวตน (QSMS Admin / Operator)
- **Depends On**: [[nextjs-frontend/roles.md]] — การคุมสิทธิ์การแก้ไขและระดับ Role
- **Depends On**: [[architecture/system-architecture.md]] — การทำงานร่วมกับ Supabase Database
- **Affects**: [[lessons-learned/bugs-and-fixes.md]] — บันทึกประวัติการแก้บั๊ก UI/UX บนมือถือ (BUG-028, BUG-029)


