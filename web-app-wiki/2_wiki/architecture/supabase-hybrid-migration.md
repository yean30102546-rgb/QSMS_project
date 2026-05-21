# Supabase Hybrid Migration — QSMS Backend Shift
[วันที่อัปเดต: 2026-05-21]

## 1. Summary — หัวใจสำคัญ
ระบบได้เปลี่ยนผ่านสถาปัตยกรรม Backend จากเดิมที่ใช้ Google Sheets 100% มาเป็นการใช้ **Supabase (PostgreSQL)** เป็นฐานข้อมูลหลัก เพื่อเพิ่มความเร็วในการ Query และจัดการข้อมูลที่ซับซ้อน โดยใช้โมเดล **Hybrid Storage** เพื่อประหยัดพื้นที่จัดเก็บ

## 2. Hybrid Architecture Model
สถาปัตยกรรมแบ่งการเก็บข้อมูลตามประเภททรัพยากร (Resource Types):
- **Transactional Data (Supabase):** 
    - เก็บข้อมูลตัวอักษร, ตัวเลข, สถานะ, และความสัมพันธ์ (Relational)
    - ตาราง: `rework_cases`, `rework_items`, `roster_employees`, `roster_overrides`, `roster_leaves`
    - **ทำไม?**: ความเร็วสูง, รองรับการขยายตัว, มีระบบ Transaction
- **Media Assets (Google Drive):**
    - เก็บรูปภาพประกอบหลักฐาน (Compressed Images)
    - ยังคงใช้ **Google Apps Script (GAS)** เป็นทางผ่านในการบันทึกรูปเข้า Drive
    - **ทำไม?**: หลีกเลี่ยงขีดจำกัด 1GB ของ Supabase Free Tier และรักษาระบบการดูรูปผ่าน Folder เดิม

## 3. Data Flow (Data Integration)
1. **Frontend:** ส่งรูปภาพไปที่ `/api/rework` พร้อม `action: 'uploadImage'`.
2. **Next.js Proxy:** ส่งต่อ Base64 ไปยัง GAS Web App.
3. **GAS:** บันทึกรูปใน Google Drive และส่ง **Drive URL** กลับมา.
4. **Next.js API:** รับข้อมูลเคสพร้อม Drive URL บันทึกลงใน **Supabase**.

## 4. SQL Schema V2 Highlights
ตารางถูกออกแบบมาให้รองรับข้อมูลครบ 100% ตาม Google Sheets เดิม:
- **`JSONB` Columns:** ใช้สำหรับเก็บรายการวัสดุ (`materials`) และ Array ของลิงก์รูปภาพ เพื่อความยืดหยุ่น
- **Cascade Deletes:** ลบพนักงานแล้วตารางเวรและวันลาหายอัตโนมัติ
- **Indexing:** เพิ่มประสิทธิภาพการค้นหาด้วย `idx_rework_cases_status` และ `idx_roster_overrides_date`

## 5. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — ยังต้องใช้สำหรับ Image Storage
- **Impacts**: [[nextjs-frontend/rework-module.md]] — การดึงข้อมูลเปลี่ยนจาก GAS เป็น Supabase
- **Impacts**: [[nextjs-frontend/roster-module.md]] — ความเร็วในการโหลดปฏิทินเพิ่มขึ้นอย่างมาก

---
> 🔄 *สร้างเมื่อ 2026-05-21*: สรุปการย้ายระบบเข้าสู่ Supabase แบบ Hybrid Architecture
