# แผนการพัฒนาระบบ Portal และ ShiftHub Roster (สไตล์ Apple Design System)

แผนการพัฒนานี้มีเป้าหมายเพื่อเพิ่มหน้าแรกเป็น **Login Page** ที่สวยงามตามสไตล์ Apple, เชื่อมต่อไปยัง **Workspace Portal (Central Hub)** ที่สามารถเลือกเปิดใช้งานแอปย่อยได้ระหว่าง **QSMS Rework** (ตัวเดิมที่มีอยู่) และ **ShiftHub Roster** (ตารางจัดกะการทำงานพนักงานแบบ Interactive Timeline) โดยมีหลักการคือ **เขียนโค้ดที่ง่าย เหมาะสำหรับมือใหม่ ไม่ซับซ้อนเกินความจำเป็น (No Over-Engineering)**

---

## 1. รายการไฟล์ที่จะสร้างใหม่และแก้ไข (Files to be Created & Modified)

ตามกฎข้อที่ 4: ต้องระบุให้ชัดเจนว่าต้องสร้างไฟล์ใหม่อะไรบ้าง หรือแก้ไขไฟล์ไหนบ้าง

### ไฟล์ที่จะสร้างใหม่ (New Files):
1. **`src/components/apps/portal/WorkspacePortal.tsx`**: หน้า Central Portal สำหรับเลือกแอป (Bento Grid สไตล์ Apple)
2. **`src/components/apps/roster/RosterDashboard.tsx`**: หน้าแอปย่อย ShiftHub Roster สำหรับจัดการตารางพนักงาน (Timeline Grid)
3. **`src/components/apps/roster/components/AddShiftModal.tsx`**: หน้าต่างป๊อปอัปสำหรับเพิ่มกะทำงาน (Interactive Modal สำหรับให้กดสั่งงานได้จริง)

### ไฟล์ที่จะแก้ไข (Modified Files):
1. **`src/index.css`**: เพิ่ม Token สีและสไตล์ของ Apple Design System เช่น Action Blue (`#0066cc`), Surface Parchment, Glassmorphic variables
2. **`src/components/Login.tsx`**: ปรับแต่งการดีไซน์หน้าล็อกอินให้พรีเมียม สไตล์เรียบหรูของ Apple
3. **`src/App.tsx`**: ปรับแต่งระบบ State-based Routing หลักเพื่อแยกหน้า Portal, Rework และ Roster ออกจากกันอย่างสมบูรณ์
4. **`src/components/layout/MainLayout.tsx`**: เพิ่มปุ่ม "ย้อนกลับหน้า Portal" ในส่วนของ Header/Sidebar เพื่อความสะดวกในการใช้งาน
5. **`Antigravity.md`** & **`ForLearning.md`**: บันทึกประวัติและบทเรียนความผิดพลาด (ตามกฎข้อ 2 และ 3)

*หมายเหตุ: จะไม่มีการแตะต้องหรือแก้ไขไฟล์ส่วนจัดการข้อมูลอื่น ๆ ที่ไม่เกี่ยวข้อง เพื่อรักษาความปลอดภัยของระบบตามกฎข้อที่ 5*

---

## 2. แผนสถาปัตยกรรมการนำทาง (State-Based Routing)

หลีกเลี่ยงการใช้ `react-router-dom` ที่ซับซ้อนและอาจเกิดปัญหาเวอร์ชันขัดแย้งกันในการพอร์ต โดยเราจะใช้ระบบ **Simple Page State Router** ใน `src/App.tsx`:

```typescript
type AppView = 'login' | 'portal' | 'rework' | 'roster';
```

- **`login`**: เข้าสู่ระบบ ตรวจสอบสิทธิ์โดยเชื่อมต่อกับ Google Apps Script API เดิม
- **`portal`**: เมื่อล็อกอินสำเร็จ จะแสดงหน้ารวมแอป (Workspace Hub) ที่มีปุ่มเปิด Rework และ Roster
- **`rework`**: หน้าสำหรับทำงานเกี่ยวกับ QSMS Rework (ใช้หน้า UI เดิมที่มีอยู่ทั้งหมด 100%)
- **`roster`**: หน้าตารางกะการทำงานพนักงานของ ShiftHub Roster (ตัวใหม่ที่สร้างขึ้น)

---

## 3. รายละเอียดการพัฒนาแต่ละส่วน (Step-by-Step Execution Plan)

### เฟสที่ 1: เตรียมการและปรับปรุงสไตล์กลาง (CSS & Design Tokens)
- เพิ่มตัวแปรสีและคลาสสไตล์หลักลงใน `src/index.css`:
  - `--apple-primary`: `#0066cc` (Action Blue ของ Apple)
  - `--apple-canvas-bg`: `#f5f5f7` (สีเทาอ่อนสะอาด Parchment)
  - `--apple-card-shadow`: `rgba(0, 0, 0, 0.04) 0px 4px 20px` (เงาฟุ้งบาง ๆ แบบเรียบหรู)
- เพิ่มสไตล์สเกลของปุ่มและหัวข้อแบบ Tracking `-0.01em`

### เฟสที่ 2: ปรับปรุงหน้า Login หน้าตาใหม่ (Premium Apple Login)
- พัฒนาต่อยอดจาก `src/components/Login.tsx` เดิม เพื่อไม่ให้พังเรื่อง Auth API
- เปลี่ยนหน้าตาให้เป็นรูปแบบ **Translucent Glass Panel** ที่มีปูหลังสีครามบางเบา
- ใช้ฟอนต์ Inter ปรับลดระยะห่างของตัวอักษร, ปรับกล่องกรอกข้อมูลให้มีเส้นขอบจาง ๆ และปุ่ม Capsule pill-shaped แบบ Action Blue
- แสดงผลอย่างสวยงามทั้งทางโทรศัพท์มือถือและเดสก์ท็อป

