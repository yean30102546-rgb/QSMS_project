# UI Libraries — Mantine & Next.js Resources
[วันที่อัปเดต: 2026-06-29]

## 1. Next.js Foundations
Next.js ช่วยให้การพัฒนาแอปพลิเคชันง่ายขึ้นด้วย:
- **Server Component**: ช่วยเรื่อง SEO และความเร็ว (แม้ QSMS จะเน้น Client Interaction แต่ช่วยโครงสร้าง API Route)
- **File-based Routing**: การจัดการหน้าเว็บผ่านโครงสร้างโฟลเดอร์ `app/`
- **Fast Refresh**: ประสบการณ์การแก้โค้ดที่รวดเร็ว

## 2. Why Mantine? (Knowledge Base)
แม้ปัจจุบันโปรเจกต์จะใช้ **shadcn/ui** แต่ Mantine เป็นทางเลือกที่โดดเด่นและเต็มเปี่ยมไปด้วยความสามารถ:
- **Feature-rich**: ประกอบด้วย React Component คุณภาพสูงพร้อมใช้งานมากกว่า 120+ รายการ และ Custom Hooks กว่า 70+ ตัว ครอบคลุมการทำงานทั่วไปโดยไม่ต้องพึ่งพาไลบรารีอื่นภายนอก
- **Advanced Ecosystem**:
  - `@mantine/form`: ระบบจัดการฟอร์มและตรวจสอบความถูกต้องของข้อมูล (Input Validation) ในตัวที่ทรงพลัง
  - `@mantine/dates`: คอมโพเนนต์ปฏิทินและเลือกเวลาประสิทธิภาพสูง
  - `@mantine/tiptap`: ระบบจัดการ Rich Text Editor อิงตาม Tiptap
  - `@mantine/charts`: คอมโพเนนต์แสดงผลแผนภูมิหลากหลายประเภท
- **Combobox Component**: คอมโพเนนต์ประกอบแบบยืดหยุ่น (Composable) สำหรับสร้าง Autocomplete, Select, tags input และอื่นๆ
- **Accessibility**: รองรับมาตรฐาน WAI-ARIA ในการใช้งานผ่านคีย์บอร์ดและ Screen Reader 100%
- **Native Dark Mode**: จัดการสลับธีมสีได้ง่ายและเสถียรในระดับ Global ด้วยการใช้คีย์คลาสสเปซ CSS variables
- **LLMs Optimization**: มีการเผยแพร่เอกสารในรูปแบบไฟล์เดี่ยว `llms.txt` เพื่อให้ปัญญาประดิษฐ์และเอเจนต์โค้ดดิ้งสามารถอ่านทำความเข้าใจ API ทั้งหมดของ Mantine ได้อย่างรวดเร็วใน 1 รอบ Token

## 3. Application in QSMS
- การนำแนวคิด Mantine (เช่น การจัดการ Form หรือ Modal) มาปรับใช้กับการสร้าง Custom Component ในโปรเจกต์
- การรักษาประสิทธิภาพตามมาตรฐาน Next.js เพื่อความรวดเร็วในการโหลดข้อมูล

---
## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/A fully featured React components library.md]]
- Ingested Raw Source: [[1_raw/5 reasons why you should choose Next.js for your next project.md]]
- Ingested Raw Source: [[1_raw/Next.js คืออะไร ทำไมผู้สร้าง React ถึงแนะนำให้ใช้ Next.js.md]]

