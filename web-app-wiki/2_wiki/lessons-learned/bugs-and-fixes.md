# Lessons Learned — Bug Fixes & Known Issues
[วันที่อัปเดต: 2026-05-21]

---

## BUG-001: ItemMaster Verification แสดง "Create New Item" ทุกครั้ง
**Status**: ✅ FIXED (2025-01-15)
**Source**: `1_raw/BUG_FIX_REPORT.md`

### สาเหตุ
- `getItemMaster()` ใน GAS return `success: false` เมื่อชีตไม่มีอยู่
- Frontend ใน `loadMasterData()` process ข้อมูลเฉพาะเมื่อ `success: true` เท่านั้น
- ผล: verification ล้มเหลวแม้ข้อมูลจะมีอยู่จริง

### วิธีแก้
```javascript
// GAS: getItemMaster() — auto-create sheet ถ้าไม่มี, return success: true เสมอ
// Frontend: ใช้ result.data || [] แทนการตรวจ success flag
```

### ไฟล์ที่แก้ไข
- `gas/Code.gs` line 777 — `getItemMaster()` auto-create + return true เสมอ
- `src/App.tsx` line 306 — `loadMasterData()` ใช้ `result.data || []`

---

## BUG-002: รูปภาพไม่ถูกบันทึกลง Google Drive
**Status**: ✅ FIXED (2025-01-15)
**Source**: `1_raw/BUG_FIX_REPORT.md`

### สาเหตุ
- Base64 จาก frontend มี prefix `data:image/jpeg;base64,xxxxx`
- GAS `uploadImageToDrive()` สันนิษฐานว่ามี prefix แล้ว split ผิดพลาด
- หาก error: return empty string โดยไม่แจ้งเตือน

### วิธีแก้
```javascript
// GAS: defensive base64 decode — ตรวจว่ามี comma ก่อน split
// ตรวจสอบทั้ง data URL format และ raw base64
const parts = base64Data.includes(',') ? base64Data.split(',') : ['', base64Data];
const raw = parts[1] || parts[0];
```

### ไฟล์ที่แก้ไข
- `gas/Code.gs` line 921 — `uploadImageToDrive()` defensive decode
- `gas/Code.gs` line 887 — `getOrCreateCaseFolder()` better logging
- `gas/Code.gs` line 405 — `handleInsert()` tracking per image

---

## BUG-003: CORS Error บน readAll แต่ insert ผ่าน
**Status**: ✅ FIXED
**Source**: `1_raw/CORS_FIX_GUIDE.md`

### สาเหตุ
- GAS Error path ไม่ใส่ CORS headers → browser block response
- CORS headers ถูกกำหนดแบบกระจัดกระจายในแต่ละ function

### วิธีแก้ (GAS Pattern — สำคัญมาก!)
```javascript
// ✅ Centralized CORS constant
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "text/plain;charset=utf-8"
};

// ✅ Wrapper function — ทุก response ต้องผ่านนี้
function createCorsResponse(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(CORS_HEADERS);
}

// ✅ ทุก error path ต้องผ่าน createCorsResponse() เสมอ
```

### กฎที่ต้องจำ: GAS CORS Rules
| กฎ | เหตุผล |
|---|---|
| Frontend ส่ง `Content-Type: text/plain` | ป้องกัน CORS preflight |
| GAS return ผ่าน `createCorsResponse()` เสมอ | รับประกัน headers ทุก path |
| Deploy as Web App: Execute as "Me", Access "Anyone" | CORS จะทำงาน |
| ถ้า CORS ยังผิด: สร้าง New Deployment ใหม่ | URL เดิมอาจ cache |

---

## BUG-004: Thai Character Encoding Fix บน Next.js Proxy
**Status**: ✅ FIXED (2026-05-21)
- *Problem*: ตัวอักษรภาษาไทยแสดงผลเป็นเครื่องหมายคำถามหรืออักษรแปลกใน LINE Notification หลังการย้าย API ไปยัง Next.js API Routes (Proxy)
- *Solution*: บังคับเพิ่ม header `Content-Type: application/json; charset=utf-8` ในทุกการตอบกลับประเภท JSON ของ Next.js API router (`NextResponse.json`) เพื่อรักษาการเข้ารหัสอักษร UTF-8 ที่สมบูรณ์

