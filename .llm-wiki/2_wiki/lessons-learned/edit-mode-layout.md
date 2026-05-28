# Title: Edit Mode Layout Stability & Modal Width Optimization
[อัปเดตเมื่อ: 2026-05-27]
## 1. Summary & Current Implementation
- แก้ไขปัญหา Layout เละหรือบีบอัดมากเกินไปใน Edit Mode สำหรับการแก้ไขข้อมูลรายการ Rework (Item Rows) 
- ปรับโครงสร้างจากการใช้ flex layout หลายๆ ชั้น ที่มีขนาดยืดหยุ่นไม่เท่ากัน (ทำให้ labels/inputs บิดเบี้ยว) ไปเป็นระบบ **12-Column Grid** แบบรวมศูนย์
- ขยายความกว้างสูงสุดของ Modal (`UpdateModal`) จาก `max-w-3xl` (768px) เป็น `max-w-5xl` (1024px) เพื่อสไตล์ที่โปร่ง โล่ง สไตล์ Apple และมีพื้นที่แสดงตารางวัสดุ Rework ได้ดีขึ้น

## 2. Technical Code Snippet (Best Practice)
```tsx
// 12-Column Grid Layout สำหรับจัดเรียงข้อมูล 2 แถวให้ตรงแนวกันสมบูรณ์แบบ
<div className="grid grid-cols-12 gap-3 flex-1">
  {/* แถวที่ 1 */}
  <div className="col-span-12 md:col-span-9 space-y-1">
    <label className="text-[10px] font-bold text-muted uppercase">ชื่อรายการ</label>
    <input className="w-full text-sm font-bold px-3 py-2 border rounded-lg" />
  </div>
  {/* แถวที่ 2 */}
  <div className="col-span-12 md:col-span-3 space-y-1">
    <label className="text-[10px] font-bold text-muted uppercase">Batch no.</label>
    <input type="date" className="w-full text-sm font-bold px-3 py-2 border rounded-lg" />
  </div>
</div>
```

## 3. Guidelines for Preventing Layout Shifts (ปัญหา Layout เพี้ยน/ขยับ ตอนสลับ Edit Mode)

ในการออกแบบระบบแก้ไขข้อมูลสไตล์ Apple (Fluid & Stable UI) ห้ามปล่อยให้ความกว้างหรือความสูงของแถวขยับอย่างรุนแรงเมื่อกดสลับโหมด ให้ใช้หลักการดังนี้:

1. **ขนาดของ Border (เส้นขอบ)**:
   - *ปัญหา*: การใส่ Class `border-2` หรือ `border` ทันทีเมื่อเข้า Edit Mode จะเป็นการเพิ่มขนาดกว้าง/สูงขึ้นมา 2-4px ดัน Element ข้างๆ ขยับหนี
   - *วิธีแก้*: ให้กำหนดขนาด border ไว้ตั้งแต่โหมดปกติแต่ระบุสีเป็นโปร่งใส (`border border-transparent` หรือ `border-2 border-transparent`) แล้วตอนสลับเป็น Edit Mode ค่อยสลับสีเป็นสีขอบที่ต้องการ (เช่น `border-slate-300` หรือ `border-blue-500`) ขนาดของ Element จะไม่ขยับเลย
2. **ปุ่ม Conditional Rendering (เช่น ไอคอนถังขยะ 🗑️ หรือลิงก์ไปยังโฟลเดอร์)**:
   - *ปัญหา*: การเขียนเงื่อนไขแบบ `{isEditMode && <button>...</button>}` จะแทรก element ใหม่เข้ามาใน Grid/Flexbox แย่งพื้นที่ input ข้างเคียงจนเบียดหดเล็กลง
   - *วิธีแก้*:
     - *วิธีที่ 1 (จองพื้นที่)*: เรนเดอร์ตัวปุ่มไว้ตลอดเวลาแต่ใช้อนิเมชั่นความโปร่งใสและการควบคุม pointer-events เช่น `className={cn("transition-opacity", isEditMode ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")}`
     - *วิธีที่ 2 (แยก Layout)*: ย้ายปุ่มถังขยะหรือปุ่มจัดการอื่นๆ ออกไปอยู่ที่ Header ของการ์ดที่แยกสัดส่วนชัดเจน จะได้ไม่ดึงความกว้างของช่องอินพุตในตารางข้อมูล
