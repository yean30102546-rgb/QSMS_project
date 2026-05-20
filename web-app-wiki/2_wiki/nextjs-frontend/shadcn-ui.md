# shadcn/ui Implementation — QSMS
[วันที่อัปเดต: 2026-05-21]

## 1. Summary
โปรเจกต์ใช้ `shadcn/ui` เป็น UI Library หลักสำหรับการสร้าง Components ที่เข้าถึงได้ (Accessible) และปรับแต่งได้ง่าย โดยเน้นสไตล์ Apple-inspired Segmented Controls และ Modern Industrial Aesthetic.

## 2. Configuration
- **Location**: `src/components/ui/`
- **Tailwind Config**: ใช้ Tailwind v4 (CSS-only config ใน `src/index.css`)
- **Utilities**: `src/lib/utils.ts` สำหรับ `cn` helper

## 3. Installed Components
| คอมโพเนนต์ | ไฟล์ | การใช้งานหลัก |
|---|---|---|
| `Tabs` | `ui/tabs.tsx` | สลับมุมมอง Summary/Calendar ใน Roster |
| `Dialog` | `ui/dialog.tsx` | แบบฟอร์มระบุหมายเหตุการลา, ยืนยันการลบ |
| `Select` | `ui/select.tsx` | เลือกพนักงาน, เลือกประเภทงาน (Planned) |
| `Popover` | `ui/popover.tsx` | เมนูจัดการสถานะรายวันในปฏิทิน |
| `Table` | `ui/table.tsx` | ตารางสรุป Roster และ Case List |
| `Button` | `ui/button.tsx` | ปุ่มมาตรฐานทั่วทั้งระบบ |
| `Badge` | `ui/badge.tsx` | สถานะเคส (Pending, Completed, etc.) |

## 4. Guidelines
- **Customization**: หลีกเลี่ยงการแก้ไฟล์ใน `ui/` โดยตรงหากไม่จำเป็น ให้ใช้ `className` ผ่าน `cn` utility แทน
- **Icons**: ใช้ `lucide-react` เสมอ
- **Animations**: ใช้ `motion/react` (Framer Motion) ควบคู่กับ shadcn เพื่อความลื่นไหล

> 🔄 *คอมไพล์ความรู้เมื่อ 2026-05-21*: เริ่มนำเข้า shadcn/ui ครั้งแรกเพื่อแก้ปัญหาไฟล์ RosterApp.tsx ใหญ่เกินไป และเพื่อมาตรฐาน UI ที่ดีขึ้น
