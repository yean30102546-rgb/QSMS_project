# Google Sheets Schema — QSMS Rework Management
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Google Sheets เป็น Database หลักของระบบ มี 3 ชีต: `Rework Cases`, `ItemMaster`, `Backup`
ข้อมูลทั้งหมดไหลผ่าน GAS (`gas/Code.gs`) ก่อนถึง Sheet

## 2. ชีต: Rework Cases (ชีตหลัก)

| Col | Index | Type | คำอธิบาย |
|---|---|---|---|
| A | 0 | String | Item ID (PK) เช่น `RW2604271707-001` |
| B | 1 | String | Case ID เช่น `RW2604271707` |
| C | 2 | DateTime | วันเวลาสร้างเคส |
| D | 3 | String | Source: `SFC` หรือ `Customer` |
| E | 4 | String | Item Number (ตัวเลข) |
| F | 5 | String | Item Name |
| G | 6 | String | Item Code (ตัวเลขเท่านั้น) |
| H | 7 | Number | Amount (Box) > 0 |
| I | 8 | String | Reason (สาเหตุของเสีย) |
| J | 9 | String | Reason Subtype |
| K | 10 | String | Responsible (ผู้รับผิดชอบ) |
| L | 11 | String | Responsible Subtype |
| M | 12 | String | Details (รายละเอียด) |
| N | 13 | String | Status: `Pending` / `In-Progress` / `Completed` |
| O | 14 | String | Image URLs คั่นด้วย `|` (pipe) |

> ⚠️ **GAS readAll validation**: ตรวจว่า row มี >= 13 columns ก่อน process (index 0-12 minimum)

## 3. ชีต: ItemMaster

| Col | Type | คำอธิบาย |
|---|---|---|
| A | String | Item Number (PK) |
| B | String | Item Name |

- ชื่อชีต: ต้องเป็น `ItemMaster` (case-sensitive)
- **Auto-created** โดย GAS `getItemMaster()` หากไม่มีอยู่
- Headers: `Item Number` | `Item Name` (bold, blue bg, white text)

## 4. ชีต: Backup
- Snapshot รายวันอัตโนมัติ
- สร้างโดย GAS ใน `handleInsert()`

## 5. Image Storage (Google Drive)
- Folder หลัก ID: `1QVYbfWc_kEBs4jONGpA3l6ai0gzvDQfj`
- Case subfolder: `Case_RW[DATEHHMM]`
- ชื่อไฟล์: `[itemId]_[unix_timestamp].jpg`
- Format: JPEG เท่านั้น

## 6. Knowledge Relationships
- **Impacted By**: [[gas-backend/gas-api.md]] — GAS เขียนข้อมูลลงชีตตาม schema นี้
- **Impacted By**: [[nextjs-frontend/rework-module.md]] — Frontend ส่งข้อมูลมาตาม columns เหล่านี้

> 🔄 *อัปเดตเมื่อ 2026-05-21*: เพิ่ม index column, ItemMaster sheet, Image Storage จาก `1_raw/SYSTEM_ARCHITECTURE.md`
