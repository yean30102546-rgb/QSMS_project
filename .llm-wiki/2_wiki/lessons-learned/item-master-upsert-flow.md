# Title: Item Master Upsert & Auto Fill Sync Flow
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
ระบบการบันทึกข้อมูลสินค้า (Item Master) ทำงานผ่าน API Route `/api/rework` (Action: `saveItemMaster`) โดยจะบันทึกหรืออัปเดตลงตาราง `rework_master_items` ใน Supabase 

ระบบปรับปรุงล่าสุดใช้แนวคิด **Flexible Auto Fill & Smart Master Upsert** ดังนี้:
1. **Debounce 600ms** บนฟิลด์ `ItemNumber` และ `ItemCode` เมื่อผู้ใช้พิมพ์หยุด ระบบจะเรียก API ไปหาคู่ของฟิลด์ที่เหลือ + ชื่อสินค้าในฐานข้อมูล Master และเติมให้อัตโนมัติ โดยอ้างอิงตามระดับความสำคัญ (Priority): ตรวจสอบ `Item Number` ก่อนเป็นอันดับแรก หากไม่พบจึงค้นจาก `Item Code`
2. **Inline Badges** แสดงสถานะการตรวจสอบรายสินค้าเป็นสีสันสดใสโดยตรงบนหน้าจอหลัก:
   - `พบในระบบ` (สีเขียว)
   - `สินค้าใหม่` (สีเหลือง)
   - `กำลังตรวจสอบ...` (สีน้ำเงิน)
   - `กำลังอัพเดตข้อมูล...` (สีม่วง/Indigo)
   - `รหัสซ้ำซ้อนในระบบ` (สีแดง/Rose) - แสดงผลเมื่อตรวจพบ Conflict ระหว่าง inputs หรือในฐานข้อมูล
3. **Smart Master Upsert & Protection**:
   - **Complete Item Protection**: หากในฐานข้อมูลมีข้อมูลครบทั้ง 3 ฟิลด์แล้ว (Item Number, Item Code, Item Name) ระบบจะข้ามการอัปเดตเพื่อป้องกันการเขียนทับข้อมูลที่ถูกต้องจากความผิดพลาดของผู้ใช้ (Human Error)
   - **Incomplete Item Auto-Update**: ระบบจะสั่งอัปเดตฟิลด์ที่ขาดหายไปลงฐานข้อมูลกลาง (ทั้ง Supabase และ Google Sheets) อัตโนมัติ เฉพาะในกรณีที่รายการแถวเดิมมีค่าไม่ครบ 3 ฟิลด์เท่านั้น
4. **Conflict Prevention & Modal Integration**: 
   - หากผู้ใช้กรอก `Item Number` ไปตรงกับสินค้า A แต่กรอก `Item Code` ไปตรงกับสินค้า B ในฐานข้อมูล ระบบจะแสดงสถานะ `conflict` (รหัสซ้ำซ้อนในระบบ)
   - **Conflict Modal**: ระบบจะแสดงหน้าต่างแจ้งเตือนทันทีที่พบความขัดแย้ง เพื่อบล็อกการทำงานและบังคับให้ผู้ใช้แก้ไขรหัสให้ถูกต้องก่อนดำเนินการต่อ
   - ปิดการใช้งาน (disable) ปุ่มบันทึกเคสเพื่อความปลอดภัยจนกว่าสถานะ Conflict จะหายไป

5. **Transaction Integrity (Atomic Submission)**:
   - **Sequencing Strategy**: ในกระบวนการบันทึกข้อมูล Item Master ระบบจะทำการซิงค์ไปยัง Google Sheets ผ่าน GAS Proxy เป็นอันดับแรก **ก่อน** ที่จะทำการ Update หรือ Insert ข้อมูลลงใน Supabase
   - **Rollback on Failure**: หาก GAS Proxy ส่งคืนค่าความล้มเหลว (เช่น ไม่สามารถเขียนลง Sheet ได้) ระบบจะระงับการทำงานในฝั่ง Supabase ทันทีและแจ้ง Error กลับไปยังผู้ใช้ เพื่อให้ข้อมูลทั้งสองฝั่ง (Sheets และ Supabase) ตรงกันเสมอ (Consistence Consistency)

