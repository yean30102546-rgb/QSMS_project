# Title: Case Name Update Failure & Source Dropdown in Edit Mode
[อัปเดตเมื่อ: 2026-05-27]

## 1. Summary & Current Implementation
- แก้ไขปัญหาการแก้ไข Case Name (ชื่อเคส) ใน Edit Mode แล้วบันทึกสำเร็จลง Google Sheet แต่หน้าจอไม่ยอมอัปเดตตาม
- **สาเหตุของปัญหา:** ฟังก์ชันดึงข้อมูลฝั่ง Backend (`handleReadAll` ใน `Code.gs`) ไม่ได้ดึงค่าจากคอลัมน์ `COL_CASE_NAME` (ดัชนี 30) มาแมปเข้ากับอ็อบเจกต์ที่ส่งกลับให้ฝั่ง Client ทำให้ทุกครั้งที่โหลดข้อมูลใหม่ ค่า `caseName` จึงกลายเป็น `undefined` และส่งผลให้ UI แสดงผลเป็น Case ID แทน
- **วิธีแก้ไข:** เพิ่มการแมป `caseName` จากแถวข้อมูล Google Sheet เข้ากับอ็อบเจกต์ส่งกลับใน `handleReadAll`
- นอกจากนี้ ได้เปลี่ยนช่องระบุแหล่งที่มา (Source) ใน Edit Mode จากเดิมที่เป็นกล่องข้อความธรรมดา ให้เป็น **Dropdown** (select element) ตัวเลือก 2 ค่าคือ `SFC` และ `Customer` เพื่อป้องกันข้อผิดพลาดในการป้อนข้อมูล และปรับให้ Prefix ของ Case Name (`RT` หรือ `RW`) เปลี่ยนแปลงแบบเรียลไทม์ตามค่าที่เลือกใน Dropdown

## 2. Technical Code Snippet (Best Practice)
```javascript
// ใน Code.gs -> handleReadAll()
caseName: (COL_CASE_NAME < row.length && row[COL_CASE_NAME] !== undefined) ? normalizeSheetText(row[COL_CASE_NAME]) : '',
```
```tsx
// ใน UpdateModal.tsx
// เปลี่ยน prefix ใน handleUpdate ให้เชื่อมโยงกับ editedSource เสมอ
const prefix = editedSource === 'Customer' ? 'RT' : 'RW';
updates.caseName = editedCaseName ? `${prefix}${editedCaseName}-${year}` : '';
```

## 3. Knowledge Relationships
Depends On: [[gas/Code.gs]], [[src/components/modals/UpdateModal.tsx]]

## 4. Current Case Name Editing Rule
[Updated: 2026-05-28]

`UpdateModal` รองรับการแก้เลขกลางของชื่อเคสใน Edit Mode แล้ว โดยรูปแบบชื่อเคสคือ `{prefix}{number}-{year}` เช่น `RT084-2026`.
`prefix` derive จาก Source แบบ realtime: `Customer` -> `RT`, `SFC` -> `RW`; ส่วน `year` derive จาก `caseData.timestamp || caseData.date` เพื่อให้ผูกกับวันที่จริงของเคส.

### Technical Code Snippet
```tsx
const caseNamePrefix = editedSource === 'Customer' ? 'RT' : 'RW';
const caseNameYear = getCaseYear(caseData?.timestamp || caseData?.date);
updates.caseName = `${caseNamePrefix}${editedCaseNumber}-${caseNameYear}`;
```

### Knowledge Relationships
- Depends On (ต้องพึ่งพา): [[src/components/modals/UpdateModal.tsx]]
- Impacted By (ได้รับผลกระทบจาก): [[edit-mode-layout.md]]
- Contradicts (ข้อขัดแย้ง): [Deprecated] UI ที่ให้แก้ Source แต่ไม่ expose ช่องเลขกลางของ Case Name ทำให้ไม่สามารถสร้าง `RT/RWxxx-year` ตามกฎปัจจุบันได้
