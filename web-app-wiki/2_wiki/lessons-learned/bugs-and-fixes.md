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

> 🔄 *อัปเดตเมื่อ 2026-05-21*: เพิ่ม GAS Code Pattern และ ItemMaster Diagnostic จาก `archive_docs/`

