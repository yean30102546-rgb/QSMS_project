# สถาปัตยกรรม: การย้ายระบบจาก GAS สู่ Next.js API และ Secure Auth

## 1. เป้าหมาย (Goal)
ย้ายการทำงานเบื้องหลังของ QSMS จาก Google Apps Script (GAS) มาเป็น Next.js API และ Supabase อย่างเต็มรูปแบบ เพื่อตอบโจทย์สำคัญ 2 ข้อ:
1. เปลี่ยนจากการเก็บ Token ใน `sessionStorage` ไปเป็น HTTP-Only Cookies ที่มีความปลอดภัยสูง
2. ตัดการพึ่งพาระบบภายนอกอย่าง Google Drive และ Google Sheets โดยเปลี่ยนมาใช้ Supabase Storage และ PostgreSQL เป็นศูนย์กลางข้อมูลเพียงหนึ่งเดียว (Single Source of Truth)

## 2. โครงสร้างระบบและคอมโพเนนต์

### 2.1 ระบบยืนยันตัวตน (Server-State JWT)
- **POST `/api/auth/login`**: ตรวจสอบผู้ใช้กับตาราง `rework_profiles` (หรือระบบ Mock เดิม) หากสำเร็จจะสร้าง JWT และเก็บไว้ใน Cookie รูปแบบ HTTP-Only, Secure, SameSite=Lax (ชื่อ `qsms_session`)
- **GET `/api/auth/me`**: หน้าที่อ่าน Cookie `qsms_session`, ตรวจสอบความถูกต้องของ JWT และส่งข้อมูลผู้ใช้ (ชื่อ, Role) กลับมา
- **POST `/api/auth/logout`**: ทำการลบ Cookie `qsms_session` ทิ้ง
- **การกู้คืน Session (Client Session Restore)**: `src/App.tsx` จะดึงข้อมูลจาก `/api/auth/me` ทุกครั้งที่โหลดหน้าเว็บ เพื่อเช็คสถานะล็อกอิน โดยจะมี Loading Spinner แสดงขึ้นมา และจะลบการดึง Token ผ่าน `sessionStorage` ทิ้งทั้งหมด

### 2.2 การย้ายระบบจัดเก็บไฟล์ (Supabase Storage)
- **การอัปโหลดรูปภาพ**: ระบบ `uploadImage` ใน `src/app/api/rework/route.ts` จะถูกเปลี่ยนไปใช้ Supabase JS Admin client เพื่ออัปโหลดไฟล์ Base64 เข้าสู่ Bucket ชื่อ `rework_images` โดยตรง
- **Public URLs**: รูปภาพทั้งหมดจะเข้าถึงได้ผ่าน Supabase Public URL แทนลิงก์ของ Google Drive
- **ฟีเจอร์ที่ถูกยกเลิก**: การสร้าง Folder ใน Google Drive (`caseFolderUrl` และ `orFolderUrl`) จะถูกตัดออกทั้งหมด เนื่องจาก Supabase Storage เป็นระบบเก็บไฟล์แบบ Flat จึงไม่จำเป็นต้องสร้าง Hierarchy เหมือน Google Drive

### 2.3 ความสมบูรณ์ของฐานข้อมูล (Supabase PostgreSQL)
- **การลบฟังก์ชัน `proxyToGAS`**: ระบบจะไม่ทำการซิงค์ข้อมูลลง Google Sheets อีกต่อไปผ่าน `insertCase`, `updateCaseStatus`, หรือ `saveItemMaster` โดยฟังก์ชัน `proxyToGAS` จะถูกลบออกจากระบบโดยสมบูรณ์
- Supabase PostgreSQL จะรับหน้าที่เป็นฐานข้อมูลหลัก (Transactional Database) แต่เพียงผู้เดียว

## 3. ลำดับการทำงาน (Data Flow)
1. **ล็อกอิน**: ผู้ใช้กรอกข้อมูล -> Next.js ตรวจสอบ -> Next.js ออก HTTP-Only Cookie ให้
2. **โหลดหน้าเว็บ**: เปิดเว็บ -> React เรียก `/api/auth/me` -> Next.js อ่าน Cookie -> ส่งข้อมูลผู้ใช้กลับ -> React ตั้งค่า Auth State
3. **อัปโหลดรูปหลักฐาน**: React ส่ง Base64 ไปที่ `/api/rework` (`uploadImage`) -> Next.js อัปโหลดลง Supabase Storage -> ส่งคืน Supabase Public URL
4. **บันทึกเคสใหม่**: React ส่งข้อมูลไปที่ `/api/rework` (`insertCase`) -> Next.js บันทึกลง Supabase PostgreSQL ทันที -> เสร็จสมบูรณ์ (ไม่มีการซิงค์ GAS)

## 4. การจัดการข้อผิดพลาด (Error Handling)
- **Cookie หมดอายุ/ไม่ถูกต้อง**: `/api/auth/me` ส่งค่า 401 กลับมา -> React ล้างข้อมูลและเด้งไปหน้า `/login`
- **ปัญหา Storage อัปโหลดไฟล์**: หาก Supabase มีปัญหา ระบบจะพ่น Error 500 กลับไปที่ฝั่ง Client และแสดง Error UI ทันที เพื่อป้องกันไม่ให้เกิดข้อมูลค้างใน Database โดยไม่มีรูปประกอบ

## 5. ขอบเขตของงาน (Scope Boundaries)
- **สิ่งที่ยังไม่รวมในรอบนี้**: การส่งแจ้งเตือน LINE (LINE Notifications) และระบบ Background Queue สำหรับประมวลผล PDF/RAG จะถูกแยกไปทำในแผนงาน (Plan) รอบถัดไป
