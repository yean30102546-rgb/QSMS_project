# Bug Review: Edit Mode Save Failed (fetch failed) & Name Not Updating
[วันที่อัปเดต: 2026-05-28]

## 1. Summary & Current Implementation
**ปัญหาที่พบ**: 
1. เมื่อผู้ใช้แก้ไขข้อมูลเคสและแนบไฟล์ OR จากนั้นกดบันทึก ระบบเกิด Error `Google Sheets sync failed: fetch failed` และการบันทึกถูกยกเลิก
2. ชื่อเคส (caseName) และแหล่งที่มา (Source) ไม่อัพเดทตามที่แก้ไข

**การวิเคราะห์สาเหตุ (Root Cause)**:
- **`fetch failed`**: การแนบไฟล์รูปภาพในโหมดแก้ไขถูกแปลงเป็น Base64 และส่งพร้อมข้อมูลทั้งหมดผ่าน Next.js API Route เพื่อส่งต่อ (Proxy) ไปยัง Google Apps Script (GAS) เนื่องจาก Payload มีขนาดใหญ่ (จาก Base64 ของไฟล์) และกระบวนการของ GAS ในการบันทึกภาพลง Google Drive ทำงานช้า ทำให้เกิด Connection Timeout ที่ฝั่ง Node.js (เกินขีดจำกัดเวลาของ Next.js/Vercel) จึงเกิด Error `TypeError: fetch failed` 
- **ชื่อเคสไม่อัพเดท**: เป็นผลพวงจากการเกิด Error ในกระบวนการบันทึกข้อมูล (Rollback) ทำให้ไม่มีการบันทึกข้อมูลใดๆ ทั้งสิ้น นอกจากนี้ในโค้ด `UpdateModal.tsx` ยังมีเงื่อนไข `if (isAdmin)` บล็อคการส่งฟิลด์ `source` ทำให้เกิดความไม่สอดคล้องกันของการจัดการ State

## 2. Technical Code Snippet (Best Practice)
ยังไม่มีการแก้ไขโค้ด (อยู่ในขั้นตอนวางแผน)

**แนวทางการแก้ไขที่เสนอ**:
1. (ระยะสั้น) ปรับเพิ่ม `bodySizeLimit` ของ Next.js API Route ให้รองรับ Payload ขนาดใหญ่ขึ้น
2. (ระยะยาว/แนะนำ) เปลี่ยนไปใช้ระบบอัพโหลดไฟล์ภาพเข้าสู่ Supabase Storage โดยตรง (Upload directly from Client) แทนการแปลงเป็น Base64 เพื่อป้องกันปัญหาคอขวดและ Timeout อย่างถาวร
3. ปลดล็อคเงื่อนไข `isAdmin` เฉพาะในส่วนของการแก้ Source และ Case Name ให้เชื่อมโยงกันอย่างถูกต้อง

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- Depends On (ต้องพึ่งพา): [[UpdateModal.tsx]], [[api.ts]], [[route.ts]], [[Code.gs]]
- Impacted By (ได้รับผลกระทบจาก): Next.js API Execution Timeout, Payload Body Size Limit
- Contradicts (ข้อขัดแย้งที่เคยพบ): เงื่อนไข Role-check ระหว่างการอนุญาตให้เลือก Dropdown แต่ไม่อนุญาตให้เซฟ (เนื่องจากติด `isAdmin`)
