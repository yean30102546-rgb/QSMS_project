# Design System — Minimal Monochrome (Apple Pro Style)
[วันที่อัปเดต: 2026-05-21]

## 1. Summary — ปรัชญาการดีไซน์
ปรับปรุง UI จากเดิมที่เป็นสีน้ำเงิน/ดำ ให้กลายเป็น **Minimal Monochrome** ที่เน้นความเรียบหรูสไตล์ Apple "Pro" โดยใช้โทนสีดำ-ขาว-เทา เป็นหลัก เพื่อลดมลภาวะทางสายตาและสร้างภาพลักษณ์ที่เป็นมืออาชีพ (Premium Factory Tools)

## 2. Color Palette (Grayscale Primary)
- **Primary Accent:** `#1d1d1f` (Midnight Black) — ใช้สำหรับปุ่มกดหลัก และจุดที่ต้องการความเด่น
- **Interactive Background:** `bg-black/5` ถึง `bg-black/10` — สำหรับ Hover states และปุ่มรอง
- **Background Gradient:** `from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED]` (Apple Grey) — พื้นหลังแบบไล่เฉดสีเทาจางๆ
- **Status Colors (Softened):**
    - Success: Emerald/Green
    - Warning: Amber
    - Error: Rose/Red (ใช้เงาสีฟุ้ง 20% เพื่อความพรีเมียม)

## 3. UI Components (Glassmorphism V2)
- **`.glass-panel`:** พื้นหลังขาวใส 40% + `backdrop-blur-xl` + ขอบขาวบาง
- **`.glass-input`:** ช่องกรอกข้อมูลกึ่งโปร่งใส + วงแหวนเรืองแสงสีดำจางๆ เมื่อ Focus
- **Professional Dialogs:**
    - เปลี่ยนจาก `window.confirm` เป็น Custom Pro Modals
    - ความทึบแสงสูง (`bg-white/98`) เพื่อป้องกันข้อมูลซ้อนทับ (Visual Overlapping)

## 4. Typography & Spacing
- **Font:** Sarabun (Thai) + San Francisco inspired (English)
- **Rounding:** `rounded-[20px]` ถึง `rounded-[36px]` เพื่อความโค้งมนที่ดูเป็นมิตรแต่แข็งแรง
- **Letter Spacing:** `tracking-[0.22em]` สำหรับ Label หัวข้อใหญ่ (Uppercase)
- **Weight Contrast & Hierarchy (UX Optimization):**
  - **Headings & Key Metrics:** `font-semibold` หรือ `font-bold` เพื่อแสดงหัวเรื่องหลักหลัก
  - **Supporting & Meta Details:** `font-normal` หรือ `font-medium` (เช่น วันที่, ID เคส, แหล่งที่มา, ข้อมูลแถม) เพื่อลดความลายตาของการใช้ตัวหนาทั้งหน้าจอ
  - **Status Tags / StatusPill:** `font-semibold` + `tracking-[0.06em]`
  - **Stat Cards (KPIs):** หัวข้อการ์ดใช้ `text-[10px] font-semibold tracking-[0.12em] text-on-surface-variant/70` และค่าใช้ `text-2xl font-semibold md:text-3xl`

## 5. Interactions (motion/react)
- **Smooth Entry:** การค่อยๆ Slide up และ Fade in เมื่อโหลดหน้า
- **Tactile Feedback:** ปุ่มหลักมี `whileHover={{ scale: 1.01 }}` และ `whileTap={{ scale: 0.98 }}`
- **Group Focus:** ไอคอนในช่อง Input เปลี่ยนสีตามสถานะ Focus ภายใน Container

## 6. DESIGN.md Protocol (AI & Design Agents)
ในระบบการพัฒนาด้วย AI Agent (เช่น Google Stitch, VoltAgent) เอกสารบอกคุณลักษณะการออกแบบหลักจะมี 2 ประเภท:
1. `AGENTS.md` (สำหรับ Coding Agents): บอกพฤติกรรม ข้อตกลง และโครงสร้างการเขียนโค้ดของโปรเจกต์
2. `DESIGN.md` (สำหรับ Design Agents): บอกหน้าตา อารมณ์ (Mood & Tone) และสไตล์ไกด์ของ UI ทั้งหมด เพื่อให้โมเดลสร้างโค้ดหน้าตาตรงปกและพรีเมียมที่สุด (Pixel-Perfect UI)

### โครงสร้างหลักของ `DESIGN.md`
- **Visual Theme & Atmosphere**: นิยาม Mood & Density (เช่น Minimal Grayscale / Void Black)
- **Color Palette & Roles**: แยกบทบาทหน้าที่ของแต่ละเฉดสี (Primary, Secondary, Background, Softened Statuses)
- **Typography Rules**: ตาราง Type Scale และการใช้ Weight Contrast ที่ชัดเจน
- **Component Stylings**: ข้อตกลงเกี่ยวกับ Buttons, Cards, Inputs, และ Focus States
- **Do's and Don'ts**: กฎเหล็กที่ห้ามทำ (เช่น ห้ามใช้สีฉูดฉาดเกินจำเป็น, ห้ามทำขอบเหลี่ยมจัด)
- **Agent Prompt Guide**: ชุด Prompt สำเร็จรูปเพื่อให้ Design Agents จัดการสไตล์ได้แม่นยำ

---
> 🔄 *อัปเดตเมื่อ 2026-05-21*: เพิ่มข้อมูลโปรโตคอล `DESIGN.md` ของ VoltAgent เพื่อสนับสนุนการพัฒนา UI ร่วมกับ Design Agents
