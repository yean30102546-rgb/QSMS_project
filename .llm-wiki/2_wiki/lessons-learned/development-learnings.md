# Development Learnings (React, Next.js, & Google Apps Script)
[วันที่อัปเดต: 2026-06-29]

## 1. Summary & Current Implementation
เอกสารนี้รวบรวมแนวคิด วิธีแก้ไขปัญหา และบทเรียนสำคัญที่พบในกระบวนการพัฒนาระบบ QSMS Rework & ShiftHub Roster ครอบคลุมทั้งฝั่ง Frontend (React 19, Next.js, Tailwind v4) และ Backend (Google Apps Script, Google Sheets Database) เพื่อป้องกันการเกิดปัญหาซ้ำซ้อนในการปรับปรุงระบบครั้งหน้า

---

## 2. Technical Code Snippets (Best Practices)

### การจัดการอินพุตตัวเลขเพื่อหลีกเลี่ยง NaN และลบค่าเหลือว่างใน React Form
```typescript
// หลีกเลี่ยงค่า NaN แสดงบนจอและคงสภาพ UI ที่ตอบสนองลื่นไหล
const handleNumericChange = (val: string) => {
  // สรุปค่าเป็น string ว่างสำหรับการลบตัวเลขเพื่อพิมพ์ใหม่
  const numericValue = val === '' ? '' : (Number(val) || 0);
  setFieldValue(numericValue);
};

// เวลาคำนวณยอดรวม ใช้ fallback 0 เสมอ
const totalCost = Number(fieldValue) || 0;
```

### การอ่านข้อมูลแถวใน Google Sheets แบบยืดหยุ่นและปลอดภัย (Defensive & Backward-Compatible)
```javascript
// ตรวจสอบขนาดของอาร์เรย์และค่า undefined ก่อนแปลงค่าเสมอ เพื่อรองรับการเพิ่มคอลัมน์ใหม่ในสกีมา
function parseRowDefensive(row) {
  const laborCountIndex = 27;
  const laborCount = (laborCountIndex < row.length && row[laborCountIndex] !== undefined)
    ? Number(row[laborCountIndex])
    : 0;
  return laborCount;
}
```

### การย่อการเรียกเขียนทับชีตแบบครั้งเดียว (Single-Transaction Batch Updates)
```javascript
// แทนการวนลูปเรียก API บันทึกทีละรายการ (ประหยัดเวลาเน็ตเวิร์กและเลี่ยง Write Collision)
function upsertOverrideRows(employeeId, overridesList, updatedBy) {
  var sheet = getSheet("Overrides");
  var allData = sheet.getDataRange().getValues();
  // สะสมการอัปเดตลงในหน่วยความจำ แล้วเขียนคืนแผ่นงานครั้งเดียว
  // ...
  sheet.getRange(1, 1, newValues.length, newValues[0].length).setValues(newValues);
}
```

### การตั้งค่า dynamic loader เพื่อป้องกัน Hydration Mismatch ใน Next.js
```typescript
import dynamic from 'next/dynamic';

// โหลด App Component ที่เป็น client-side SPA เข้าสู่หน้าหลักโดยข้ามการทำ Server-Side Rendering (SSR)
const App = dynamic(
  () => import('../App'),
  { ssr: false, loading: () => <div className="spinner">กำลังโหลด...</div> }
);
```

---

## 3. Detailed Development Lessons (36 Items)