3. **การสลับประเภท Tag (span/p เป็น Input)**:
   - *ปัญหา*: การเปลี่ยน Tag เช่นจาก `<span>text</span>` ไปใช้ `<Input />` ของ shadcn ใน Edit Mode จะทำให้ความสูงแถวเปลี่ยนทันทีเนื่องจาก Input มี Padding/Line-height ของตัวเอง
   - *วิธีแก้*: ใช้คอมโพเนนต์ `<Input />` ครอบไว้ตลอดเวลา แต่ตั้งค่า `disabled` หรือ `readOnly` ในโหมดปกติ และใช้คลาส Tailwind จัดแต่งให้ดูเหมือนตัวหนังสือธรรมดา (เช่น ไม่มีเส้นขอบ/ไม่มีพื้นหลัง) เมื่อกด Edit ค่อยเปิดเส้นขอบและพื้นหลังกลับมา เพื่อความสูงแถวที่เท่ากัน 100%
4. **รูปภาพแนบที่กำลังโหลด (Loading/Skeleton State)**:
   - *ปัญหา*: ในจังหวะดาวน์โหลดรูปภาพจาก Supabase/Google Drive รูปภาพยังไม่ถูกเรนเดอร์ขนาดความสูงจึงเป็น 0px เมื่อรูปโหลดเสร็จและเด้งขึ้นมาจะขยับดันช่องรายละเอียดข้างเคียง (Layout Shift)
   - *วิธีแก้*: ล็อกสัดส่วนและขนาดของกล่องรูปภาพให้ตายตัวเสมอ เช่นใช้ `w-32 h-32` หรือ `aspect-square` ร่วมกับ `bg-slate-100` เพื่อจองพื้นที่ไว้ล่วงหน้าขณะรูปภาพกำลังโหลด

## 4. Knowledge Relationships
- Depends On (ต้องพึ่งพา): [[src/components/modals/UpdateModal.tsx]]
- Ingested Raw Source: [[1_raw/LAYOUT_AND_ANIMATION_IMPROVEMENTS_320751320.md]], [[1_raw/LAYOUT_STABILITY_GUIDE_1204891362.md]]

## 5. Regression Fix: Modal Width Reverted
[Updated: 2026-05-28]

พบ regression ที่ `UpdateModal` กลับไปใช้ `max-w-3xl` ทำให้เมื่อเข้า Edit Mode ช่อง input หลายช่องใน item header ถูกบีบและ layout เพี้ยนจากเดิม.
แก้โดยคืน modal เป็น `max-w-5xl`, ใส่ `min-w-0` ให้ content area, ใส่ `shrink-0` ให้กล่องจำนวน/ปุ่มลบ, และจัด field หลักเป็น grid `lg:grid-cols-12` เพื่อกันการเบียดกันบนจอกว้าง.

### Knowledge Relationships
- Depends On (ต้องพึ่งพา): [[src/components/modals/UpdateModal.tsx]]
- Impacted By (ได้รับผลกระทบจาก): [[../nextjs-frontend/rework-module.md]]
- Contradicts (ข้อขัดแย้ง): [Deprecated] โค้ดที่ใช้ `max-w-3xl` ไม่ตรงกับ guideline เดิมที่กำหนดให้ `UpdateModal` ใช้ `max-w-5xl` สำหรับ Edit Mode

## 6. Edit Mode Exit Guard & Save Separation
[Updated: 2026-05-28]

`UpdateModal` แยกปุ่มบันทึกเป็น 2 flow แล้ว: `บันทึกการแก้ไข` ใช้เฉพาะตอนอยู่ใน Edit Mode และไม่แตะ workflow status; `บันทึกสถานะเคส` ใช้ตอนโหมดปกติเพื่อเดินสถานะ/valuation flow.
เมื่อผู้ใช้ออกจาก Edit Mode จะมี confirmation modal 2 copy: แบบตั้งใจ (`ออกจากโหมดแก้ไข?`) และแบบไม่ตั้งใจจากการปิด modal (`ปิดหน้าต่างโดยยังไม่บันทึก?`) เพื่อกันข้อมูลแก้ไขหายเงียบ.

### Knowledge Relationships
- Depends On (ต้องพึ่งพา): [[src/components/modals/UpdateModal.tsx]]
- Impacted By (ได้รับผลกระทบจาก): [[case-name-updates.md]], [[../nextjs-frontend/rework-module.md]]
- Contradicts (ข้อขัดแย้ง): [Deprecated] ปุ่ม `ยืนยันการบันทึก` เดิมทำทั้ง edit save และ status save ใน handler เดียว ทำให้เสี่ยง update ซ้ำ/เปลี่ยน status โดยไม่ตั้งใจ
