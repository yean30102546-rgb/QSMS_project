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

### Case Update View, 4-Block Architecture & Accordion Queue Flow (`CaseUpdateView.tsx`)
- **Responsive 2-Tier Header**: แยกแถบย้อนกลับและชื่อเคส (แถวบน) กับแถบปุ่มส่งออก Excel, ลบเคส และบันทึกร่าง (แถวล่าง) ป้องกันปุ่มซ้อนทับกันบนมือถือ
- **AddCaseTab 4-Block Layout Parity**: แบบฟอร์มไอเทมใน Step 1 จัดระเบียบเป็น 4 บล็อกชัดเจน:
  - **Block 1 (ข้อมูลสินค้าหลัก)**: 3 คอลัมน์สมดุล (ลูกค้า, รหัสสูตร, รหัสสินค้า) + ชื่อรายการเต็มความกว้าง
  - **Block 2 (แผงไฮไลท์ข้อมูลการผลิต)**: Sub-panel ไฮไลท์โทนเทาอ่อน 5 คอลัมน์ (หมายเลขล็อต, วันที่ผลิตแกลลอน, Mold, Line, จำนวนกล่อง * เน้นสี Indigo)
  - **Block 3 (สาเหตุที่พบ & ผู้รับผิดชอบ)**: 2 ช่องคู่ (สาเหตุหลัก+ย่อย และ ผู้รับผิดชอบ+แผนกย่อย) + ช่องอาการเสียเต็มความกว้าง
  - **Block 4 (รูปภาพหลักฐาน & ปุ่มบันทึกรายไอเทม)**: รูปภาพพรีวิวพร้อมปุ่ม Lightbox + ปุ่ม `[💾 บันทึกรายการนี้ ➔ ย้ายลงล่าง]`
- **Focus Ring Uniformity**: ช่องตัวเลขและอินพุตทุกช่องมีสไตล์โฟกัสขอบเรืองแสงสีม่วงคราม Indigo ละมุนตาเป็นมาตรฐานเดียวกัน (`focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`) และซ่อน spinner ลูกศรตัวเลข
- **Accordion Lifecycle & Auto-Expand Queue**:
  - เมื่อเปิดเข้ามา ระบบจะเปิดเฉพาะการ์ดแรกที่ยังทำไม่เสร็จ (First Incomplete Item) ส่วนรายการที่เสร็จแล้วจะพับเก็บเป็นค่าเริ่มต้น
  - **Per-Item Save Flow (`handleSaveSingleItem`)**: เมื่อกดบันทึกรายการ ระบบจะอัปโหลดรูปของไอเทมนั้น บันทึกลง Supabase พับการ์ด ย้ายรายการลงไปล่างสุด และเปิดการ์ดถัดไปที่ยังค้างอยู่ให้อัตโนมัติ
- **Item Header Badges**: หัวการ์ดไอเทมแสดงสถานะความสมบูรณ์ (`🟢 ✓ ข้อมูลสมบูรณ์`, `🟡 ⚠️ อัปเดตแล้ว`, `⚪ ⏳ รอตรวจสอบ`) พร้อมระบุจำนวนกล่อง สาเหตุ และผู้รับผิดชอบ
- **Floating Save Progress Island & Top Stripe**:
  - แถบเส้นแสงเรืองแสง 3px บนสุดของจอ (Top Edge Glowing Stripe)
  - กล่อง Dynamic Island ลอยกลางจอด้านล่าง (`fixed bottom-6 left-1/2`) แสดงสถานะการบันทึกแบบ Real-time พร้อม % และไอคอนเคลื่อนไหว ไม่ทำให้ปุ่ม Header กระตุกหายไป


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