1. **Import Path Misalignment (2026-05-15)**: การย้ายคอมโพเนนต์ลงโฟลเดอร์ย่อยทำให้ Path การ Import สตริงเก่าเสีย (`../` -> `../../`) ต้องใช้ `grep` ตรวจสอบและแก้ไข relative paths เสมอ
2. **Lazy Loading Paths in MainLayout (2026-05-15)**: การ Import แบบ dynamic string ใน `MainLayout.tsx` มักไม่ถูกอัปเดตอัตโนมัติโดยทูล Refactor ต้องตามเช็คและแก้ไขด้วยตนเอง
3. **Date Formatting (2026-05-15)**: ผู้ใช้ต้องการรูปแบบวันที่แบบไทย `DD-MM-YYYY` จึงสร้าง `formatThaiDateShort` ใน `helpers.ts` (ควรเคลียร์สัญลักษณ์และปี พ.ศ. / ค.ศ. กับผู้ใช้ทุกครั้ง)
4. **Prop Naming Inconsistencies (2026-05-15)**: ชื่อ Prop ของคอมโพเนนต์ชั้นในไม่ตรงกัน (`handleAutoFillBlur` vs `handleItemNumberBlur`) ทำให้บิลด์พัง ควรควบคุมการตั้งชื่อ Callback ให้สอดคล้องกันทุกระดับชั้น
5. **Optimistic UI Updates Data Consistency (2026-05-15)**: การใช้ shallow spread (`{ ...c, ...updates }`) ในโครงสร้างข้อมูลซับซ้อน (Nested Array) ทำให้ข้อมูลสินค้าหลุดหรือพัง ต้องใช้ Deep merge/filter แทน
6. **Clipboard Paste in React Components (2026-05-15)**: อีเวนต์ `onPaste` บน `div` จะทำงานเมื่อตัวมันโฟกัสอยู่เท่านั้น วิธีแก้คือใช้ `useRef` ผูก Event Listener กับ Element นอกสุดเพื่อให้วางข้อมูลได้ทุกจุดข้างใน
7. **Form Field NaN/Empty String Handling (2026-05-18)**: การลบตัวเลขในช่อง Input ทำให้เกิด `NaN` วิธีแก้คือเก็บค่าเป็น string ว่างเมื่อลบ และใช้ fallback `Number(val) || 0` ในการคำนวณยอดรวม
8. **Safe Array Range Verification in Google Sheets (2026-05-18)**: การเพิ่มคอลัมน์ในชีตทำให้ข้อมูลแถวเก่าสั้นกว่าปกติ วิธีแก้คือตรวจเช็คขนาดแถวก่อนอ้างอิงคอลัมน์ปลายทาง (`index < row.length && row[index] !== undefined`) เพื่อป้องกัน Exception
9. **Role-Based Save Validation in Dynamic Statuses (2026-05-18)**: ปุ่มบันทึกในสถานะ `Pending`/`In-Progress` เคยถูก disabled เฉพาะผู้ใช้ที่ไม่ใช่ PDB ส่งผลให้ WFG บันทึกข้อมูลซ่อมไม่ได้ วิธีแก้คือเพิ่มสิทธิ์ให้ WFG ร่วมประหยัดงาน
10. **Role-Based Payload Verification Mismatch (2026-05-18)**: WFG กดบันทึกแล้วติดบล็อกจาก GAS เรื่องอัปเดตราคา Rework Cost เนื่องจากหน้าบ้านส่ง Payload ไปครบถ้วน วิธีแก้คือกรองฟิลด์ก่อนส่งตามสิทธิ์เขียนของบทบาทจริง
11. **Workflow Transition Blocked by Input Role Mismatch (2026-05-18)**: เคสไม่เลื่อนไป `Awaiting Valuation` เพราะ WFG มองไม่เห็นและบันทึก "วิธีแก้ไข" ไม่ได้ วิธีแก้คือขยายสิทธิ์การเรนเดอร์ Textarea ให้ WFG/Operator ร่วมด้วย
12. **Workflow Blockade for Zero-Cost Valuation Cases (2026-05-18)**: เคสที่ค่าซ่อมเป็น 0 ติดค้างในสถานะ `Awaiting Valuation` เพราะเงื่อนไขบังคับตรวจสอบค่าใช้จ่าย > 0 วิธีแก้คือลดเงื่อนไขเพื่อให้ Finance กดปิดเคสที่ราคาเป็นศูนย์ได้
13. **WFG Status Transition Sticky Bug (2026-05-18)**: การบันทึกวัสดุหรือชั่วโมงแรงงานโดยไม่กรอกตัวอักษร "วิธีแก้ไข" ทำให้เคสติดหล่ม ไม่เลื่อนสถานะ วิธีแก้คือเช็คการกรอกทรัพยากร/วัสดุอุปกรณ์ร่วมในการเลื่อนสถานะด้วย
14. **Finance Save Permission Denied Bug (2026-05-18)**: Finance บันทึกค่าเสียหายแล้วบกพร่องเรื่องสิทธิ์แก้ไข "วิธีแก้ไข" และ "แหล่งที่มา" วิธีแก้คือกรองฟิลด์เหล่านั้นออกหากผู้ใช้ไม่มีบทบาท WFG หรือ Admin
15. **Backward-Compatible Role & Profile Mappings (2026-05-18)**: การเปลี่ยนชื่อคีย์บทบาท (เช่น WFG -> OPERATOR) บน live system ทำให้ token เก่าหลุด วิธีแก้คือทำ Alias mapping รองรับทั้งชื่อบทบาทเก่าและใหม่เพื่อให้เปลี่ยนผ่านแบบ Zero-downtime
16. **Mismatched Script Property Keys (2026-05-18)**: ล็อกอินล้มเหลวเพราะพิมพ์ Username ผิด (พิมพ์อีเมลแทนคีย์บทบาท) หรือมีช่องว่างใน GAS Properties วิธีแก้คือทำ Trim/Uppercase บนคีย์ และรองรับการค้นหา fallback จากอีเมลใน Value
17. **Automatic TypeScript Reconfiguration in Next.js (2026-05-18)**: เมื่อย้ายโปรเจกต์ไป Next.js ตัวสคริปต์คอมไพเลอร์จะสร้าง `next-env.d.ts` และจัดแจง `tsconfig.json` ให้อัตโนมัติเมื่อรัน `npm run build` รอบแรก
18. **Tailwind CSS v4 Integration Pitfalls in Next.js (2026-05-18)**: การย้ายจาก Vite ไป Next.js นำพาสไตล์หาย (Plain HTML) เนื่องจากขาดตัวแปลงสไตล์ วิธีแก้คือติดตั้ง `@tailwindcss/postcss` และสร้างไฟล์ `postcss.config.mjs`
19. **Hydration Mismatch in Client-Only React 19 Trees (2026-05-18)**: การเรียกใช้หน้า SPA เดิมใน Next.js มักเจอ Mismatch เพราะไม่มี Global Window ในขั้นตอน Server build วิธีแก้คือใช้ `dynamic` โหลดแบบ `ssr: false`
20. **CSS Line Reference Desynchronization (2026-05-19)**: การอัปเดตไฟล์สไตล์โดยพึ่งพา Line numbers เดิมที่คลาดเคลื่อนทำให้คลาสดีไซน์หลุดหาย วิธีแก้คือรัน `git checkout` กู้คืน และดูบริบทปัจจุบันด้วย `view_file` เสมอ
21. **Code Replacement Line Number Shifts and Whitespace Matches (2026-05-19)**: การสั่งเขียนโค้ดทับล้มเหลวเพราะโค้ดจริงมี Indent เปลี่ยนแปลง วิธีแก้คือใช้ `view_file` เพื่อดู Indentation และแก้ไขแบบ chunk ขนาดเล็กทีละส่วน
22. **Roster Calendar Initial Saturday Requirement (2026-05-19)**: พนักงานใหม่ที่ไม่มีการตั้งค่าวันเสาร์เริ่มงานทำให้ระบบ Alternating คลาดเคลื่อน วิธีแก้คือตั้งเป็น `'OFF'` เริ่มแรก และเพิ่มปุ่ม "ตั้งเป็นเสาร์เริ่มงาน" ในช่องปฏิทินให้กดเซ็ตทันที
23. **Quick Calendar Action Buttons with Hover State (2026-05-19)**: ปุ่มด่วนต่างๆ ในช่องปฏิทินทำให้ UI รกตา วิธีแก้คือซ่อนปุ่มไว้และใช้ CSS Hover (`group-hover:opacity-100`) ให้แสดงเฉพาะเมื่อนำเมาส์ไปวางทับ
24. **Apps Script Web App Out-of-Sync Errors (2026-05-19)**: การเพิ่ม Actions หน้าบ้านโดยไม่ได้ Deploy GAS เว็บแอปเป็นเวอร์ชันใหม่ทำให้เกิด `Unknown action` วิธีแก้คือเพิ่มคู่มือวิธี Deploy ใหม่ภาษาไทยใน Error banner ปลายทาง
25. **TypeScript Compiler Error on Destructured Props in MainLayout (2026-05-19)**: บิลด์พังเพราะ `MainLayout` เรียกใช้ prop `onBackToPortal` แต่ลืมระบุใน Interface วิธีแก้คือเพิ่มลงใน Props Interface และเชื่อมต่อปุ่มนำทางซ้ายมือ
26. **TypeScript Strict Union Type Conflict in Array (2026-05-19)**: บิลด์พังจากการเอาค่าสตริงสถานะไปใส่ในอาร์เรย์ที่รองรับเฉพาะ `RosterCellStatus` วิธีแก้คือใช้การ Cast ค่า (`as RosterCellStatus`) ในคำสั่งพุชอาร์เรย์
27. **Duplicate Calendar Year Display (2026-05-19)**: Dropdown แสดงปี พ.ศ. ซ้ำซ้อน ("2569 2569") เนื่องจาก `getThaiMonthLabel` คืนค่าที่มีปีอยู่แล้ว วิธีแก้คือเอาการเชื่อมต่อปีออก
28. **Blocked Add Employee Button and Redundant Dropdown (2026-05-19)**: ปุ่มเพิ่มพนักงานถูกบล็อกเพราะบังคับกรอกวันเสาร์เริ่มงานในฟอร์ม วิธีแก้คือเอา Dropdown นั้นออก และเปลี่ยนไปให้กรอกข้อมูลผ่านหน้าปฏิทินโดยตรงแทน
29. **JSX Structural Misalignment Compiler Error (2026-05-20)**: บิลด์ของ Next.js พังเพราะมีวงเล็บ Tag ขัดข้อง (เช่น ลืมปิด `<motion.div>` หรือใส่ `</>` คลาดเคลื่อน) วิธีแก้คือตรวจเช็คความลึกของ HTML Tag และ Indentation
30. **Missing React Event Modifier Typo (2026-05-20)**: ฟังก์ชัน Drag-and-drop ทำงานไม่ถูกต้องเนื่องจากพิมพ์สะกดพารามิเตอร์ผิดตัวพิมพ์ (`dragEnd` แทนที่ `onDragEnd`) ส่งผลให้ State ไม่ล้างค่าเมื่อปล่อยไอเทม
31. **Cache Invalidation Misses in Optimistic UI (2026-05-20)**: การแก้ไขข้อมูลทำงานทันทีแต่จะแฟลชข้อมูลเก่ากลับมาหลังรีเฟรชเนื่องจากติดแคชใน Session วิธีแก้คือเรียก `clearSessionCache()` ทุกครั้งที่กดปุ่มลบหรือแก้ไขสำเร็จ
32. **Popover Dismissal Trap with Generic Selectors (2026-05-20)**: การคลิกปิดเมนู Popover นอกจุดติดค้างเมื่อมีช่องปฏิทินใช้ Attribute เดียวกันหมด วิธีแก้คือเปลี่ยนมาใช้ `data-popover-id` ผูกกับไอดีเฉพาะตัวของช่องวันนั้นๆ
33. **Apps Script Boolean Coercion Issue (2026-05-20)**: พนักงานที่ถูก Soft-delete (`Active = false`) ยังคงแสดงบนปฏิทินเนื่องจาก `rows[i][3] || 'TRUE'` แปลงค่า `false` เป็น Falsy วิธีแก้คือเช็คค่าว่างตรงๆ ก่อน (`rows[i][3] !== ''`)
34. **TypeScript Strict Union Type Conflict (2026-05-20)**: การใส่สถานะชั่วคราว `'CLEAR'` ในฟังก์ชันเปลี่ยนสถานะวันเสาร์ทำให้บิลด์พัง วิธีแก้คือระบุไทป์ตัวแปรท้องถิ่นเป็น `RosterCellStatus | 'CLEAR'` เพื่อความปลอดภัย
35. **Google Apps Script Boolean Simplification (2026-05-20)**: โค้ดแปลงค่า Boolean ในชีตมีความซับซ้อน อ่านยาก วิธีแก้คือเรียกฟังก์ชัน `sanitizeText` ของระบบและตรวจสอบความเท่ากับ `'FALSE'` เพื่อเพิ่มความกระชับ
36. **Single-Transaction Batch Updates on Sheet (2026-05-20)**: การแก้ไขข้อมูลวันเสาร์ของพนักงาน 2 แถวติดกันสร้างดีเลย์เน็ตเวิร์กสูง วิธีแก้คือเขียนฟังก์ชัน `upsertOverrideRows` ให้ทำงานแบบสะสมข้อมูลในแรมและสั่งเขียนชีตเพียงรอบเดียว

---

## 4. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[../architecture/system-architecture.md]] — โครงสร้างสถาปัตยกรรมรวมของ Next.js และ GAS
- **Depends On**: [[../gas-backend/gas-api.md]] — การพัฒนา API และเวิร์กฟลว์การเรียกใช้บน Apps Script
- **Depends On**: [[nextjs-frontend/roles.md]] — การจัดสิทธิ์บทบาทและสกีมาความปลอดภัย
- **Impacted By**: [[lessons-learned/bugs-and-fixes.md]] — บันทึกบั๊กสำคัญของระบบ

---
## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/ForLearning_1941763098.md]]
