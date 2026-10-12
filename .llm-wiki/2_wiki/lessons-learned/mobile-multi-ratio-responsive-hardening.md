# Mobile Multi-Ratio Responsive Hardening (320px – 430px)

## บริบทและปัญหา (Context & Problem)
ระบบได้รับการออกแบบและทดสอบเบื้องต้นบนจอ Desktop และ iPad/Tablet (768px – 1024px) แต่เมื่อผู้ใช้งานจริงเปิดผ่านสมาร์ตโฟนหลายอัตราส่วน (ตั้งแต่ iPhone SE 320px–375px, Android Galaxy/Pixel 360px–412px, จนถึง iPhone Pro Max 430px) พบปัญหาคอขวด 7 ประการ:
1. **Unreachable Gap Analysis:** แถบ Switcher ใน Storage ถูกซ่อนด้วย `hidden md:flex` ทำให้ผู้ใช้มือถือไม่สามารถเข้าถึงหน้า Gap Analysis ได้
2. **Horizontal Table Overflow & Truncation:** ตาราง 6–7 คอลัมน์กว้างเกินหน้าจอมือถือ ทำให้ผู้ใช้ต้อง Scroll ซ้าย-ขวาอย่างยากลำบาก และปุ่ม Action ตกขอบ
3. **Tab Wrapping Disorder:** แถบ Tab เลือกเอกสารใช้ `flex-wrap` ตัดตกเป็น 3 แถวแนวตั้ง กินพื้นที่แนวตั้ง
4. **Header Button Collision:** แผงตรวจทานสเปก (Inspection Panel) มีปุ่มคำสั่ง 6 ปุ่มเรียงกันใน Header ทำให้ชนกับชื่อแบบแปลนและบีบข้อความจนกลายเป็น `...`
5. **Awkward 3-way Split on Phone:** การแบ่งดู Split (PDF ครึ่งบน สเปกครึ่งล่าง) ไม่เหมาะกับจอมือถือแนวตั้งที่สูงเพียง 600–800px
6. **Wasted Outer Padding:** หน้าระบบ Rework ตั้ง Padding `p-8` (32px ซ้าย + 32px ขวา) เสียพื้นที่ 64px บนจอมือถือที่กว้างเพียง 320px–360px
7. **Pagination Explosion:** ปุ่ม Pager 10 ปุ่มบนมือถือล้นขอบจอ

## แนวทางแก้ไข (Solutions Implemented)
1. **Mobile Segmented Switcher (`md:hidden`):**
   - เพิ่มแถบเลือกแท็บ `All Documents` / `Gap Analysis` บนมือถือโดยเฉพาะ
2. **Mobile Card Views & Native Table Preservation:**
   - ใช้โมเดล Hybrid: บนมือถือ (`md:hidden`) เรนเดอร์การ์ดข้อมูล Mobile Card แสดงรหัสสินค้า Revision สเปกบรรจุภัณฑ์ และปุ่ม Action ชัดเจน
   - บนแท็บเล็ตและจอใหญ่ (`hidden md:table`) เรนเดอร์ Desktop Table ตามเดิม
3. **Scrollable Swipe Tabs (`overflow-x-auto scrollbar-hide flex-nowrap`):**
   - แถบแท็บไม่ตัดตกบรรทัด เลื่อนแนวนอนด้วยนิ้วมือได้ลื่นไหลเหมือน Native App
4. **Header Streamlining & Compact Action Buttons:**
   - ซ่อนปุ่มคำสั่งเสริมบนมือถือ คงไว้เฉพาะปุ่มหลัก (เช่น หมุน 90° แบบวนลูป)
   - ปรับข้อความปุ่ม Action ให้สั้นกระชับบนมือถือ (`[Excel]`, `[ลบ]`, `[ร่าง]`, `[บันทึก]`)
5. **2-Way Toggle for Mobile Inspection:**
   - ตัดโหมด Split บนจอมือถือออก เหลือตัวเลือก 2 โหมดชัดเจน: `[แบบแปลน (PDF)]` และ `[สเปก (Metadata)]`
6. **Responsive Outer Padding:**
   - ปรับจาก `p-8 md:p-10 lg:p-12` เป็น `p-3 sm:p-6 md:p-10 lg:p-12` คืนพื้นที่หน้าจอ 40px ให้ฟอร์มบนมือถือ
7. **Compact Pager:**
   - บนหน้าจอ `<sm` แสดงตัวบอกหน้ากระชับ `[Prev] หน้า X / Y [Next]`