## 2. Technical Code Snippet (Best Practice)
การตรวจสอบ Conflict ใน Backend (`route.ts`):
```typescript
        // 1. Conflict Check: check if itemNumber matches one row and itemCode matches another
        let matchByNumber: any = null;
        let matchByCode: any = null;

        if (trimmedNum) {
          const { data: numMatches } = await supabaseServer
            .from('rework_master_items')
            .select('*')
            .eq('item_number', trimmedNum)
            .limit(1);
          if (numMatches && numMatches.length > 0) {
            matchByNumber = numMatches[0];
          }
        }

        if (trimmedCode) {
          const { data: codeMatches } = await supabaseServer
            .from('rework_master_items')
            .select('*')
            .eq('item_code', trimmedCode)
            .limit(1);
          if (codeMatches && codeMatches.length > 0) {
            matchByCode = codeMatches[0];
          }
        }

        if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
          return NextResponse.json(
            { success: false, error: 'CONFLICT', message: 'รหัสสินค้ามีความซ้ำซ้อนในระบบ' },
            { status: 409 }
          );
        }
```

## 3. Knowledge Relationships
Depends On: [[src/app/api/rework/route.ts]] (API Endpoint สำหรับการ Query และ บันทึกลง Supabase), [[gas/Code.gs]] (ฟังก์ชัน `saveItemMaster` สำหรับเซฟลง Google Sheets)

Impacted By: [[src/modules/rework/ReworkApp.tsx]] (จัดการสถานะ verificationStatus, debounce, clear form และ save master), [[src/components/tabs/AddCaseTab.tsx]] (แสดงผล Inline Badges และปุ่ม 🔍 ค้นหา), [[src/services/validation.ts]] (ฟังก์ชัน `isSaveDisabled` ป้องกันการเซฟเมื่อเกิด conflict)

Contradicts: เดิมเคยปล่อยให้มีการเซฟทับข้อมูลกลางทุกครั้งที่มีการเปลี่ยนชื่อในฟอร์ม ปัจจุบันเพิ่มกลไก Complete Item Protection เพื่อรักษาความถูกต้องของข้อมูล Master

---

## 4. Known Bugs & Fixes (Historical)
- **Partial Updates in GAS**: เดิม `saveItemMaster` ใน Google Apps Script คืนค่า success ทันทีที่พบว่า `ItemNumber` ซ้ำ โดยไม่ยอมอัปเดตฟิลด์ `ItemCode` หรือ `ItemName` ที่อาจขาดหายไปหรือเปลี่ยนไป ส่งผลให้เมื่อกรอก ItemCode ใหม่ระบบก็ยังไม่จำค่าลงชีท. *การแก้ไข*: ให้โค้ดตรวจเช็คและทำการอัปเดต (`setValue`) ทับเซลล์เดิมหากข้อมูลเปลี่ยนไป.
- **Auto-Fill Badge Reset**: หากมี Item Name อยู่แล้ว (จากการ Autofill ก่อนหน้า) แต่พิมพ์ Item Code เพิ่มเข้าไป ระบบจะไปยิง API ใหม่แต่ถ้าในระบบ (Supabase) ยังไม่มีรหัสนั้น จะทำให้ badge จากสีเขียว (พบในระบบ) หลุดกลายเป็นสีเหลือง (สินค้าใหม่). *การแก้ไข*: เช็คใน `verifySingleItem` หาก `field === 'itemCode'` และ `itemName` กับ `itemNumber` ไม่เป็นค่าว่าง ให้คงสถานะ `verified` ไว้เสมอ.
- **Session Storage Race Condition**: ในตอนเคลียร์ฟอร์ม (`clearAllForm`) การลบ key ออกจาก `sessionStorage` อาจชนกับการทำงานของ `useEffect` ที่สั่งบันทึก `formItems` ทันทีเมื่อ state เปลี่ยน ส่งผลให้ข้อมูลถูกเขียนทับกลับเข้ามาใหม่ ฟอร์มจึงเคลียร์ไม่สำเร็จ. *การแก้ไข*: ในฟังก์ชัน `clearAllForm` ให้ทำการ `sessionStorage.setItem` เขียนค่าเริ่มต้น (empty form) ทับไปเลยแทนที่จะลบ key ออก.
- **Master Overwriting & Conflicts**: การอนุญาตให้คนเปลี่ยนชื่อสินค้าได้อย่างอิสระบน Add Case Form ทำให้อาจไปอัปเดตทับข้อมูลจริงของสินค้าตัวอื่น และความเสี่ยงในการพิมพ์รหัสสินค้า ชนกับบาร์โค้ดของสินค้าคนละตัว. *การแก้ไข*: นำแนวคิด Complete Item Protection และ Conflict Prevention มาใช้ทั้งบน Next.js backend และ Google Apps Script backend.
