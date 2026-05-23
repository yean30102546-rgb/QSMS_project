# QSMS Rework & Roster Management System

ระบบจัดการงาน Rework และตารางเวรพนักงาน (Roster) ระดับองค์กร ออกแบบตามแนวคิด **Minimal Monochrome (Apple Pro Style)** ที่มีความเรียบหรู ปราณีต พร้อมการเชื่อมต่อข้อมูลแบบเรียลไทม์ควบคู่กันระหว่าง Google Sheets (ผ่าน GAS Web App) และ Supabase Database

## 🎯 Features

### 🏢 Workspace Portal (Landing Page & Guest Mode)
- **Live Preview Analytics** - ผู้ใช้ทั่วไปที่ยังไม่ได้เข้าสู่ระบบสามารถมองเห็นข้อมูลสรุปเคส (Active Cases, Completion Rate, Defect Reasons) และตัวอย่างเคสล่าสุดแบบจำกัดได้ทันทีโดยไม่ต้องล็อกอิน
- **Auto-Redirect** - ตรวจเช็คสถานะเซสชันอัตโนมัติเพื่อนำทางผู้ใช้ที่เข้าสู่ระบบแล้วไปยังโมดูลหลักโดยตรง
- **Centralized App Registry** - เมนูคลังแอปพลิเคชันสำหรับเปิดโมดูลต่างๆ (Rework, Roster, และอื่นๆ ในอนาคต)

### ⚙️ Rework Module (ระบบจัดการเคสแก้ตัวสินค้า)
- **Multi-Item Support** - บันทึกได้หลายรายการสินค้า (Rework Items) ภายใต้ใบงาน (Case) เดียวกัน
- **Frosted Image Upload & Gallery** - อัปโหลดรูปภาพได้สูงสุด 5 ภาพต่อรายการ พร้อมคาร์รูเซลแกลเลอรีรูปภาพและการย่อขนาดไฟล์อัจฉริยะ (Client-side compression)
- **Status & Document Action Gate** - ควบคุมสิทธิ์การกดเปลี่ยนสถานะหรือแนบไฟล์เอกสารสั่งแก้งาน (OR Document) ตามระดับตำแหน่ง (User, Supervisor, Manager)
- **Apple Shimmer Progress Cards** - กล่องแสดงสถานะการบันทึกข้อมูลสตรีมมิ่งที่ใช้กลาสมอร์ฟิสซึ่มและแสงวิ่งวิ่งวิบวับแบบคาปซูลสไตล์ Apple Pro
- **PDF Template Export** - ส่งออกรายงานเคส rework ออกเป็นไฟล์ PDF ที่จัดหน้าตาจัดพิมพ์ไว้อย่างเรียบร้อยสวยงาม

### 📅 Roster Module (ระบบจัดตารางเวรกะพนักงาน)
- **Interactive Calendar Grid** - ตารางปฏิทินแสดงตารางเวรรายเดือนที่เข้าใจง่ายและปรับขนาดได้ตามสัดส่วนจอ
- **Drag-and-Drop Schedule Shifts** - สลับกะการทำงานหรือกำหนดวันลาประเภทต่างๆ (Sick Leave, Business Leave, Holiday, OT) ได้สะดวกผ่านการลากวาง
- **Shift Stats Summary** - แสดงสรุปผลรวมจำนวนวันทำงาน วันหยุด และชั่วโมงลารวมของพนักงานแต่ละคนโดยอัตโนมัติ

### 🎨 Apple Premium UI/UX
- **Frosted Glassmorphism** - ใช้เอฟเฟกต์กระจกเบลอระดับสูง (`.glass-panel`, `.glass-input` + `backdrop-blur-xl`) และขอบโปร่งแสงสะท้อนเงา
- **Tactile Spring Micro-animations** - การกดปุ่มหรือเปลี่ยนหน้าต่างมาพร้อมการยุบตัวขยายตัวตามกฎฟิสิกส์สปริงที่ลื่นไหล
- **Premium Logout Transition** - อนิเมชั่นหน้าจอออกจากระบบหน่วงเวลา 1.5 วินาที พร้อม Overlay ใสเบลอฉากหลังสูง (`backdrop-blur-[16px]`) และ **iOS Spoke Activity Indicator** หมุนวนนุ่มนวล
- **Fully Responsive** - รองรับการแสดงผลทั้งบน Desktop เควสใหญ่ และ Mobile ขนาดพกพา

