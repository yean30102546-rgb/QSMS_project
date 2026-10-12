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

## 4. Ground Truth Dataset & OCR Evaluation Pipeline [Added: 2026-10-12]

### 4.1 ชุดข้อมูลทดสอบมาตรฐาน (Benchmark Datasets)
ระบบได้จัดทำชุดข้อมูลทดสอบ Ground Truth จำนวน 100 ฉบับ แบ่งเป็น:
1. **Customer Drawings (50 ฉบับ)**: อยู่ใน `Drawing files/Test_50_Unique/` พร้อม `test_manifest.csv`
2. **Internal Master Sheets (50 ฉบับ)**: อยู่ใน `Master files/Test_50_Unique/` พร้อม `test_manifest.csv`
- ยืนยันความสมบูรณ์และเอกลักษณ์ของไฟล์ด้วย SHA256 Hash และสถานะ `GroundTruthStatus = "Verified"`
- มีแบบฟอร์มตรวจสอบค่าเฉลยมาตรฐาน `Ground_Truth_Manual_Entry_Form.xlsx` ที่รูทโปรเจกต์ (คงโครงสร้าง 20 คอลัมน์เดิม 100%)

### 4.2 รายการ 11 ฟิลด์เปรียบเทียบและการ Normalize
สกัดผ่าน `src/app/api/drawings/route.ts` ร่วมกับ Normalizers ใน `src/app/api/drawings/normalizers.ts`:
1. `drawing_number`: รหัสแบบแปลน (Drawing No / Doc No)
2. `revision`: เลขเวอร์ชัน (Pad 2 หลัก เช่น 00, 02, 07)
3. `document_type`: ประเภทเอกสาร (`drawing` หรือ `master`)
4. `part_name`: ชื่อชิ้นส่วน/ผลิตภัณฑ์
5. `customer_name`: ชื่อลูกค้า (Normalized Aliases: ENEOS, PTTOR, VALVOLINE ฯลฯ)
6. `item_code`: รหัสสินค้า 6-8 หลัก
7. `item_number`: รหัสสูตรการผลิต 13 หลัก (Drawing จะเป็น null)
8. `package_size`: ขนาดบรรจุภัณฑ์ (`[Vol] x [Qty] L.` หรือ `[Vol] L.`)
9. `oil_group`: กลุ่มน้ำมัน (`ENGINE OIL` หรือ `GEAR OIL`)
10. `boxes_per_pallet`: จำนวนกล่องต่อพาเลท (ตัวเลข หรือ "ตามความเหมาะสม")
11. `shelf_life`: อายุการเก็บรักษา (`[N] years`)

### 4.3 โมเดล AI และสถาปัตยกรรม Cascade Fallback
- **Active Models**: `gemini-3.1-flash` (หลัก), `gemini-3.1-flash-lite` (เร็วกว่า/ประหยัดโควตา), `gemini-3.8-flash` (ตัวสำรองประสิทธิภาพสูง)
- **Automatic Failover**: สลับโมเดลอัตโนมัติเมื่อเกิด HTTP 503/429 หรือโควตาหนาแน่น

### 4.4 ผลการประเมินทางสถิติ (Empirical Benchmark Results)
- **ชุดข้อมูล Drawing (50 ฉบับ)**: ความถูกต้อง 248/250 ฟิลด์หลัก (99.20%), Wilson Score 95% CI: [97.13%, 99.78%]
- **ชุดข้อมูล Master (50 ฉบับ)**: ความถูกต้อง 249/250 ฟิลด์หลัก (99.60%), Wilson Score 95% CI: [97.77%, 99.93%]
- **ผลรวม 11 ฟิลด์วิชาการ (550 ฟิลด์ข้อมูล)**: ความถูกต้อง 530/550 ฟิลด์ (96.36%), Wilson Score 95% CI: [94.44%, 97.64%] (สอดคล้องกับตาราง 4.4 ในเล่มวิทยานิพนธ์)
