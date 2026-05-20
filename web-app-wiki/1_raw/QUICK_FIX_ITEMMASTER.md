# 🚀 Quick Fix - ItemMaster Verification ยังแสดง Modal

## ⚠️ สำคัญ! ต้องทำ 2 ขั้นตอนนี้ก่อน:

### ขั้นตอน 1: Deploy รหัส GAS ใหม่ (สำคัญ!)
ฉันได้อัปเดตโค้ด GAS แต่อาจยังไม่ได้ deploy

1. **เปิด Google Apps Script**: https://script.google.com/home
2. **เลือก "Rework Management System" project**
3. **ดูรหัส Code.gs**
4. **ลองค้นหา "📋 Reading ItemMaster sheet"** - ถ้าไม่เห็นแสดงว่ายังไม่ deploy
5. **ถ้าไม่เห็น**:
   - Copy รหัสใหม่จาก `gas/Code.gs` จากไฟล์ที่แก้ไข
   - Paste แทนรหัสเก่า ใน Apps Script editor
   - Ctrl+S เพื่อ save
   - Deploy → New Deployment
   - Copy URL ใหม่

### ขั้นตอน 2: ตรวจสอบ Browser Console
1. **เปิด Application**
2. **F12** เพื่อเปิด DevTools
3. **ไปที่ Console tab**
4. **รีเฟรช หน้า** (F5)
5. **ลองป้อน ItemNumber** ที่มีในไฟล์ ItemMaster sheet
6. **กดปุ่ม Tab หรือ "ตรวจสอบ"**
7. **ตรวจสอบ console output**

---

## 📋 ลองทำตามนี้เพื่อ Debug:

```javascript
// เปิด Browser Console (F12 → Console)
// คัดลอก code นี้ไป console และ Enter:

// 1. ตรวจสอบว่า GAS URL ถูกตั้ง
console.log('GAS URL set:', sessionStorage.getItem('gasUrl') || 'NOT SET');

// 2. ลองเรียก fetchItemMaster() เพื่อดู response
(async () => {
  const token = localStorage.getItem('authToken') || 'test';
  const gasUrl = sessionStorage.getItem('gasUrl') || 'https://script.google.com/macros/s/AKfycbzubVIJxInExfYssGKi_Sy5AHkqEgXpi4glIHTdUAUFLSsGre2PUU0czenRprDCQ-hI/exec';
  
  console.log('Testing fetchItemMaster()...');
  const response = await fetch(gasUrl, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'getItemMaster', token })
  });
  
  const result = await response.json();
  console.log('=== GAS Response ===');
  console.log('Success:', result.success);
  console.log('Data length:', result.data?.length);
  console.log('Full data:', result.data);
  console.log('Error:', result.error);
})();
```

---

## ✅ ตรวจสอบในไฟล์ ItemMaster Sheet:

**ที่ต้องตรวจสอบ**:

1. **เปิด Google Sheet**: `1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0`
2. **ไปที่ tab "ItemMaster"**
3. **ตรวจสอบ**:
   - ✅ Row 1: A="Item Number", B="Item Name"
   - ✅ Row 2+: มีข้อมูล ItemNumber และ ItemName
   - ✅ ไม่มี empty rows ตรงกลาง
   - ✅ ItemNumber ไม่ว่างใน row ใดๆ

**ตัวอย่างถูก**:
```
A1: Item Number    B1: Item Name
A2: 60001001       B2: Product Name 1
A3: 100001         B3: Product Name 2
A4: 200005         B4: Product Name 3
```

**ตัวอย่างผิด** (จะถูก skip):
```
A1: Item Number    B1: Item Name
A2: 60001001       B2: (empty)      ← จะ skip เพราะ ItemName ว่าง
A3:                B3: Product 2    ← จะ skip เพราะ ItemNumber ว่าง
```

---

## 🔍 Console Log ที่คุณจะเห็น:

### ถ้า ItemMaster ว่าง:
```
📋 ItemMaster API Response: {
  dataLength: 0,
  rawData: [],
}
⚠️ ItemMaster data is empty or invalid: []
```
→ **วิธีแก้**: เพิ่มข้อมูลไป ItemMaster sheet

### ถ้า ItemMaster มีข้อมูล:
```
📋 ItemMaster API Response: {
  dataLength: 2,
  rawData: [
    {itemNumber: "60001001", itemName: "Product 1"},
    {itemNumber: "100001", itemName: "Product 2"}
  ]
}
✓ ItemMaster loaded: 2 items
  Map keys: ["60001001", "100001"]
```
→ **ถูก!** ลองป้อน ItemNumber "60001001"

### ถ้า Verify สำเร็จ:
```
🔍 Verifying itemNumber: "60001001" {
  found: true,
  itemName: "Product 1",
  allKeys: ["60001001", "100001"]
}
✓ Item matched: 60001001 → Product 1
```
→ **ถูก!** ItemName จะ auto-fill

### ถ้า Verify ล้มเหลว:
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
→ **ปัญหา**: ItemMaster ว่าง หรือ ItemNumber ไม่ตรงกัน

---

## 🎯 หนทางแก้ไขตามสถานการณ์:

### สถานการณ์ 1: ItemMaster ว่าง (dataLength: 0)
1. ไปที่ Google Sheet ItemMaster
2. เพิ่มข้อมูล ItemNumber + ItemName
3. Save
4. รีเฟรช Application (F5)
5. ลองใหม่

### สถานการณ์ 2: ItemMaster มีข้อมูล แต่ Verify ยังล้มเหลว
1. **ตรวจสอบ ItemNumber format**
   - ป้อน: "60001001" 
   - ใน Sheet: "60001001" (ตรวจดู space และ leading zeros)
   - ลองป้อน: "60001001" (ไม่มี space)
2. **ตรวจสอบ Column positions**
   - ItemNumber ต้องอยู่ Column A
   - ItemName ต้องอยู่ Column B
3. **รีเฟรช Application** (F5) แล้วลองใหม่

### สถานการณ์ 3: GAS Response ว่าง หรือ Error
1. ไปที่ Google Apps Script
2. ไปที่ Executions
3. ลองหา latest execution ล้มเหลว
4. ดูข้อความ error
5. Report error ให้ developer

---

## 💡 ข้อมูลที่ต้องให้ Developer:

ถ้า ยัง Verify ไม่ได้:
1. **Screenshot ของ ItemMaster sheet** (แสดง data)
2. **Console log ทั้งหมด** จากการ verify
3. **GAS logs** จากการ execute getItemMaster()
4. **ItemNumber ที่ลอง verify**

---

**ทำตามนี้แล้ว ItemMaster verification จะทำงาน! 🚀**

*อัปเดต: April 30, 2026*