---

## BUG-005: Rework Syncing, Timezones & Item-level Fields
**Status**: ✅ FIXED (2026-05-21)
- *Problem*: ข้อมูลตาราง Google Sheets และ Supabase ไม่สามารถซิงค์คอลัมน์ชื่อลูกค้า/Batch/วันบรรจุ/แม่พิมพ์ ได้อย่างสมบูรณ์เนื่องจากเดิมโมเดลข้อมูลระดับ Case เป็นตัวเก็บคอลัมน์เหล่านี้ร่วมกัน ทำให้เกิดความคลาดเคลื่อนเมื่อมีลูกค้าหรือวันบรรจุหลายแบบในหนึ่งใบงาน รวมถึงมีปัญหาเขตเวลานอก Bangkok ที่ดึงวันที่แล้วเลื่อนถอยหลัง (Day shifting) และการแนบไฟล์เอกสาร OR ย้อนหลังแบบ retroactive ไม่ทำงานเมื่ออยู่นอกโหมด Edit
- *Solution*: 
  1. แยกและปรับเปลี่ยนสกีมาจัดเก็บข้อมูลเหล่านี้ลงเป็นฟิลด์รายรายการ (item-level) ในตาราง `rework_items` และซิงค์กับคอลัมน์แถวใน Sheets ผ่าน Google Apps Script โดยใช้ UID เพื่อตรวจสอบ
  2. บังคับใช้ timezone-aware ISO string (`+07:00`) สำหรับเขตเวลา `Asia/Bangkok` ในฝั่ง API backend เสมอ โดยเปลี่ยนไปจัดรูปแบบผ่าน `Intl.DateTimeFormat` parts เพื่อไม่ให้ขึ้นกับตัววิเคราะห์ locale ของระบบปฏิบัติการเครื่องโฮสต์ (Environment-independent formatting)
  3. ปรับปรุง `formatThaiDateShort` ใน frontend ให้ตรวจสอบและแปลงวันที่ YYYY-MM-DD แบบ direct text parsing หลีกเลี่ยง timezone-offset เลื่อนวันถอยหลัง
  4. ปรับเปลี่ยนเงื่อนไขใน `UpdateModal` ให้เรนเดอร์กล่องแนบไฟล์ OR และยอมให้กดเซฟส่งข้อมูลย้อนหลังได้เสมอหากทุกรายการสินค้าในใบงานเป็น `"OR"` (มีสิทธิ์เข้าถึงตาม Role Permissions)

---

## Console Log Conventions (Debug Guide)
| สัญลักษณ์ | ความหมาย |
|---|---|
| `✓` | Success |
| `✗` | Failure |
| `🔍` | Verification/Investigation |
| `📸` | Image processing |
| `📦` | Sending data |
| `⚠️` | Warning |

> 🔄 *สร้างเมื่อ 2026-05-21*: Ingested จาก `1_raw/BUG_FIX_REPORT.md` และ `1_raw/CORS_FIX_GUIDE.md`

---

## GAS Code Pattern: Original vs Improved (จาก CODE_COMPARISON.md)
**Source**: `archive_docs/CODE_COMPARISON.md`

### Pattern 1: doPost Input Validation
```javascript
// ✅ ตรวจก่อน parse เสมอ
if (!e.postData || !e.postData.contents) {
  return createCorsResponse({ success: false, error: 'No data received' });
}
// ✅ Parse แยก try-catch เพื่อแยก error
try { payload = JSON.parse(e.postData.contents); }
catch (parseError) { return createCorsResponse({ success: false, error: `Invalid JSON: ${parseError}` }); }
// ✅ ตรวจ action field
if (!payload.action) return createCorsResponse({ success: false, error: 'Missing action' });
```