---

## 🏗️ Architecture

### Frontend Stack
- **Next.js 16 (App Router)** - เฟรมเวิร์กจัดการเพจและ API Routes Proxy
- **React 19 & TypeScript** - ตัวสร้างเว็บเพจและประเภทข้อมูลที่มั่นคงปลอดภัย
- **Tailwind CSS v4 & PostCSS** - การจัดการสไตล์ชีตประสิทธิภาพสูงและโครงสีตามธีม
- **Motion (Framer Motion)** - ตัวขับเคลื่อนฟิสิกส์อนิเมชั่นทั้งหมดในระบบ
- **Radix UI Primitive** - พื้นฐานคอมโพเนนต์ Dialog, Popover, Select, Tabs

### Backend Stack (Hybrid Database Model)
- **Google Sheets & Google Drive** - ใช้จัดเก็บข้อมูลชีตหลักและโฟลเดอร์รูปภาพของเคสต่างๆ
- **Supabase Database** - ใช้บันทึกข้อมูลแบบ relational เพื่อการ Query ค้นหาที่รวดเร็วและการจัดสกีมาตารางที่สัมพันธ์กัน (Roster, Rework, Items)
- **Google Apps Script (GAS)** - เว็บบริการฝั่งเซิร์ฟเวอร์ทำหน้าที่เป็นตัวกลางรับข้อมูลและอัปเดตชีต

### Data Flow
```
                [ Workspace Portal / modules ]
                              ↓
                    [ Next.js API Routes ]
                    /                    \
                   v                      v
      [ Supabase Postgres ]         [ Google Apps Script API ]
                                                ↓
                                      [ Google Sheets DB ]
```

---

## 📁 Project Structure

