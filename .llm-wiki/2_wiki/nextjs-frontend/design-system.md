# Design System — Apple Pro Operations Aesthetic
[วันที่อัปเดต: 2026-08-13]

## 1. Summary — ปรัชญาการดีไซน์
ระบบการออกแบบของ QSMS (Central Control Center, QSMS Rework, Drawing Storage, Guide, และ DocAI RAG) ยึดถือมาตรฐาน **Apple Pro Operations Aesthetic** สอดคล้องตามข้อกำหนดใน [[DESIGN.md]] และ [[apple/DESIGN.md]]

เน้นความประณีต สะอาด อ่านง่าย และไม่สร้างภาระทางสายตาให้แก่ผู้ใช้งานในโรงงาน (Premium Factory Operations Workspace)

## 2. Core Tokens & Palette
- **Canvas Background:** `#f5f5f7` (Signature Apple Parchment Off-white)
- **Card Surface (`store-utility-card`):** `#ffffff` (Pure White) + ขอบ 1px Hairline `#e0e0e0` + ความโค้งมน `rounded-[18px]` (18px)
- **Primary Interactive Accent:** `#0066cc` (Action Blue) — สีโต้ตอบหลักสีเดียวบนปุ่มกดแบบแคปซูล (`rounded-full`), ลิงก์, และสถานะ Active Focus
- **Text Ink:** `#1d1d1f` (Near-black Ink) สำหรับหัวข้อและข้อความหลัก
- **Muted Ink:** `#7a7a7a` สำหรับ Captions และ Meta labels

## 3. UI Component Tokens
- **`button-primary`**: Action Blue `#0066cc` background, white text, full pill `rounded-full`, padding `11px 22px`, press physics `whileTap={{ scale: 0.97 }}`
- **`sub-nav-frosted`**: Parchment `#f5f5f7`/90 + `backdrop-blur-md` + ขอบล่าง 1px `#e0e0e0`
- **`store-utility-card`**: Pure white `#ffffff`, 1px `#e0e0e0` hairline border, 18px radius (`rounded-[18px]`), padding 24px

## 4. Typography Rules (SF Pro & Sarabun)
- **Font Stack:** Sarabun (Thai), -apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, sans-serif
- **Headings & Key Metrics:** `font-semibold text-[#1d1d1f] tracking-[-0.02em]`
- **Body Copy:** `text-[17px] leading-[1.47] text-[#1d1d1f]`

## 5. Knowledge Relationships
- **Source of Truth Specification**: [[DESIGN.md]] (Root Workspace Design System)
- **Reference Spec**: [[apple/DESIGN.md]] (Apple Design Analysis)
- **Depends On**: [[nextjs-frontend/ui-ux-principles.md]] — หลักการ Hierarchy, Proximity และ Accessibility
- **Impacted By**: 
  - [[nextjs-frontend/portal-shell.md]] — หน้า Central Portal Hub
  - [[nextjs-frontend/rework-module.md]] — หน้า Rework Case Table & Forms