### Pattern 2: handleReadAll — การอ่าน Row แบบ Defensive
```javascript
// ✅ ตรวจ row มี >= 13 columns ก่อน access
if (!row || row.length < 13) { Logger.log(`Skipping row ${i}`); continue; }
// ✅ Numeric value — ใช้ !== undefined แทน || เพื่อป้องกัน 0 หาย
const amount = row[7] !== undefined && row[7] !== null ? row[7] : 0;
// ✅ Image URLs — filter empty strings
const imageUrls = (row[12] || '').toString().split('|').filter(url => url && url.trim() !== '');
// ✅ Row error ไม่ทำให้ทั้ง function ล้มเหลว — ใช้ continue
catch (rowError) { Logger.log(`Error row ${i}: ${rowError}`); continue; }
```

### Pattern 3: Case Status Update Logic
```javascript
// ✅ อัปเดต status ของ Case ตาม item ที่ Completed ล่าสุด
if (existingCase.status !== 'Completed' && row[11] === 'Completed') {
  existingCase.status = 'Completed';
}
```

---

## ItemMaster: คู่มือ Diagnostic (จาก ITEMMASTER_DIAGNOSTIC_GUIDE.md)
**Source**: `archive_docs/ITEMMASTER_DIAGNOSTIC_GUIDE.md`

### Google Sheet ID ที่รู้จาก doc
```
Sheet ID: 1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0
```
> ⚠️ อาจเป็น Sheet สำหรับ dev/test — ตรวจสอบกับ `GAS_WEB_APP_URL` ใน `.env` ก่อนใช้จริง

### สาเหตุที่ ItemMaster ไม่ทำงาน (4 สาเหตุหลัก)
| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| `dataLength: 0` | Sheet ว่าง ไม่มีข้อมูล | ใส่ข้อมูล Row 2+ |
| Header ไม่ตรง | ไม่ใช่ "Item Number" / "Item Name" | แก้ header Row 1 |
| Format ไม่ตรง | มี space หรือ comma ใน ItemNumber | ตรวจ console log |
| Column ผิด | ข้อมูลไม่อยู่ Column A, B | ย้าย column |

### วิธี Debug ด้วย Console
```javascript
// ตรวจ keys ที่ load มาจาก ItemMaster
console.log('Keys:', Array.from(window.__itemMasterMap?.keys?.() || []));
```

### Console Log Pattern ที่ถูกต้อง
```
✓ ItemMaster loaded: 2 items
  Map keys: ["60001001", "100001"]
🔍 Verifying itemNumber: "60001001" { found: true, itemName: "Product 1" }
✓ Item matched: 60001001 → Product 1
```

## BUG-006: ID Mismatch ระหว่าง Supabase และ Google Sheets (GAS)
**Status**: ✅ FIXED (2026-05-21)
- *Problem*: เมื่อกดสร้าง Case ใหม่ Next.js จะส่งข้อมูลไปที่ GAS และ Supabase โดยฝั่ง GAS (Google Sheets) บังคับสร้าง Case ID ใหม่ขึ้นมาเองจากฝั่งระบบเสมอ (เช่น `RW26052120300...`) แต่ Next.js กลับนำ Case ID จากฝั่ง Client (`caseData.id`) ไปบันทึกลง Supabase ทำให้ ID ไม่ตรงกัน ส่งผลให้เมื่อมีการเรียกอัปเดตแก้ไขหรือใส่ทรัพยากรภายหลัง เกิดข้อผิดพลาด `Case ID not found` หรือ `Unknown action`
- *Solution*: ปรับปรุงโค้ดใน Next.js API `src/app/api/rework/route.ts` ที่ case `insertCase` ให้ใช้ Case ID ที่ส่งกลับมาจากฝั่ง GAS (`gasResponse.data?.caseId`) ในการนำไปบันทึกลง Supabase เสมอ เพื่อรับประกันความสอดคล้องของข้อมูล 100%

---

