# Rework Module — QSMS
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Module หลักของระบบ อยู่ที่ `src/modules/rework/ReworkApp.tsx`
มี 3 Tab หลัก: **Overall** (ดูเคส) | **Add Case** (เพิ่มเคส) | **Dashboard** (Analytics)
ระบบดึง/บันทึกข้อมูลผ่าน `/api/rework` (Next.js server-side API) ซึ่งทำหน้าที่เป็น Hybrid storage ประสานงานระหว่าง Supabase (เพื่อสืบค้นข้อมูลรวดเร็ว) และ GAS/Google Sheets (เพื่อทำ LINE notifications/จัดเก็บข้อมูลหลัก)

## 2. Tab Structure & Workspace Portal Integration
```
ReworkApp.tsx
├── Tab: ภาพรวม (Overall)     → แสดงรายการเคสทั้งหมด, ค้นหา, คลิกเปิด Modal (ปรับปรุงการจัดลำดับ Typography UX)
├── Tab: เพิ่มงานใหม่ (Add Case) → ฟอร์มเพิ่มเคส, หลาย items ต่อ 1 เคส, อัปโหลดรูป
└── Tab: Dashboard              → Analytics: Total, Pending, Completion Rate, Defect Chart
```

### Workspace Portal Live Preview Card
การรวมข้อมูลเข้ากับศูนย์ควบคุมกลาง (**ศูนย์ควบคุมกลาง - Workspace Portal**):
- **Dynamic Stats Retrieval**: ดึงข้อมูลและคำนวณสถิติจริงจาก Supabase Database แบบ Real-time
- **Segmented Progress Bar**: แสดงแถบสัดส่วนสีกำหนดตามสถานะงาน:
  - `bg-amber-400`: รอดำเนินการ (Pending)
  - `bg-sky-400`: กำลังดำเนินการ (In-Progress)
  - `bg-violet-400`: รอประเมินราคา (Awaiting Valuation)
  - `bg-emerald-500`: เสร็จสิ้น (Completed)
- **Status Legend Grid**: แผงแสดงจำนวนแยกตามสถานะ และเปอร์เซ็นต์ความเสร็จสิ้นจริง (Real Completion Rate)

## 3. Data Schema & Syncing (Updated 2026-05-21)
ข้อมูลเคสและรายการ (items) รองรับฟิลด์ระดับ item ดังนี้:
- `customerName` (ลูกค้า): เช่น Eneos, BCP, OR (รองรับการตั้งค่ายืดหยุ่นราย item)
- `batchNo` (Batch number): เลขการผลิตราย item
- `packagingDate` (วันบรรจุ): วันที่ผลิตบรรจุ
- `mold` (แม่พิมพ์): หมายเลขหรือชื่อโมลด์
- `uid` (Unique ID): รหัสเฉพาะของ item เพื่อการทำ syncing อย่างถูกต้องระหว่าง Supabase และ Sheets

**Sync Behavior:**
- เมื่อเพิ่มเคสใหม่ หรืออัปเดตสถานะ/บันทึกข้อมูลแก้ไข ข้อมูลจะถูก proxy ไปยัง GAS เพื่อบันทึกลง Google Sheets และส่งรูปภาพ/เอกสารขึ้น Google Drive ก่อน
- ข้อมูลที่อัปเดตจาก GAS (เช่น URL โฟลเดอร์/ลิงก์รูปภาพ/ลิงก์เอกสาร OR) จะถูกบันทึกคู่กับฟิลด์ทั้งหมดลงใน Supabase ตาราง `rework_cases` และ `rework_items`
- บันทึกการแก้ไข (Audit log) จะถูกเก็บใน `rework_logs`

## 4. Smart Item Verification (V2)
ระบบตรวจสอบข้อมูลสินค้าอัตโนมัติได้รับการปรับปรุงให้ฉลาดและยืดหยุ่นขึ้น (Smart Verification):
- **Last-Edited Priority**: ระบบจะติดตามการแก้ไขฟิลด์รหัสสินค้าผ่าน `lastActiveField` state ('itemNumber' หรือ 'itemCode')
- **Priority Rules**: เมื่อคลิกปุ่ม "ตรวจสอบข้อมูลสินค้า" (Check Data) หรือเมื่อ Blur ฟิลด์ ระบบจะใช้ค่าจากฟิลด์ล่าสุดที่ถูกแก้ไขเป็นหลักในการค้นหา หากฟิลด์นั้นว่างจะสลับไปใช้ค่าจากอีกฟิลด์หนึ่งเป็น Fallback
- **Unified Query**: API handler (`verifyItem` ใน `/api/rework`) จะสืบค้นตาราง `rework_master_items` บน Supabase โดยใช้เงื่อนไข OR (`item_number` หรือ `item_code` ตรงกับค่าที่สืบค้น)
- **Auto-Fill Sync**: เมื่อพบข้อมูลสินค้า ระบบจะทำการอัปเดตและเขียนทับฟิลด์ข้อมูลสินค้าทั้งหมดในแถวนั้นโดยอัตโนมัติ ได้แก่:
  - `itemNumber`
  - `itemCode`
  - `itemName`
- **UI/UX (Search Cluster)**: รวมฟิลด์ `Item Number` (Barcode) และ `Item Code` เข้าด้วยกันเพื่อความสะดวก พร้อมแสดงสถานะ border เน้นตามลำดับฟิลด์ล่าสุดที่มี Priority

## 5. Retroactive OR Files Upload
- หากทุกรายการในเคสมีลูกค้าระบุเป็น `"OR"` (เช่น `editedItems.every(i => i.customerName === 'OR')`) ระบบจะแสดงอินพุตอัปโหลดเอกสาร OR ทันทีใน `UpdateModal` แม้ไม่ได้อยู่ในโหมด Edit ก็ตาม
- ผู้ใช้ (ระดับ Operator, Finance, Admin) สามารถเลือกไฟล์และกดบันทึกเพื่อแนบไฟล์ตามหลังได้ทันที โดยจะ sync ขึ้น Google Drive และบันทึก URL ลงฐานข้อมูล

## 6. Timezone Management (+07:00)
- เวลาและ Timestamp ทั้งหมดในระบบอ้างอิงเขตเวลา `Asia/Bangkok` (+07:00)
- การสร้างและอัปเดตข้อมูลบน API Server จะคำนวณและจัดรูปแบบเป็น ISO string พร้อม timezone offset `+07:00` (ผ่าน `getBangkokISOString`) เพื่อให้ตรงกันทั้งฝั่ง Supabase และ Google Sheets
- ฟังก์ชัน `formatThaiDateShort` ใน `helpers.ts` ป้องกันปัญหาวันเลื่อน (Day shifting) สำหรับผู้ใช้นอกเขตเวลา Bangkok โดยแยกแยะและประมวลผลวันในรูปแบบ YYYY-MM-DD ตรงๆ โดยไม่แปลง offset ย้อนหลัง

## 7. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — การทำ Sync / Google Drive uploads
- **Depends On**: [[google-sheets/schema.md]] — โครงสร้างชีตที่อัปเดต
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — สิทธิ์และการยืนยันตัวตน
- **Depends On**: [[nextjs-frontend/roles.md]] — การคุมสิทธิ์การแก้ไขและระดับ Role
- **Affects**: [[architecture/supabase-hybrid-migration.md]] — Migration V3 ที่เพิ่มฟิลด์ระดับ item