### เฟสที่ 3: พัฒนา Central Portal (`WorkspacePortal.tsx`)
- นำดีไซน์จากต้นแบบ `central_portal_workspace_entry/code.html` มาใช้:
  - **Sidebar Menu**: สัญญลักษณ์เมนูเรียบง่าย (My Apps, Settings, Support, Sign Out)
  - **Greeting Header**: แสดงคำทักทายแบบ Dynamic เช่น "Good morning, [User Name]" หรือ "สวัสดีครับ, [User Name]"
  - **Bento Grid Layout**: การ์ดแสดงผลแอปย่อย 3 ชิ้น:
    1. **ShiftHub Roster (Shift Manager)**: การ์ดสีครีมพาสเทล (`#fdf8f0`) ขอบซ้ายเหลืองทองเด่นสะดุดตา แสดงสถานะของกะการทำงานในปัจจุบัน
    2. **QSMS Rework Management**: การ์ดสีฟ้าพาสเทล (`#f0f6fc`) ขอบซ้ายฟ้าอ่อน พร้อม Badge สีชมพูบอกรายการเคส "3 Urgent" (เชื่อมต่อข้อมูลเคสจริงจาก API QSMS Rework)
    3. **Inventory Management (locked)**: การ์ดสีเขียวพาสเทล (`#f0f9f4`) แสดงเป็นสถานะ Coming Soon
  - ปรับปุ่มให้เปลี่ยนเป็น "Launch App" พร้อมเอฟเฟกต์การเลื่อนขึ้น (Hover Up Animation) เมื่อเลื่อนเมาส์ผ่านการ์ด

### เฟสที่ 4: พัฒนาแอปย่อย ShiftHub Roster Timeline (`RosterDashboard.tsx`)
- นำดีไซน์จากต้นแบบ `refined_employee_schedule_dashboard_2026/code.html` มาสร้างเป็น React Component:
  - **KPI Cards Row**:
    - *Total Staff*: 124 คน
    - *Pending Requests*: 8 รายการ
    - *OT Today*: 12 ชม.
    - *Upcoming Holidays*: 2 วัน
  - **Timeline Grid Table**:
    - ฝั่งซ้ายเป็น **Sticky Employee Column** ตรึงรายชื่อพนักงาน พร้อมแผนก (Sales, IT, Support) และกะปกติ (Pattern A, Pattern B)
    - ฝั่งขวาเป็น **ตารางวัน (May 1-9, 2026)** ที่สามารถเลื่อนซ้าย-ขวาได้อย่างอิสระและลื่นไหล
    - บล็อกการทำงานแบ่งสีชัดเจนสวยงาม:
      - กะทำงานมาตรฐาน (09:00 - 17:00, 10:00 - 18:00) สีฟ้าพาสเทล
      - กะนอกเวลา OT (18:00 - 22:00 OT x2) สีม่วงพาสเทลสดใส
      - กะสลับงาน Swapped (08:00 - 16:00 Swapped) สีส้มพาสเทล
      - กะทำงานบ่าย Late Shift (12:00 - 20:00)
    - เพิ่ม **Interactive Modal** เมื่อพนักงานหรือแอดมินคลิกที่ปุ่ม "New Request" หรือช่องว่างในตาราง เพื่อใช้เพิ่มกะการทำงาน (Add/Edit Shift) ได้จริงในฝั่ง Client State (เก็บลง Local State สำหรับจำลองการทำงานอย่างปลอดภัยและเข้าใจง่าย)

### เฟสที่ 5: จัดการระบบประสานงานหลัก (`App.tsx` & `MainLayout.tsx`)
- เชื่อมต่อหน้าจอทั้งหมดด้วย State Router
- ในหน้าระบบ QSMS Rework และ ShiftHub Roster เพิ่มปุ่ม **"← กลับหน้า Portal"** บริเวณมุมซ้ายบน เพื่อให้ผู้ใช้งานกลับมายังหน้าศูนย์กลางควบคุมหลักได้ตลอดเวลา
- ทดสอบการรันคำสั่ง `npm run build` เพื่อให้มั่นใจว่าระบบไม่มีจุดบกพร่องของ TypeScript, ไม่มี CSS compile error และพร้อมสำหรับ Production Deployment 100%

---

## 4. มาตรการสำหรับมือใหม่เพื่อป้องกันโค้ดซับซ้อน ( beginner-friendly safeguards )

ตามกฎข้อที่ 1: โค้ดทั้งหมดจะใช้หลักการ **เขียนเรียบง่าย เข้าใจได้ง่ายที่สุด**:
- หลีกเลี่ยงการใช้ Global State Manager (เช่น Redux, Zustand) ที่ไม่จำเป็นในการเดินทางของ Roster โดยใช้ React `useState` และการส่งผ่าน Props แบบตรงไปตรงมา
- การแสดงภาพไอคอนจะใช้บริการของ **Google Material Symbols (Outlined)** เพื่อป้องกันการนำเข้า Library ภายนอกขนาดใหญ่ที่ทำให้โหลดช้าและปรับแต่งยาก
- แยกไฟล์ฟังก์ชันคำนวณและสไตล์เป็นโมดูลย่อย ๆ อธิบายโครงสร้างโค้ดด้วยภาษาไทยภายในความเห็นคอมเมนต์ (Comments) เพื่อให้มือใหม่นำไปต่อยอดและเรียนรู้ได้เร็วที่สุด