```
src/
├── app/                       # Next.js App Router (Layouts & Page entry)
│   ├── api/                   # API Routes (Supabase endpoints & GAS proxy)
│   └── page.tsx               # Entry point referencing App Client
├── components/
│   ├── apps/                  # Application Modules (portal)
│   └── layout/                # Main layout shell and sidebar navigation
├── modules/
│   ├── rework/                # Rework app logic (Overall, AddCase, Dashboard)
│   ├── roster/                # Roster calendar and shift management
│   └── platform/              # Workspace registries & types
├── services/
│   ├── api.ts                 # Legacy / direct GAS api functions
│   └── auth.ts                # Session PIN verification and sessionStorage token
└── index.css                  # Global styles (Tailwind v4 theme extensions)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ และ npm/yarn
- บัญชี Google สำหรับ Sheets & Apps Script
- ฐานข้อมูล Supabase (พร้อมติดตั้ง DB Schema)

### Local Development

1. **โคลนและติดตั้งโปรเจกต์**
   ```bash
   git clone <your-repo-url>
   cd QSMS_project
   npm install
   ```

2. **กำหนดตัวแปรสภาพแวดล้อม (Environment Variables)**
   คัดลอกไฟล์ `.env.example` ไปเป็น `.env` และกำหนดค่าคีย์ต่างๆ:
   - `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GAS_WEB_APP_URL` (URL ของ Google Apps Script Web App)

3. **รันเซิร์ฟเวอร์สำหรับพัฒนา**
   ```bash
   npm run dev
   ```
   เปิดบราวเซอร์เข้าสู่ [http://localhost:3000](http://localhost:3000)

4. **ตรวจสอบความปลอดภัยของไทป์**
   ```bash
   npm run lint
   ```

5. **การรันทดสอบระบบ (Testing)**
   * **Unit & Integration Tests (Vitest):**
     ```bash
     npm run test
     ```
   * **End-to-End Tests (Playwright E2E):**
     ```bash
     npm run test:e2e
     ```
     หรือหากต้องการรันเพื่อดีบั๊กแบบมี UI/Interactive mode:
     ```bash
     npx playwright test --ui
     ```

---

## 📊 Data Schema

### Google Sheet Columns
| Column | Type | Purpose |
|--------|------|---------|
| Item ID | Text | Unique identifier for each item (RW260426-001-1) |
| Case ID | Text | Unique identifier for case (RW260426-001) |
| Date | DateTime | Timestamp when case was created |
| Source | Text | SFC or Customer |
| Item Number | Text | Product item number |
| Item Name | Text | Product name |
| Item Code | Text | Product code |
| Amount (Box) | Number | Quantity in boxes |
| Reason | Text | Defect reason |
| Responsible | Text | Accountable party |
| Details | Text | Additional information |
| Status | Text | Pending / In-Progress / Completed |
| Image URLs | Text | Pipe-separated URLs |

---

## 🎨 UI Components

### Page Tabs
1. **Overall** - List of all cases with search and status tracking
2. **Add Case** - Form to create new rework cases with items
3. **Dashboard** - Analytics and statistics visualization

### Key Components
- `SidebarItem` - Navigation menu items
- `StatCard` - Statistics display card
- `StatusPill` - Status badge with color coding
- `InputField` - Form input with label
- `UpdateModal` - Modal for case updates
- `Dashboard` - Analytics dashboard
- `ImageUpload` - Image upload with gallery

---

## 🔒 Data Validation

### Required Fields
- Item Number ✓
- Item Name ✓
- Amount (Box) ✓ (must be > 0)
- Reason ✓
- Responsible ✓

### Optional Fields
- Item Code (numbers only)
- Details (text)
- Images (up to 5 per item)

### Input Masking
- **Item Code**: Numbers only (enforced)
- **Amount Box**: Numbers only (positive)
- **Item Number**: Numbers only

### Save Button
- Disabled until all required fields are filled
- Shows loading state during submission
- Displays success/error messages

---

## 🔄 Workflow

### Creating a New Case
1. Click "เพิ่มงานใหม่ (Add Case)" in sidebar
2. Select source (SFC or Customer)
3. Fill in item details (can add multiple items)
4. Upload images (optional, up to 5 per item)
5. Click "บันทึกข้อมูลเข้าสู่ระบบ" to save
6. App automatically redirects to Overall tab on success

### Updating Case Status
1. Go to "ภาพรวม (Overall)" tab
2. Click on a case row
3. Modal opens with current case details
4. Select new status (Pending / In-Progress / Completed)
5. Click "บันทึกการเปลี่ยนแปลง" to save
6. Data updates immediately

### Viewing Analytics
1. Click "Dashboard" in sidebar
2. View key metrics:
   - Total cases and breakdown by status
   - Completion rate percentage
   - Most frequent defect reasons
   - Workload distribution by source
   - Status distribution pie chart

---

## 🛠️ Customization

### Change Status Types
Edit `App.tsx`:
```typescript
type Status = 'Pending' | 'In-Progress' | 'Completed';
// Change to your preferred statuses
```

### Change Defect Reasons
Edit `App.tsx` in the form section:
```jsx
<option>Custom Reason 1</option>
<option>Custom Reason 2</option>
```

### Change Color Scheme
Edit `index.css` theme variables:
```css
--color-accent: #18181b;  /* Change primary color */
--color-bg: #fdfdfd;      /* Change background */
```

### Adjust Image Upload Limits
Edit `components/ImageUpload.tsx`:
```typescript
maxImages={5}  // Change from 5 to desired number
```

---

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar navigation with expanded layout
- **Tablet**: Collapsible navigation with adjusted grid
- **Mobile**: Stack layout with simplified controls

---

## ⚡ Performance

- **Lazy Loading**: Components load on-demand
- **Memoization**: React optimization for expensive computations
- **Pagination Ready**: Dashboard can be extended with pagination for large datasets
- **Batch Operations**: Multiple items can be saved in one API call

---

## 🔐 Security Considerations & Role-Based Access Control (RBAC)

### Access Control & Roles
ระบบใช้การคัดแยกสิทธิ์ตามบทบาทผู้ใช้งาน (RBAC) ทั้งในส่วนของ UI (Frontend) และ API Endpoints (Backend):
- **ADMIN / QSMS** - สิทธิ์สูงสุด สามารถจัดการได้ทุกส่วน รวมถึงการลบเคส การจัดการแดชบอร์ด และสิทธิ์ในการใช้ Roster Module
- **FINANCE** - แผนกการเงิน มีสิทธิ์ในการสืบค้นดูรายการ และทำหน้าที่ตรวจสอบประเมินราคาอัปเดตช่อง Rework Cost และ Labor Rate เท่านั้น ไม่สามารถสร้างเคสใหม่หรือแก้ไขข้อมูลสินค้าได้
- **OPERATOR / WFG / PDB (Consolidated Roles)** - กลุ่มงานการผลิตและคลังสินค้า มีสิทธิ์การใช้งานจำกัดเฉพาะโมดูล **Rework** (ซ่อนโมดูล Roster ทั้งหมด)
  - สิทธิ์ทำงาน: สามารถเพิ่มงาน Rework ได้, อัปเดตสถานะงานเป็น "In-Progress" หรือส่งต่อไปสถานะ "Awaiting Valuation" (รอประเมินราคา) ได้
  - ข้อจำกัด: **ไม่สามารถมองเห็นหรือแก้ไขฟิลด์ค่าใช้จ่ายใดๆ ได้ (No Pricing/Cost access)** และไม่มีสิทธิ์ในฟังก์ชันการ Export ข้อมูลหรือเรียกดูหน้า Dashboard

### 🧪 Local Test Accounts (บัญชีทดสอบระบบภายใน)
สำหรับการทดสอบระบบบนเครื่อง Local หรือสภาพแวดล้อมจำลอง สามารถเข้าสู่ระบบด้วยบัญชีจำลองด้านล่างนี้ได้โดยตรง (ไม่ต้องผ่านการลงทะเบียนบนระบบ GAS จริง):
- **QSMS / Admin Account:** Username: `qsms`, Password: `Qsms123`
- **Operator / WFG / PDB Account:** Username: `operator`, Password: `Operator123`
- **Finance Account:** Username: `finance`, Password: `Finance123`

### Data Protection
- ข้อมูลหลักทั้งหมดถูกบันทึกและซิงค์ควบคู่ระหว่าง Google Sheets และ Supabase PostgreSQL
- ระบบ API Middleware ตรวจสอบความถูกต้องและลายเซ็นของ Token ด้วย `AUTH_TOKEN_SECRET` ทุกครั้งที่มีการแก้ไขข้อมูล
- ข้อมูลความลับและสิทธิ์ของผู้ใช้จะถูกเก็บในเซสชันที่ปลอดภัยและใช้การรับรองความถูกต้องด้วยโทเค็น JWT-like ของระบบ GAS/Next.js Proxy

### Best Practices
- หลีกเลี่ยงการเปิดเผยรหัสและ `AUTH_TOKEN_SECRET` ในที่สาธารณะ
- ใช้ Environment variables ในการเก็บค่า URL และ Security Keys ทั้งหมด
- หมั่นตรวจสอบและสำรองข้อมูล Google Sheets สม่ำเสมอ

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch" error**
- Verify GAS Web App URL in `api.ts`
- Check browser console for CORS errors
- Ensure GAS is deployed as Web App (not function)

**Data not saving**
- Check Google Sheet exists and is accessible
- Verify column headers match expected schema
- Check GAS logs for detailed errors

**Images not uploading**
- Verify file size < 10MB
- Check file format (PNG, JPG, GIF)
- Verify image upload handler in GAS

**Modal doesn't appear**
- Clear browser cache
- Check z-index in CSS
- Verify UpdateModal component is imported

---

## 📚 API Reference

### Insert Case
```typescript
insertCase(source: string, items: ReworkItem[], imageData?: Record<string, File[]>)
```
Creates a new case with items and optional images.

### Fetch All Cases
```typescript
fetchAllCases(): Promise<ApiResponse<ReworkCase[]>>
```
Retrieves all cases from Google Sheets.

### Update Case
```typescript
updateCase(caseId: string, updates: Partial<ReworkCase>)
```
Updates an existing case's status or details.

### Dashboard Stats
```typescript
fetchDashboardStats()
```
Gets aggregated statistics for the dashboard.

---

## 📈 Future Enhancements

- 📧 Email notifications on case creation
- 📞 WhatsApp integration for updates
- 🔔 Real-time notifications with WebSockets
- 🗂️ Advanced filtering and export to Excel
- 📅 Calendar view for case timeline
- 👥 User roles and permissions
- 💬 Comments/notes system
- 🔐 Two-factor authentication
- 📊 Advanced reporting with charts
- 🤖 AI-powered defect classification

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 👥 Support

For issues, questions, or feature requests:
1. Check DEPLOYMENT_GUIDE.md for common issues
2. Review browser console and GAS logs
3. Contact your development team

---

**Made with ❤️ for QSMS Rework Management**

Last Updated: April 2026
Version: 1.0.0
