# Data Table UX Patterns — Enterprise Best Practices (2026)
[วันที่อัปเดต: 2026-07-13]

## 1. Summary
รวบรวมแนวปฏิบัติที่ดีที่สุดของการออกแบบ Data Table ใน Enterprise Product UI สำหรับปี 2025–2026 โดยเน้นแนวคิด **"Calm Design"** ที่ลดภาระทางสมอง (Cognitive Overload) และใช้ Progressive Disclosure ซ่อนความซับซ้อนจนกว่าจะต้องการ

## 2. Row Actions: Progressive Disclosure
- **Kebab/More Menu**: รวม Secondary Actions (Edit, Delete, View, Download) ไว้ในปุ่ม 3-dot dropdown ที่ท้ายแถว ลด "Icon Clutter"
- **Hover Actions**: แสดงปุ่ม Action เฉพาะเมื่อ Hover แถวนั้น ลด Visual Noise ตอนอ่านสแกน
- **Bulk Actions**: ปุ่ม Action หลักแสดงเฉพาะตอนเลือกแถวผ่าน Checkbox พร้อม Undo Feedback

## 3. Filtering & Search
- **Visible Active Filters (Filter Chips)**: แสดง Chip สีแสดงสถานะ Filter ที่เปิดใช้งาน + ปุ่ม "Clear All"
- **Real-Time Feedback**: แสดง Loading Skeleton หรืออัปเดตทันทีเมื่อเปลี่ยน Filter
- **Search Highlighting**: ไฮไลท์คำที่ค้นหาในผลลัพธ์ให้เห็นชัด

## 4. Status Indicators
- **Semantic Color Coding**: ใช้ Badge สีมาตรฐาน (Green=Completed, Yellow=Pending, Red=Error, Gray=Archived)
- **Actionable Status**: Status สามารถ Hover/Click เพื่อเปิด Tooltip หรือ Quick View ได้
- **Consistency**: ใช้รูปแบบเดียวกันทั้ง App

## 5. Summary/Progress Indicators
- **Inline Summary Bar**: แสดงสรุปสถานะเหนือตาราง (เช่น "2/6 Fully Linked") ด้วย Segmented Progress Bar
- **Data Storytelling**: ฝัง Sparklines, Variance Bars, หรือ Mini Charts ใน Cell เพื่อให้อ่านแนวโน้มได้ทันที
- **Actionable Empty States**: Empty State ไม่ใช่แค่ "No data" แต่ต้องอธิบายเหตุผลและให้ทางออก

## 6. Performance & Ergonomics
- **Density Control**: ให้ผู้ใช้เลือก Compact/Comfortable/Spacious ได้
- **Sticky Headers**: Header และ Column แรกติดค้างเมื่อ Scroll ในตารางขนาดใหญ่
- **Virtualization**: สำหรับ 1,000+ แถว ใช้ Virtual Rendering เพื่อลด DOM
- **Tooltip on Truncation**: ข้อมูลที่ถูกตัดต้องมี Tooltip แสดงข้อมูลเต็ม

## 7. Interaction Patterns
- **Sortable Columns**: Header ที่คลิกได้ + ไอคอน Arrow บอกทิศทาง Sort
- **Row Click Navigation**: คลิกแถวเพื่อเข้าดูรายละเอียดหรือเปิด Sidebar
- **Keyboard Navigation**: Tab/Arrow keys สำหรับ Accessibility

## 8. Visual Hierarchy in Tables
- **Row Tinting**: แถวที่มีปัญหา (Missing/Error) ควรมีพื้นหลังจางๆ (Subtle Tint) เพื่อดึงสายตา
- **Weight Contrast**: ข้อมูลหลัก (Primary Identifier) ใช้ `font-semibold` ส่วนข้อมูลรอง (Metadata) ใช้ `font-normal text-muted`
- **Icon + Text Pairing**: ไอคอนควรใช้คู่กับ Text Label เสมอ ไม่ใช้ไอคอนเดี่ยว (ยกเว้น Action Buttons ที่มี Tooltip)

## 9. Design Anti-Patterns (ห้ามทำ)
- ❌ แสดงปุ่ม Action หลายปุ่มแบบเรียงแถวทุกแถว (Icon Clutter)
- ❌ ใช้สีเข้มจัด/เข้มเกินไปสำหรับ Status Badge (ต้อง Soften ด้วย Gradient)
- ❌ ปล่อยให้ข้อมูลตัดโดยไม่มี Tooltip
- ❌ Progress Bar ที่ค้าง/หลอกลวง (Fake Progress)
- ❌ Empty State ที่แสดงแค่ "No data"

## Knowledge Relationships
- **Depends On**: [[nextjs-frontend/design-system.md]] — Apple Pro Minimal Theme
- **Depends On**: [[nextjs-frontend/ui-ux-principles.md]] — หลักการ Hierarchy, Contrast, Feedback
- **Applied In**: Drawing/Master Module — DocumentList.tsx (Link Overview Tab)

## Ingested Raw Sources
- Web Research: Data Table UX Best Practices 2025-2026 (pencilandpaper.io, setproduct.com, eleken.co, medium.com, uxplanet.org)
- Web Research: Enterprise Table Design Patterns - Status Indicators & Progress (dagster.io, lollypop.design)
