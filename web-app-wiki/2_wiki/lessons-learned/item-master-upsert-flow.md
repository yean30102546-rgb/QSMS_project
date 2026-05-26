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
   - **Smart Auto-Merge**: หากผู้ใช้กรอก `Item Number` ที่มีในระบบ (เช่น แถว A ที่มีเฉพาะ Number) และกรอก `Item Code` ที่มีในระบบ (เช่น แถว B ที่มีเฉพาะ Code) ซึ่งเป็นคนละ ID กันในฐานข้อมูล ระบบจะตรวจสอบชื่อสินค้า (Item Name) ของทั้งสองแถว หากไม่มีการขัดแย้งของชื่อ (เช่น ชื่อเหมือนกัน หรือมีแถวที่ชื่อว่างเปล่า) ระบบจะนำข้อมูลของทั้งคู่มา **ยุบรวมเป็นแถวเดียวกัน (Merge)** อัตโนมัติและลบแถวที่ซ้ำซ้อนออก เพื่อช่วยทำความสะอาด Master Data ให้สมบูรณ์ยิ่งขึ้น
4. **Conflict Prevention**: หากตรวจพบความขัดแย้งของชื่อสินค้าจริง (เช่น แถว A และแถว B มีชื่อสินค้าคนละชื่อกันชัดเจน) ระบบจะแสดงสถานะ `conflict` (รหัสซ้ำซ้อนในระบบ) และทำการปิดการใช้งาน (disable) ปุ่มบันทึกเคสเพื่อความปลอดภัย

## 2. Technical Code Snippet (Best Practice)
การตรวจสอบ Conflict และยุบรวมข้อมูล (Auto-Merge) ใน Backend (`route.ts`):
```typescript
        let existingRecord = null;
        let resultData = null;

        if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
          // Check if names conflict
          const name1 = (matchByNumber.item_name || '').trim();
          const name2 = (matchByCode.item_name || '').trim();
          const hasNameConflict = name1 && name2 && name1.toLowerCase() !== name2.toLowerCase();

          if (hasNameConflict) {
            return NextResponse.json(
              { success: false, error: 'CONFLICT', message: 'รหัสสินค้ามีความซ้ำซ้อนในระบบ' },
              { status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }

          // No name conflict: Auto-Merge!
          const mergedName = name1 || name2 || trimmedName;
          const { data: updatedRecord, error: updateErr } = await supabaseServer
            .from('rework_master_items')
            .update({
              item_code: trimmedCode,
              item_name: mergedName,
              item_number: trimmedNum
            })
            .eq('id', matchByNumber.id)
            .select()
            .single();

          if (updateErr) throw updateErr;

          // Delete matchByCode which is now merged into matchByNumber
          const { error: deleteErr } = await supabaseServer
            .from('rework_master_items')
            .delete()
            .eq('id', matchByCode.id);

          if (deleteErr) {
            console.error('Error deleting duplicate master item row during auto-merge:', deleteErr);
          }

          existingRecord = updatedRecord;
        } else {
          existingRecord = matchByNumber || matchByCode;
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
- **Smart Auto-Merge for Fragmented Master Data**: กรณีที่ข้อมูลในระบบเดิมถูกบันทึกแยกกันเป็นคนละแถว (แถวหนึ่งมีแต่ Number อีกแถวมีแต่ Code) เมื่อผู้ใช้กรอกข้อมูลทั้งสองคู่ลงในฟอร์มเดียวกัน จะทำให้เกิดบั๊กขึ้นสถานะ `conflict` ตลอดเวลาและบันทึกเคสไม่ได้. *การแก้ไข*: เพิ่มฟีเจอร์ Smart Auto-Merge เพื่อรวมข้อมูลเข้าด้วยกันและลบแถวซ้ำซ้อนทิ้งในฐานข้อมูลอัตโนมัติ (ทั้งบน Supabase และ Google Sheets) หากชื่อสินค้าไม่ขัดแย้งกัน
