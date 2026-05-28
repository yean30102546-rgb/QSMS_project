# Title: Project Status, Lessons Learned & Resolved Mistakes
อัปเดตเมื่อ: 2026-05-28

## 1. Summary & Current Status
สรุปสถานะปัจจุบันของระบบ QSMS Rework แอปพลิเคชันประกอบด้วยฟีเจอร์การบันทึกเคส Rework, ระบบกรอก/ดึงข้อมูลอัตโนมัติจาก Item Master, แดชบอร์ดสรุปสถิติมุมมองสาเหตุและผู้รับผิดชอบ, โมดอลวาดเขียนตกแต่งภาพ และระบบความปลอดภัยจัดการสิทธิ์ (RBAC) 
สถานะโปรเจกต์: **เสถียร (Stable)** สามารถรันคำสั่ง `npm run build` ผ่านได้ 100% ไร้ข้อผิดพลาด TypeScript

ล่าสุดได้ทำการเพิ่มระบบ **Strict Integrity Rules** เพื่อป้องกันข้อมูลขัดแย้ง (Identity Conflict), บังคับการแนบรูปภาพหลักฐาน (Evidence Integrity) และรับประกันความถูกต้องของการบันทึกข้อมูลข้ามระบบ (Transaction Integrity)

---

## 2. สิ่งที่ผิดพลาดและวิธีแก้ไข (Mistakes & Resolutions)

### E. ปัญหาข้อมูลขัดแย้งระหว่างรหัสสินค้าและบาร์โค้ด (Identity Mismatch)
* **ปัญหา:** ผู้ใช้กรอก Item Number ของสินค้า A แต่กรอก Barcode (Item Code) ของสินค้า B ทำให้ข้อมูลในระบบเกิดความซ้ำซ้อนและผิดพลาด (Identity Fragmentation)
* **วิธีแก้ไข:** พัฒนาระบบตรวจเช็คใน API `verifyItem` และเพิ่ม **Conflict Modal** แจ้งเตือนผู้ใช้ทันทีเมื่อตรวจพบความขัดแย้ง พร้อมบล็อกปุ่มบันทึกเคสจนกว่าข้อมูลจะได้รับการแก้ไข

### F. การบันทึกข้อมูลสำเร็จเพียงบางส่วน (Partial Submission Success)
* **ปัญหา:** ในกระบวนการบันทึก Item Master เดิม ระบบอาจบันทึกลง Supabase สำเร็จแต่ล้มเหลวในการซิงค์ไปยัง Google Sheets (หรือในทางกลับกัน) ทำให้ข้อมูลระหว่างสองฐานข้อมูลไม่ตรงกัน
* **วิธีแก้ไข:** นำแนวคิด **Atomic Sequencing** มาใช้ โดยปรับลำดับให้ระบบทำการซิงค์ไปยัง Google Sheets ผ่าน GAS Proxy ให้สำเร็จเป็นอันดับแรก หากไม่สำเร็จระบบจะระงับ (Abort) การแก้ไขข้อมูลใน Supabase ทันที

---

## 3. สิ่งที่ได้เรียนรู้ (Lessons Learned)

### D. ความสำคัญของ Evidence Integrity ในระบบโรงงาน
* **สิ่งที่เรียนรู้:** การปล่อยให้ผู้ใช้บันทึกเคสโดยไม่มีรูปภาพหลักฐานทำให้ระบบขาดความน่าเชื่อถือและตรวจสอบย้อนหลังไม่ได้ การย้ายการตรวจสอบ (Validation) จำนวนรูปภาพมาไว้ที่ระดับ Component และ Services ช่วยให้สามารถปิดปุ่มบันทึกได้ทันที (Visual Feedback) และสร้างวินัยในการทำงานให้กับพนักงานหน้างานได้ดีขึ้น

---

## 4. Knowledge Relationships
Depends On (ต้องพึ่งพา):
- [[lessons-learned/rbac-casing-and-e2e.md]] เกี่ยวกับการกำหนดสิทธิ์
- [[lessons-learned/duplicate-items-validation.md]] เกี่ยวกับการคัดกรองความซ้ำซ้อน
- [[lessons-learned/item-master-upsert-flow.md]] เกี่ยวกับระบบจัดการ Master Data และ Integrity
