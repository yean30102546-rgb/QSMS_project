# Thesis Knowledge Base 03: System Specification

## 1. สถาปัตยกรรม 7 โมดูลหลัก (The 7 Core Modules)

1. **M1: Authentication & Workspace Portal Module**
   - **ขอบเขตโค้ด**: `src/modules/auth/`, `src/app/api/auth/`, `src/modules/platform/`
   - **ฟังก์ชัน**: จัดการ Session Token ผ่าน Secure HTTP-Only Cookie (`auth_token`), ล็อกเอาต์อย่างปลอดภัย, พอร์ทัล Shell ตรวจจับสถานะเครือข่ายออฟไลน์, จัดการ Dynamic App Registry ตาม 6 บทบาท
2. **M2: Closed-Loop Rework MES Module**
   - **ขอบเขตโค้ด**: `src/modules/rework/`, `src/app/api/rework/route.ts`
   - **ฟังก์ชัน**: ควบคุม 4 ขั้นตอน Stepper, จัดการเคส RW/RT, ออกใบเบิกพัสดุ (BOM Requisition Sheet), ฟังก์ชัน Two-Way Handshake ตรวจรับของครบ/ของขาด
3. **M3: Item Master Verification Engine**
   - **ขอบเขตโค้ด**: `src/modules/rework/hooks/useItemVerification.ts`, `src/app/api/rework` (action: `verifyItem`)
   - **ฟังก์ชัน**: ค้นหารหัสสินค้าด่วนผ่านปุ่มแว่นขยาย หรือปุ่ม Enter (On-demand Query), เติมเต็มชื่อ ขนาดบรรจุ และราคาต่อหน่วยอัตโนมัติ, ตรวจจับรหัสสินค้าซ้ำซ้อนในเคสเดียวกัน
4. **M4: Engineering Drawing & Master Specification Vault**
   - **ขอบเขตโค้ด**: `src/modules/storage/`, `src/app/api/drawings/route.ts`
   - **ฟังก์ชัน**: Gemini 3.1 Flash OCR สกัด 11 ฟิลด์ Metadata, แยกฟอร์ม Customer Drawing (7 ฟิลด์) และ Internal Master (8 ฟิลด์), 55/45 Split View & 3D PDF Rotation, ตรรกะคัดเลือก Revision สูงสุดเป็น `is_active = true`, Gap Analysis Missing Master Alert
5. **M5: DocAI Intelligent Technical Assistant**
   - **ขอบเขตโค้ด**: `src/modules/rag/`, `src/app/api/rag/route.ts`
   - **ฟังก์ชัน**: สืบค้นแบบผสมผสาน (Hybrid Vector 768-dim + Full-Text Search), สตรีมมิ่งคำตอบผ่าน Server-Sent Events (SSE), Agentic Function Calling (`get_rework_statistics`), ระบบ Inline Citations
6. **M6: Client-Side Evidence Processing & Digital Reporting Engine**
   - **ขอบเขตโค้ด**: `src/utils/imageCompressionUtils.ts`, `src/services/imageUploadService.ts`, `src/modules/drawings/`
   - **ฟังก์ชัน**: บีบอัดภาพและประทับลายน้ำพิกัด/เวลาผ่าน HTML5 Canvas (~350 KB), ส่งตรงไปยัง Cloudinary CDN (Unsigned) พร้อม Atomic Rollback, สร้างรายงาน ExcelJS ฝังรูปภาพในเซลล์ (ความสูงแถว 90 pt)
7. **M7: Operations Bottleneck Radar & Defend Module**
   - **ขอบเขตโค้ด**: `src/modules/admin/`, `src/app/api/admin/route.ts`, `src/modules/rework/components/DefendModal.tsx`
   - **ฟังก์ชัน**: แดชบอร์ดคำนวณ Workload คั่งค้างข้ามแผนกแบบเรียลไทม์, 1-Click Interactive Filter, Defend Mode สำหรับบันทึกสาเหตุงานสะดุด (รอน้ำมัน/รอเครื่องจักร)

---

## 2. โครงสร้างฐานข้อมูลหลัก (Database Schema Specifications)

### 2.1 Main Supabase Instance (PostgreSQL)
- **`rework_cases`**: เก็บข้อมูลเคสหลัก (`id` PK, `case_name`, `date`, `source`, `customer_name`, `status`, `resolution_method`, `material_requests` JSONB, `blocked_info` JSONB, `material_received_info` JSONB, `qc_approval_info` JSONB, `created_by_role`, `created_by_name`, `created_at`)
- **`rework_items`**: รายการสินค้าในเคส (`id` UUID PK, `case_id` FK, `item_number`, `item_code`, `item_name`, `amount`, `box_number`, `completed_boxes`, `reason`, `responsible`, `batch_no`, `gallon_date`, `mold`, `line`, `linked_source_id`, `image_urls` TEXT[])
- **`item_master`**: ข้อมูลหลักสินค้า (`item_number` PK, `item_code`, `item_name`, `package_size`, `oil_group`, `boxes_per_pallet`, `standard_cost`)
- **`users`**: ข้อมูลผู้ใช้และสิทธิ์ (`id` UUID PK, `email`, `role`, `pin_hash`, `password_hash`, `is_active`, `created_at`)

### 2.2 Dedicated RAG Supabase Instance (PostgreSQL + pgvector)
- **`engineering_drawings`**: สเปกแบบแปลน (`id` UUID PK, `drawing_number`, `revision`, `document_type`, `part_name`, `customer_name`, `item_code`, `item_number`, `package_size`, `oil_group`, `boxes_per_pallet`, `shelf_life`, `file_key`, `is_active` BOOLEAN)
- **`rag_documents`**: เอกสารคู่มือ (`id` UUID PK, `title`, `file_path`, `total_pages`, `created_at`)
- **`rag_document_chunks`**: เวกเตอร์และเนื้อหา (`id` UUID PK, `document_id` FK, `page_number`, `content`, `embedding` VECTOR(768), `metadata` JSONB)
- **`rag_feedback`**: ผลประเมินคำตอบ (`id` UUID PK, `chunk_id` FK, `rating`, `user_comment`, `created_at`)