## BUG-007: Image URL Sync Failure on Insert
**Status**: ✅ FIXED (2026-05-21)
- *Problem*: รูปภาพไม่แสดงผลในหน้าต่าง UpdateModal (`Modalupdate`) ของ Rework เนื่องจากระบบไม่สามารถดึงรูปภาพของเคสที่เพิ่งสร้างขึ้นมาแสดงได้ สาเหตุเกิดจาก Google Apps Script (`handleInsert` ใน `gas/Code.gs`) ไม่ยอมส่งคืนลิสต์ของ image URLs และ image folder URL ที่อัปโหลดเสร็จแล้วกลับมาให้ Next.js API ในขั้นตอนที่สร้างเคสใหม่ ส่งผลให้ Next.js บันทึกค่าลง Supabase ในคอลัมน์ `image_urls` ของ `rework_items` เป็นอาร์เรย์ว่าง `[]` เสมอ
- *Solution*: 
  1. แก้ไข `handleInsert` ใน `gas/Code.gs` ให้ส่งคืนอาร์เรย์ `items` ที่มี `imageUrls` (ดึงจาก row ในชีตหรือตอนอัปโหลด) และ `imageFolderUrl` กลับมาในฟิลด์ `data` ของ API response
  2. สร้างสคริปต์ซิงค์รูปภาพ `scratch/sync-images.ts` เพื่อย้อนหลัง (retroactive backfill) รูปภาพจาก Google Drive/Sheets ลงใน Supabase `rework_items` สำหรับเคสเก่าที่ว่างอยู่ทั้งหมด

---

## BUG-008: Case Submission Time Displays 07:00 For All Cases
**Status**: ✅ FIXED (2026-05-22)
- *Problem*: เวลาของเคส Rework ทั้งหมดแสดงเป็น 07:00 เสมอในรายการเคส หน้าต่างแสดงรายละเอียด (UpdateModal) และใบรายงาน (ExportTemplate) สาเหตุเกิดจากระบบใช้ฟิลด์ `caseItem.date` ซึ่งมีเฉพาะข้อมูลวันที่ (เช่น `YYYY-MM-DD`) ในการคำนวณ เมื่อ Javascript Date ทำการ parse จะตั้งเป็น UTC midnight (00:00:00Z) และเมื่อบวกเวลาชดเชยของโซนเวลากรุงเทพฯ (+07:00) จึงแสดงผลเป็น 07:00 ตลอดเวลา
- *Solution*: 
  1. เพิ่มฟิลด์ `timestamp?: string` ในโมเดลและอินเตอร์เฟส `ReworkCase` และทำ mapping ใน `normalizeCases` เพื่อส่งต่อข้อมูล `created_at` (เวลาสร้างเคสจริงจากฐานข้อมูล) มายัง frontend
  2. ปรับปรุงคอมโพเนนต์ `CaseListTable`, `UpdateModal` และ `ExportTemplate` ให้จัดรูปแบบแสดงผลโดยใช้ `timestamp` จริงแทนวันที่ดั้งเดิม (fall back ไปที่ `date` ในกรณีไม่มีค่า)

---

## BUG-009: Gray-on-gray Visual Ambiguity & Layout Squishing in Save Case Progress Bar
**Status**: ✅ FIXED (2026-05-22)
- *Problem*: 
  1. การเรนเดอร์ Progress Bar ภายในปุ่มบันทึกที่ถูก disabled ทับทำให้มี opacity 50% เคลือบจนมองไม่เห็นความคืบหน้า (เกิดปัญหาสีเทาซ้อนสีเทา)
  2. แถบกว้าง `w-48` ใน UpdateModal แคบเกินไปสำหรับตัวหนังสือบอกสถานะยาวๆ ทำให้ตัวอักษรตัดขึ้นบรรทัดใหม่หรือแสดงไม่พอดี
- *Solution*: 
  1. แยกและแทนที่ปุ่มบันทึก/ปุ่มจัดการใน `AddCaseTab` เป็น **Dedicated Progress Card** สแตนด์อโลนเต็มรูปแบบเมื่อกำลังบันทึก ปราศจากการ disabled และรองรับธีมสีสไตล์ Apple
  2. ปรับปรุง `AppleProgressBar` ให้มีขนาด capsule มน `h-2` ปรับโทนสี Gradient และแสงวิ่ง (shimmer sweep gradient) และนำ **Spring physics animation** มาประยุกต์ใช้เพื่อความพรีเมียม
  3. ซ่อนปุ่ม Action อื่นชั่วขณะบันทึกใน `UpdateModal` เพื่อกันการกระทำซ้ำซ้อน และขยายพื้นที่ Progress Bar เป็น `w-72` เพื่อรองรับ text สถานะที่เรียงยาวสวยงาม

