# 🔍 ItemMaster Verification - Diagnostic Guide

## วิธีการแก้ไขปัญหา "Create New Item" Modal ที่ยังแสดง

### ขั้นตอน 1: ตรวจสอบข้อมูลใน ItemMaster Sheet

1. **เปิด Google Sheet**: `1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0`
2. **ไปที่ tab "ItemMaster"** (ที่ด้านล่างของหน้า)
3. **ตรวจสอบโครงสร้างข้อมูล**:
   ```
   Row 1 (Headers):        Column A: "Item Number"    |    Column B: "Item Name"
   Row 2 (Data Example):   60001001                  |    Product Name 1
   Row 3 (Data Example):   100001                    |    Product Name 2
   ```

**ข้อมูลที่ต้องมี**:
- ✅ Tab "ItemMaster" มีอยู่
- ✅ Row 1 มี headers: "Item Number" | "Item Name"
- ✅ Row 2+ มีข้อมูล ItemNumber กับ ItemName
- ✅ ไม่มี empty rows ตรงกลาง
- ✅ ItemNumber มีค่า (ไม่ว่าง)

---

### ขั้นตอน 2: ตรวจสอบ Browser Console

1. **เปิด Application** (Rework Management System)
2. **เปิด DevTools**: กด `F12` หรือ Right-click → "Inspect"
3. **ไปที่ tab "Console"**
4. **ลองป้อน ItemNumber** ที่มีอยู่ใน ItemMaster sheet แล้ว **กดปุ่ม Tab**
5. **ตรวจสอบ console logs** ต้องเห็น:

**ถ้า ItemMaster โหลดได้**:
```
📋 ItemMaster API Response: {
  success: true,
  dataLength: 2,
  rawData: [{itemNumber: "60001001", itemName: "Product 1"}, ...],
  ...
}
✓ ItemMaster loaded: 2 items
  Map keys: ["60001001", "100001"]
```

**ถ้า ItemMaster ว่าง**:
```
📋 ItemMaster API Response: {
  success: true,
  dataLength: 0,
  rawData: [],
  ...
}
⚠️ ItemMaster data is empty or invalid: []
```

---

### ขั้นตอน 3: ตรวจสอบ GAS Logs

