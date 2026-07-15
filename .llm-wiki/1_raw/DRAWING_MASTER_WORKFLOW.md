# Workflow & Guidelines for Drawing & Master Document Storage

## 1. Requirement Overview
- **Purpose**: แทนที่ระบบ Roster เดิมด้วย Storage Module สำหรับจัดการไฟล์เอกสารวิศวกรรม
- **File Types**:
  1. **Drawing**: ไฟล์แบบแปลนจากลูกค้า (Customer)
  2. **Master**: ไฟล์แบบแปลนภายใน (Internal) ที่อ้างอิงและปรับปรุงจาก Drawing ของลูกค้า
- **Revision Control**: ต้องควบคุม Revision เพื่อให้เวอร์ชันที่ถูกเรียกใช้หรือ Active เป็นเวอร์ชันล่าสุดเสมอ
- **Gap Analysis (Cross-Checking)**: ใช้ Customer Drawing เป็นหลักฐานอ้างอิงเพื่อตรวจสอบว่า Master ตัวใดยังขาดหายไป (Missing Master) และแจ้งเตือนให้ผู้รับผิดชอบทยอยจัดทำและนำมาเชื่อมโยงกัน
- **AI Automation**: อ่านไฟล์ PDF ที่อัปโหลด และใช้ AI สกัดข้อมูลออกมาเพื่อทำ Auto-Rename ลดข้อผิดพลาดจากการพิมพ์ (Human Error) 
- **Naming Pattern**: `[Item Code] [Drawing No] rev.[Revision] [Part Name].pdf` ตัวอย่างเช่น `104-5000 660A1010 rev.A NAME PART.pdf`

## 2. Recommended Workflow & Architecture

การออกแบบสถาปัตยกรรมจะอิงจากเทคโนโลยีที่มีใน QSMS Project (Next.js, Supabase, Google Gemini)

### Step 1: Upload & AI Metadata Extraction (Auto-Parsing)
1. **Client-Side**: ผู้ใช้อัปโหลดไฟล์ PDF ผ่าน `UploadModal` หน้าเว็บจะแปลงไฟล์เป็น Base64
2. **AI Processing**: ส่งข้อมูลไปยัง API (`/api/drawings`, action: `parse_pdf`) เพื่อเรียกใช้ **Google Gemini (Vision/Flash)** สกัดข้อความจากหน้าแรกของ PDF
3. **Output**: AI จะส่งกลับ Metadata ได้แก่ `drawing_number`, `revision`, `part_name`, `customer_name`, และ `item_code`

### Step 2: Auto-Rename & Verification
1. **Verification Form**: หน้าเว็บจะนำข้อมูลจาก AI มาใส่ในฟอร์มให้ผู้ใช้ตรวจสอบความถูกต้องอีกครั้ง (Human-in-the-loop)
2. **Standardized Naming**: เมื่อกดยืนยัน ระบบฝั่ง Client หรือ Backend จะสร้างชื่อไฟล์ตาม Pattern อัตโนมัติ:
   `{item_code} {drawing_number} rev.{revision} {part_name}.pdf`

### Step 3: Cloud Storage & Database Record
1. **Supabase Storage**: อัปโหลดไฟล์ PDF เข้าสู่ Bucket ชื่อ `drawings` ของโปรเจกต์ Supabase RAG (เพื่อแยกสัดส่วนจากไฟล์รูปภาพหลักฐาน Cloudinary)
2. **Database Insert**: บันทึกข้อมูลลงตาราง `documents` (หรือตารางเทียบเท่า) โดยเก็บ Type ว่าเป็น `drawing` หรือ `master` รวมถึง URL ของไฟล์

### Step 4: Gap Analysis (Master Tracking)
1. **Cross-Match Logic**: ระบบดึงข้อมูลจาก Database มาเปรียบเทียบ โดยหา Document ที่ type = `drawing` และเช็คว่ามี Document ที่ type = `master` และมี `drawing_number` (หรือ `item_code`) ตรงกันหรือไม่
2. **Alert UI**: แสดงผลรายการ Drawing ที่ "Missing Master" บน Dashboard ด้วย Badge เตือนสีแดง

### Step 5: Revision Control (Active Versioning)
1. **Version Grouping**: เมื่อมีการเรียกดูไฟล์ ระบบจะ Group ข้อมูลด้วย `drawing_number`
2. **Latest Active**: Query ข้อมูลโดยเรียง `revision` จากใหม่ไปเก่า (DESC) และดึงมาเฉพาะตัวล่าสุด เพื่อการันตีว่าฝ่ายผลิตจะใช้แบบแปลนล่าสุดเสมอ (Active Version)
3. **History**: เวอร์ชันเก่าจะถูกซ่อนไว้ในประวัติ (Revision History) ไม่ถูกลบเพื่อการ Audit แต่จะไม่ถูกดึงมาโชว์ในหน้าหลัก

## 3. Best Practices & Tech Considerations
- **PDF Size Limit**: ควรจำกัดขนาด PDF ไม่เกิน 10MB เพื่อไม่ให้ Gemini API ทำงานหนักและเกิด Timeout
- **AI Prompt**: Prompt ควรกำหนด Output Format เป็น JSON อย่างชัดเจน เพื่อลดความผิดพลาดในการ Parse ผลลัพธ์กลับมาแสดงที่ฟอร์ม
- **Authorization**: ป้องกันไม่ให้ Role ที่ไม่มีสิทธิ์ทำการอัปโหลดหรือเปลี่ยน Revision ได้ (ตรวจสอบที่ API Route ด้วย JWT Token เสมอ)
