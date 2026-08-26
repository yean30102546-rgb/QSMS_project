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

### Mobile-First Card Layout (`CaseListTable.tsx`)
- **การจัดสัดส่วนบนหน้าจอมือถือ (iPhone / iOS Safari)**:
  - ยกเลิก 3 คอลัมน์แนวนอนแบบเดิมเพื่อป้องกันข้อความตัดบรรทัดหลายชั้น
  - ส่วนหัวการ์ด: รหัสเคส (`RW012-2026` / `RT012-2026`) พร้อมป้ายเตือนงานค้าง 7 วัน / เกิน 30 วัน / ขาดไฟล์ OR / รอของ
  - ส่วนเนื้อหา: ชื่อสินค้าแสดงผลเต็มความกว้าง (Full-width)
  - ส่วนล่าง: แสดงวันที่, แหล่งที่มา (SFC/Customer), ลูกค้า, ยอดผลิตรวม, หลอด Progress Bar, สาเหตุ และป้ายสถานะ (Status Pill) จัดเข้ามุมอย่างสวยงาม
- **Bottom Clearance & Floating FAB**:
  - `OverallTab.tsx` กำหนด Padding ด้านล่าง `pb-28 sm:pb-8` เพื่อให้เลื่อนดูรายการเคสล่างสุดและแถบ Pagination ได้สะดวก
  - ปุ่ม **DocAI Assistant** ถูกปรับเป็น Floating Action Button (FAB Icon) กะทัดรัดที่มุมขวาล่าง (`bottom-20 right-4 sm:bottom-6 sm:right-6`) ไม่บดบัง Pagination

### Case Update View & Accordion Architecture (`CaseUpdateView.tsx`)
- **Responsive 2-Tier Header**: แยกแถบย้อนกลับและชื่อเคส (แถวบน) กับแถบปุ่มส่งออก Excel, ลบเคส, บันทึกร่าง และบันทึกเสร็จสิ้น (แถวล่าง) ป้องกันปุ่มซ้อนทับกันบนมือถือ
- **Item Accordion Folding**: รายการสินค้าทั้งหมดจะพับเก็บเป็นค่าเริ่มต้น (Default Folded) เพื่อลดความยาวของหน้าจอเมื่อมีสินค้าหลายรายการ พร้อมปุ่มสลับ "ขยายข้อมูลทั้งหมด / พับข้อมูลทั้งหมด"
- **Item Header Badges & Quick Inputs**: หัวการ์ดไอเทมระบุยอดผลิต (`ยอดเสร็จ: X / Y กล่อง`) พร้อมปุ่มลัด `[เสร็จแล้ว]` และป้ายเตือนรูปภาพ

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

## 5. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — สิทธิ์และการยืนยันตัวตน (QSMS Admin / Operator)
- **Depends On**: [[nextjs-frontend/roles.md]] — การคุมสิทธิ์การแก้ไขและระดับ Role
- **Depends On**: [[architecture/system-architecture.md]] — การทำงานร่วมกับ Supabase Database
- **Affects**: [[lessons-learned/bugs-and-fixes.md]] — บันทึกประวัติการแก้บั๊ก UI/UX บนมือถือ (BUG-028, BUG-029)