1. **ไปที่ [Google Apps Script Dashboard](https://script.google.com/home)**
2. **เลือก "Rework Management System" project**
3. **คลิก "Executions"** ในเมนูด้านซ้าย
4. **เลือก execution ล่าสุด**
5. **ตรวจสอบ logs** เพื่อหา:

**ตัวอย่าง logs ที่ดี**:
```
📋 Reading ItemMaster sheet: {
  totalRows: 3,
  headers: ["Item Number", "Item Name"],
  firstDataRow: [60001001, "Product 1"]
}
  Row 2: Raw=[60001001|Product 1] Trimmed=[60001001|Product 1]
    ✓ Added: "60001001" → "Product 1"
  Row 3: Raw=[100001|Product 2] Trimmed=[100001|Product 2]
    ✓ Added: "100001" → "Product 2"
✓ ItemMaster loaded: 2 items
```

**ตัวอย่าง logs ที่มีปัญหา**:
```
📋 Reading ItemMaster sheet: {
  totalRows: 1,
  headers: ["Item Number", "Item Name"],
  firstDataRow: undefined
}
⚠️ ItemMaster data is empty or invalid: []
```

---

### ขั้นตอน 4: ตรวจสอบการ Verify

หลังจากปรับปรุง console logs, ลอง enter ItemNumber:

1. **ไปที่ "Add Case" tab**
2. **ป้อน ItemNumber ที่มีอยู่ใน ItemMaster** เช่น `60001001`
3. **กด Tab หรือปุ่ม "ตรวจสอบ"**
4. **ตรวจสอบ console** เพื่อหา:

**ถ้า Verify สำเร็จ**:
```
🔍 Verifying itemNumber: "60001001" {
  found: true,
  itemName: "Product 1",
  masterDataSize: 2,
  allKeys: ["60001001", "100001"]
}
✓ Item matched: 60001001 → Product 1
```

**ถ้า Verify ล้มเหลว**:
```
🔍 Verifying itemNumber: "60001001" {
  found: false,
  itemName: undefined,
  masterDataSize: 0,
  allKeys: [],
  showModal: true
}
✗ Item not found: "60001001" (showing modal)
```

---

## 🔧 วิธีแก้ไขตามปัญหา

### ปัญหา 1: ItemMaster Sheet ว่าง (dataLength: 0)

**สาเหตุ**: Sheet ยังไม่มีข้อมูล

**วิธีแก้**:
1. ไปที่ Google Sheet
2. ไปที่ tab "ItemMaster"
3. ป้อนข้อมูล ตัวอย่าง:
   ```
   A1: Item Number     B1: Item Name
   A2: 60001001        B2: Product 1
   A3: 100001          B3: Product 2
   ```
4. **Save** (Ctrl+S)
5. **Refresh Application** (F5)
6. ลองใหม่

### ปัญหา 2: Headers ต่างกัน

**สาเหตุ**: Column headers ไม่เป็น "Item Number" และ "Item Name"

**วิธีแก้**:
1. ไปที่ ItemMaster sheet
2. **ลบแถว 1** ถ้ามีข้อมูลเก่า
3. **เพิ่มแถว 1** ใหม่ด้วย:
   - A1: `Item Number`
   - B1: `Item Name`
4. **ใส่ข้อมูลใหม่** ในแถว 2 เป็นต้นไป
5. **Save**

### ปัญหา 3: ItemNumber Format ไม่ตรงกัน

**สาเหตุ**: ป้อนค่า "60001001" แต่ sheet มี "60001001 " (มี space) หรือ "60,001,001" (มี comma)

**วิธีแก้**:
- Application ตอนนี้ trim() และ normalize ค่า
- ตรวจสอบ console logs เพื่อเห็น exact value
- หาก console แสดว่าโหลด "60001001" แต่ verify หา "60001001" ไม่เจอ → ปัญหาอยู่ที่ format

**วิธี Debug เพิ่มเติม**:
1. เปิด console
2. พิมพ์ code นี้:
   ```javascript
   // Check what's in itemMaster Map
   console.log('Current itemMaster Map keys:', Array.from(window.__itemMasterMap?.keys?.() || []));
   ```
3. จะแสดง exact keys ที่มีอยู่

### ปัญหา 4: Sheet Headers ในตำแหน่ง Column ต่างกัน

**สาเหตุ**: Data อยู่ใน Column B, C แทน A, B

**วิธีแก้**:
1. ตรวจสอบ Google Sheet
2. ย้าย ItemNumber ไปยัง **Column A**
3. ย้าย ItemName ไปยัง **Column B**
4. ลบ Column เก่า
5. Save

---

## ✅ Verification Checklist

- [ ] ItemMaster tab มีอยู่ใน Google Sheet
- [ ] Row 1: Headers = "Item Number" | "Item Name"
- [ ] Row 2+: มีข้อมูล
- [ ] ไม่มี empty rows ตรงกลาง
- [ ] Browser console แสดว่า ItemMaster loaded X items (X > 0)
- [ ] GAS logs แสดว่า "✓ ItemMaster loaded"
- [ ] ป้อน ItemNumber → console แสดว่า "✓ Item matched"
- [ ] ไม่มี "Create New Item" modal แสดง

---

## 📝 ตัวอย่าง ItemMaster Sheet ที่ถูก

```
Column A (Item Number)  |  Column B (Item Name)
─────────────────────────────────────────────────
Item Number            |  Item Name          ← Row 1 (Header)
60001001               |  Product A          ← Row 2
100001                 |  Product B          ← Row 3
200005                 |  Product C          ← Row 4
300010                 |  Product D          ← Row 5
```

---

## 🆘 ยังคงมีปัญหา?

1. **Copy console log ทั้งหมด** (F12 → Console → Ctrl+A → Ctrl+C)
2. **Copy GAS logs** (Executions → Copy logs)
3. **บอก**:
   - ItemNumber ที่ลอง verify
   - ItemMaster sheet มีกี่ rows
   - Headers ของ ItemMaster sheet
   - Console logs output
   - GAS logs output

---

*อัปเดต: April 30, 2026*
*สำหรับแก้ไขปัญหา "Create New Item" modal ที่ยังแสดง*
