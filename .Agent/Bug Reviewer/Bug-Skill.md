# Skill.md - Bug Review and Debug Skill

ไฟล์นี้กำหนดทักษะมาตรฐานสำหรับการตรวจ Bug และ Debug โปรเจคนี้

## Core Skill
- อ่าน flow ก่อนแก้
- หาหลักฐานก่อนสรุป
- เทียบ frontend กับ backend ทุกครั้ง
- แยกอาการออกจาก root cause

## Useful Commands
- ดูไฟล์ทั้งหมด: `rg --files`
- หา usage หรือ keyword: `rg -n "keyword" src gas`
- เช็ก type/build error: `npm run lint`
- อ่านไฟล์แบบมีเลขบรรทัด:
  `Get-Content path | % { ... }` หรือใช้ search ร่วมกับ editor

## Debug Patterns

### 1. Build / Type Debug
ใช้เมื่อโปรเจคเปิดไม่ขึ้น, build ไม่ผ่าน, หรือ component ต่อ props กันผิด
- เริ่มจาก `npm run lint`
- เก็บ error ทุกตัว
- ไล่กลับไปดู type contract ระหว่าง parent/child component
- เช็ก enum, prop, callback return type, และ field ที่หายไป

### 2. API Contract Debug
ใช้เมื่อ UI ทำงานแต่ข้อมูลไม่เข้า/ไม่ออก
- ดู payload ที่ frontend ส่งจาก `src/services/api.ts`
- ดู action switch ใน `gas/Code.gs`
- เช็กว่า field names ตรงกันหรือไม่
- เช็กว่า backend return success false แต่ frontend เงียบหรือไม่

### 3. State and Form Debug
ใช้เมื่อปุ่มกดได้แต่ flow ไม่เปลี่ยน
- เช็ก `useState`, callback, disabled condition
- เช็กว่ามี UI แสดงสถานะ แต่ไม่มี event เปลี่ยน state หรือไม่
- เช็ก reset state หลัง submit / modal close

### 4. Persistence Debug
ใช้เมื่อ user แก้ข้อมูลแล้วเปิดใหม่ไม่เหมือนเดิม
- เทียบ write path กับ read path
- ถ้าเป็นหลาย item ให้ดูว่าบันทึกครบทุก row หรือใช้แค่ item แรก
- เช็ก mapping id ก่อน-หลัง save

### 5. Auth / Permission Debug
ใช้เมื่อ login ได้แต่ใช้งานบางหน้าไม่ได้ หรือ role เพี้ยน
- เช็ก `auth.config.ts`
- เช็ก `services/auth.ts`
- เช็ก role ที่เก็บใน session
- เช็ก backend permission ใน `gas/Code.gs`
- มองหาจุดที่ frontend อนุญาตแต่ backend block หรือกลับกัน

### 6. Image Debug
ใช้เมื่ออัปโหลดรูปได้แต่ไม่แสดง หรือ export ไม่ครบ
- เช็ก input file -> base64 -> GAS upload
- เช็ก URL ที่เก็บใน sheet
- เช็ก action สำหรับโหลดรูปกลับ
- เช็ก fallback image URL ใน component แสดงรูป

## Bug Classification
- `Critical`: ใช้งาน flow หลักไม่ได้, build ไม่ผ่าน, data หาย, auth พัง
- `High`: ข้อมูลบันทึกผิด, role mismatch, persistence ไม่ตรง
- `Medium`: filter/stats/UX ทำให้เข้าใจผิดหรือใช้งานสะดุด
- `Low`: copy, label, visual mismatch, edge case เล็ก

## Required Output Format
- ชื่อ bug
- อาการ
- root cause
- impact
- file reference

ตัวอย่าง:

- `Image read-back fails because frontend calls an unsupported GAS action`
  Symptom: รูปไม่แสดงหลังโหลดข้อมูล
  Root cause: frontend ส่ง `getImageDataUrl` แต่ backend ไม่มี case นี้
  Impact: preview/export/image modal ใช้งานไม่ครบ

## Repo-Specific Watchlist
- `src/App.tsx`
- `src/services/api.ts`
- `src/services/auth.ts`
- `src/services/validation.ts`
- `src/components/UpdateModal.tsx`
- `src/components/AddCaseTab.tsx`
- `src/components/OverallTab.tsx`
- `gas/Code.gs`
- `.env`

## Final Reminder
- ถ้ายังไม่พิสูจน์ bug อย่าเพิ่งฟันธง
- ถ้าพิสูจน์ได้แล้ว ให้สรุปเป็นข้อ ๆ พร้อมหลักฐานเสมอ