---

## BUG-010: Rework System Color Distortion & Solid Logout Overlay Redesign
**Status**: ✅ FIXED (2026-05-22)
- *Problem*: 
  1. สีของระบบ Rework เพี้ยนจากเดิมและเอฟเฟกต์เบลอ (Glassmorphism) ใน sidebar/cards เสียไป หลังจากเพิ่มอนิเมชั่นตอนออกจากระบบ สาเหตุเกิดจากการใช้ `filter: 'blur(0px)'` บน container หลัก ซึ่งทำให้เบราว์เซอร์สร้าง Stacking Context ใหม่สำหรับการฟิลเตอร์ ส่งผลเสียต่อ `backdrop-filter` และ subpixel font smoothing ของลูกทั้งหมด
  2. หน้าจอออกจากระบบ (Logout Overlay) เดิมมีสีทึบหรือมีความทึบแสงสูงเกินไป ไม่สอดคล้องกับ Premium Apple UI
- *Solution*:
  1. ถอนคุณสมบัติ `filter` ออกจาก main content wrapper ใน `src/App.tsx` โดยใช้การยุบตัว `scale` และลด `opacity` เท่านั้น
  2. ปรับปรุง Logout Overlay ให้โปร่งใสและเบลอด้วย `bg-white/10 dark:bg-black/20 backdrop-blur-[16px]` พร้อมตัวการ์ดที่เป็นกระจกโปร่งแสงและเปลี่ยนมาใช้ **iOS Spoke Activity Indicator** (12 spokes) ที่หมุนเวลายอย่างนุ่มนวล

---

## BUG-011: Item Master Conflict Blockers from Fragmented Data
**Status**: ✅ FIXED (2026-05-26)
- *Problem*: ข้อมูลสินค้า (Item Master) ในระบบเดิมมีลักษณะกระจัดกระจาย (Fragmented) เช่น แถวหนึ่งมีเฉพาะ `Item Number` อีกแถวมีเฉพาะ `Item Code` ทำให้เมื่อผู้ใช้กรอกข้อมูลทั้งคู่ในฟอร์มเดียวกัน ระบบจะระบุว่าตรงกับสองแถวที่ต่างกัน และแจ้งเตือนสถานะ `conflict` (รหัสซ้ำซ้อนในระบบ) บล็อกไม่ให้ผู้ใช้สามารถกดบันทึกใบงานได้
- *Solution*: พัฒนากลไก **Smart Auto-Merge** ใน Backend (ทั้ง Next.js API และ Google Apps Script) โดยหากตรวจพบว่า `Item Number` และ `Item Code` ตรงกับข้อมูลคนละแถว ระบบจะทำการเปรียบเทียบชื่อสินค้า (`Item Name`) ก่อน หากไม่มีการขัดแย้งของชื่อสะกดจริง (ชื่อตรงกัน หรือมีฝ่ายใดฝ่ายหนึ่งเป็นค่าว่าง) ระบบจะทำการยุบรวมข้อมูลทั้งหมดเข้าด้วยกันเป็นแถวเดียวกัน และลบแถวที่ซ้ำซ้อนออกอัตโนมัติ เพื่อทำความสะอาดฐานข้อมูล Master และปลดบล็อกผู้ใช้งาน

---

