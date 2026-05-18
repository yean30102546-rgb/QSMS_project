# FullStack-Skill.md - Full Stack Delivery Skill

ไฟล์นี้กำหนดทักษะมาตรฐานสำหรับการทำงานแบบ Full Stack ในโปรเจคนี้

## Core Skill
- คิดเป็น flow ไม่ใช่คิดเป็นไฟล์แยก
- แก้ทั้ง stack เมื่อ contract เปลี่ยน
- ตรวจผลกระทบก่อนแก้
- ปิดงานให้ถึงขั้น verify ได้

## Standard Commands
- ดูโครงสร้างไฟล์: `rg --files`
- หา usage: `rg -n "keyword" src gas`
- เช็ก type/build: `npm run lint`
- อ่านไฟล์สำคัญ:
  - `src/App.tsx`
  - `src/services/api.ts`
  - `src/services/auth.ts`
  - `src/services/validation.ts`
  - `gas/Code.gs`

## Full Stack Patterns

### 1. UI to Backend Contract Pattern
เมื่อเพิ่ม field หรือ action ใหม่ ให้ตรวจครบ:
- component input
- local state
- submit handler
- service payload
- GAS `doPost` switch
- backend handler
- sheet write/read
- UI render หลัง fetch กลับ

### 2. Validation Pattern
validation ต้องสอดคล้องกันอย่างน้อย 2 ชั้น:
- frontend validation
- backend validation

ถ้าสองฝั่งไม่ตรงกัน ให้ถือเป็นความเสี่ยงสูง

### 3. Role-Based Flow Pattern
ทุกงานที่เกี่ยวกับ role ให้เช็ก:
- enum role
- permission map
- UI gating
- action enable/disable
- backend permission enforcement

### 4. Multi-Item Case Pattern
สำหรับเคสที่มีหลาย item:
- อย่าคิดเฉพาะ item แรก
- เช็กว่า backend loop ทุก row จริง
- เช็กว่า update/edit ไม่เขียนทับข้อมูลทั้งเคสผิดแถว
- เช็ก id mapping ระหว่าง form id, item id, และ stored id

### 5. Image Flow Pattern
ถ้า feature เกี่ยวกับรูป:
- file select
- compression (ถ้ามี)
- base64 conversion
- upload to GAS
- store URL/file id
- read-back
- preview/export/lightbox

## Feature Delivery Checklist
- User flow ใหม่ถูก define ชัดเจน
- Types ถูกอัปเดต
- Props ไม่ mismatch
- API action มีจริง
- Error path ไม่เงียบ
- Retry path ใช้งานได้
- Data reload แล้วไม่เพี้ยน

## Refactor Checklist
- ไม่มี enum หรือ type เก่าค้าง
- ไม่มี prop ที่ส่งเกินหรือขาด
- ไม่มี field ที่เปลี่ยนชื่อแค่บางชั้น
- ไม่มี handler ที่ยังรับ payload เก่า

## Recommended Output When Finishing Work
- สิ่งที่เปลี่ยนในภาพรวม
- flow ที่ได้รับผล
- จุดที่ verify แล้ว
- จุดที่ยังควรทดสอบต่อ

## Repo-Specific Watchlist
- `App.tsx` เป็นตัวเชื่อม flow หลัก
- `api.ts` เป็น contract กลางระหว่าง React และ GAS
- `Code.gs` เป็นแหล่งจริงของ persistence และ permission
- `validation.ts` ต้องตรงกับกติกาหน้าฟอร์ม
- `.env` มีผลต่อ auth และ endpoint
