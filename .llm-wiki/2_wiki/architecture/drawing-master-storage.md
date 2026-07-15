# ระบบจัดการไฟล์ Drawing และ Master ภายใน (Storage Module & Gap Analysis)

## 1. ภาพรวมของโมดูล (Overview)
ระบบ Storage ถูกออกแบบมาเพื่อจัดเก็บไฟล์เอกสารวิศวกรรม โดยแบ่งเอกสารออกเป็น 2 ประเภทหลัก:
1. **Customer Drawing (`drawing`)**: ไฟล์แบบแปลนจากลูกค้า ซึ่งถือเป็นเอกสารอ้างอิงหลัก
2. **Internal Master (`master`)**: ไฟล์แบบแปลนและวิธีทำงานที่จัดทำขึ้นภายในบริษัท โดยอิงจากเอกสารของลูกค้า

ระบบนี้พัฒนาขึ้นเพื่อแก้ไขปัญหาไฟล์ไม่อัปเดต การตั้งชื่อไฟล์ที่ไม่เป็นมาตรฐาน และป้องกันการนำแบบแปลนเก่าไปใช้ในการผลิต

## 2. ฟีเจอร์หลัก (Key Features)

### 2.1 AI-Assisted Upload & Naming (ระบบวิเคราะห์เอกสารอัตโนมัติ)
เพื่อลดปัญหา Human Error ในการตั้งชื่อไฟล์ ระบบได้มีการนำ **Google Gemini (Vision API)** เข้ามาช่วยวิเคราะห์หน้าแรกของไฟล์ PDF:
- เมื่ออัปโหลดไฟล์ PDF ระบบจะส่งข้อมูลให้ AI สกัด Metadata 5 ฟิลด์หลัก: `Item Code`, `Drawing No`, `Revision`, `Part Name`, และ `Customer Name`
- นำข้อมูลเหล่านั้นมาจัดรูปแบบการตั้งชื่อไฟล์ให้เป็นมาตรฐานเดียวกัน:
  **Pattern:** `[Item Code] [Drawing No] rev.[Revision] [Part Name].pdf`
  **Example:** `104-5000 660A1010 rev.A NAME PART.pdf`

### 2.2 Gap Analysis (การตรวจสอบและติดตามเอกสาร)
ระบบจะทำการจับคู่ (Cross-Match) เอกสารประเภท `drawing` เข้ากับ `master` โดยใช้เงื่อนไขดังนี้:
- ค้นหาด้วย **Item Code** เป็นหลัก หากไม่มีจะใช้ **Drawing No**
- หากพบ `drawing` ที่ **ไม่มี** `master` ระบบจะขึ้นการแจ้งเตือน (Missing Master Alert) ในหน้า Dashboard ทันที 
- ช่วยให้ทีม Document Control หรือวิศวกร ทราบได้ทันทีว่าเอกสารลูกค้ารายการใดยังไม่ได้จัดทำ Internal Master

### 2.3 Revision Control (การควบคุมเวอร์ชันที่ใช้งาน)
- **Active Version**: เพื่อป้องกันความผิดพลาดในสายการผลิต ระบบจะต้องดึงเฉพาะ **ไฟล์ที่มี Revision สูงสุด** ของ Drawing No นั้นๆ มาเป็นตัว Active เสมอ
- ไฟล์เก่าจะไม่ถูกลบ แต่จะถูกลดสถานะเป็นประวัติ (Archive/Historical) ทำให้สามารถตรวจสอบย้อนหลังได้ (Audit Trail)

## 3. สถาปัตยกรรมระบบ (Architecture)
1. **Frontend**: Next.js (Client Component) สร้าง `UploadModal` จัดการเรื่องฟอร์มและการบีบอัด Base64 
2. **AI Layer**: `src/app/api/drawings/route.ts` เรียกใช้ Google GenAI SDK สำหรับ Parse PDF
3. **Storage**: ใช้ `ragSupabaseServer` จัดเก็บไฟล์เอกสาร PDF ลงใน Bucket `drawings` ของ Supabase (แยกจาก Bucket Cloudinary ของโปรเจกต์หลัก)
4. **Database**: ตารางข้อมูลใน Supabase เก็บ Metadata และ URL แบบ Public/Signed URL เพื่อการเข้าถึงอย่างปลอดภัย