## BUG-012: Relax Validation Constraints to Allow Nullable Fields
**Status**: ✅ FIXED (2026-05-27)
- *Problem*: ข้อมูลสินค้าในระบบ rework (เช่น บาร์โค้ด Item Number, รหัสสินค้า Item Code, หมายเลขล็อต Batch no., เลขกล่อง Box Number, โมลด์ Mold, ไลน์ Line, และจำนวน Amount) เดิมมีข้อจำกัดที่เข้มงวดและเป็นฟิลด์บังคับกรอก (Required) ทำให้ผู้ใช้งานไม่สะดวกเมื่อข้อมูลจริงหน้างานไม่ครบถ้วน
- *Solution*: 
  1. ปรับปรุงตัวตรวจสอบความถูกต้องทั้งระบบ Frontend (`src/services/validation.ts`) และ Google Apps Script (`gas/Code.gs`) ให้ตรวจสอบเฉพาะ 4 ฟิลด์หลักที่จำเป็นเท่านั้น คือ: ชื่อลูกค้า (`Customer Name`), ชื่อรายการสินค้า (`Item Name`), สาเหตุที่พบ (`Reason`), และผู้รับผิดชอบ (`Responsible`)
  2. ฟิลด์อื่นทั้งหมด เช่น `Item Number`, `Item Code`, `Batch no.`, `Box Number`, `Mold`, `Line`, และ `Amount` ถูกปรับเป็นฟิลด์ทางเลือก (Optional) สามารถเป็นค่าว่างเปล่า (Null / Empty string) ได้
  3. อัปเดตอินเทอร์เฟซหน้าจอหลัก (`src/components/tabs/AddCaseTab.tsx`) นำดอกจัน `*` ออกจาก label ของฟิลด์ดังกล่าว และอัปเดตชุดทดสอบ Unit Tests เพื่อยืนยันความถูกต้องผ่านหมด 100%

---

## BUG-013: Unique Constraint Violation on Master Item Save for Empty Barcode
**Status**: ✅ FIXED (2026-05-27)
- *Problem*: เมื่อผู้ใช้งานบันทึกเคสที่มีสินค้าที่ไม่ได้ระบุบาร์โค้ด (Item Number เป็นค่าว่าง) ระบบจะพยายามส่งข้อมูลไปลงทะเบียนที่ API `/api/rework` (Action: `saveItemMaster`) ส่งผลให้เกิดข้อผิดพลาด `duplicate key value violates unique constraint "rework_master_items_item_number_key"` เนื่องจากในตาราง `rework_master_items` ของ Supabase มีการบังคับค่า `UNIQUE` สำหรับ `item_number` ทำให้การใส่ค่าว่างเปล่าซ้ำกันหลายตัวเกิดการขัดแย้งของคีย์ (Key Conflict)
- *Solution*: 
  1. แก้ไข Handler `saveItemMaster` ใน `src/app/api/rework/route.ts` ให้ทำการตรวจสอบค่า `itemNumber` ก่อน หากเป็นค่าว่างหรือไม่มีข้อมูล บิลด์จะข้ามขั้นตอนการบันทึกลงในตาราง `rework_master_items` ใน Supabase และแจ้งเตือนสำเร็จ (Early return success) ทันที
  2. ทำให้ระบบรองรับการสร้างเคสแบบไม่ต้องลงทะเบียน Master Product ในกรณีที่สินค้าไม่มีหมายเลขบาร์โค้ดได้โดยไม่ติดขัด

---

## BUG-014: Display Only First Item's Reason in Overall Case List
**Status**: ✅ FIXED (2026-05-27)
- *Problem*: ในตารางสรุปรายการเคส (Overall Tab) ข้อมูลสาเหตุหลักจะดึงเฉพาะไอเทมแรก (`firstItem.reason`) มาแสดงผลเท่านั้น ซึ่งไม่ครอบคลุมเคสที่มีหลายรายการสินค้าและมีสาเหตุความผิดปกติที่แตกต่างกันในเคสเดียวกัน
- *Solution*: ปรับปรุงคอมโพเนนต์ `CaseListTable.tsx` ให้รวบรวมสาเหตุหลักที่ไม่ซ้ำกันทั้งหมดจากทุกรายการในเคสนั้น (`uniqueReasons`) และนำมาจัดแสดงผลร่วมกันโดยคั่นด้วยเครื่องหมายจุลภาค (เช่น `รั่ว, อื่นๆ`) เพื่อสะท้อนข้อมูลความผิดปกติที่สมบูรณ์และถูกต้อง

---

> 🔄 *อัปเดตเมื่อ 2026-05-27*: เพิ่ม BUG-014: ปรับปรุงให้หน้า Overall แสดงสาเหตุหลักทั้งหมดแบบรวบยอดกรณีมีหลายไอเทม




