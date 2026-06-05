# แผนการทำงาน: GAS Migration & Secure Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ย้ายการประมวลผลทั้งหมดจาก GAS มาเป็น Next.js API ทำระบบจัดการรูปภาพผ่าน Supabase Storage และใช้ HTTP-Only Cookie เพื่อความปลอดภัย

**Architecture:** ปลด `proxyToGAS` ออกจาก `route.ts` ปรับให้ API ยิงตรงเข้า Supabase Storage สร้าง API ใหม่ `/api/auth/me` สำหรับตรวจสอบ Cookie และปรับ Frontend ให้รอผลสถานะจาก API ตอนเปิดหน้าเว็บ

**Tech Stack:** Next.js Route Handlers, Supabase Admin Client, React, Vitest

---

### Task 1: ย้ายระบบอัปโหลดรูปไปที่ Supabase Storage

**Files:**
- Modify: `src/app/api/rework/route.ts`
- Modify: `src/lib/supabaseServer.ts` (ถ้าจำเป็นต้องดึงข้อมูล Bucket)

- [ ] **Step 1: เขียนเทสต์หรือเตรียมโครงสร้างไฟล์**
ในระบบเราอาจจะไม่ต้องเขียนเทสต์สำหรับ Route Handler ตรงๆ แต่ให้ปรับแก้ `uploadImage` ใน `route.ts` ให้ใช้ `supabaseServer.storage`

- [ ] **Step 2: แก้ไขส่วน uploadImage ใน route.ts**

แก้ไขส่วน `uploadImage` ใน `src/app/api/rework/route.ts`:
```typescript
      case 'uploadImage': {
        const { fileName, base64Data, contentType } = body;
        
        if (!fileName || !base64Data) {
          throw new Error('Missing fileName or base64Data');
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueFileName = `${Date.now()}-${fileName}`;

        const { data, error } = await supabaseServer
          .storage
          .from('rework_images')
          .upload(uniqueFileName, buffer, {
            contentType: contentType || 'image/jpeg',
            upsert: false
          });

        if (error) {
          throw new Error(`Supabase Storage upload failed: ${error.message}`);
        }

        const { data: publicUrlData } = supabaseServer
          .storage
          .from('rework_images')
          .getPublicUrl(uniqueFileName);

        return NextResponse.json(
          { 
            success: true, 
            data: { url: publicUrlData.publicUrl } 
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }
```

- [ ] **Step 3: ลบ fetchImageDataUrl**
ลบเคส `fetchImageDataUrl` ทิ้ง เพราะเราใช้ Public URL จาก Supabase ได้โดยตรงไม่ต้องผ่าน API proxy ดึงภาพ

- [ ] **Step 4: Commit**
```bash
git add src/app/api/rework/route.ts
git commit -m "feat(api): migrate image upload to supabase storage"
```

### Task 2: ตัดระบบ GAS ออกจาก Insert, Update และ Master

**Files:**
- Modify: `src/app/api/rework/route.ts`

- [ ] **Step 1: ตัด proxyToGAS ออกจาก insertCase**
ลบโค้ด `proxyToGAS` ออกจาก `insertCase` และลบอ้างอิง `caseFolderUrl`, `orFolderUrl` ทิ้งไปให้หมด
```typescript
// ลบส่วนที่เรียก proxyToGAS ออกทั้งหมด และใช้ caseData สั่ง insert ลง Supabase อย่างเดียว
```

- [ ] **Step 2: ตัด proxyToGAS ออกจาก updateCaseStatus**
ลบโค้ด `proxyToGAS` ออกจากการอัปเดตสถานะ

- [ ] **Step 3: ตัด proxyToGAS ออกจาก saveItemMaster**
ลบโค้ด `proxyToGAS` ออกจากการเซฟ Item Master

- [ ] **Step 4: ลบฟังก์ชัน proxyToGAS ทิ้งจากไฟล์**
ลบฟังก์ชัน `proxyToGAS(body: Record<string, unknown>)` ด้านล่างสุดของไฟล์ทิ้งไปเลย

- [ ] **Step 5: Commit**
```bash
git add src/app/api/rework/route.ts
git commit -m "refactor(api): remove proxyToGAS and google sheets dependencies"
```

### Task 3: สร้าง Auth API (Login, Me, Logout)

**Files:**
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Modify: `src/app/api/rework/route.ts` (ปรับ loginWithPassword)

- [ ] **Step 1: ปรับแก้ loginWithPassword ให้ฝัง Cookie**
แก้ไข `loginWithPassword` ใน `src/app/api/rework/route.ts` ให้คืนค่า NextResponse พร้อมเซ็ต `cookies().set('qsms_session', mockToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })` 

- [ ] **Step 2: สร้าง /api/auth/me**
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('qsms_session')?.value;
  
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: ใส่ Logic ตรวจสอบ Signature ของ JWT (ใช้โค้ดเดิมใน serverAuth.ts มาเช็ค)
  // หากผ่าน ให้แยก Payload คืนค่าให้หน้าเว็บ
  
  return NextResponse.json({ success: true, user: { name: 'User', role: 'operator' } });
}
```

- [ ] **Step 3: สร้าง /api/auth/logout**
ลบ Cookie ทิ้งโดยการตั้ง maxAge เป็น 0

- [ ] **Step 4: Commit**
```bash
git add src/app/api/
git commit -m "feat(auth): add http-only cookie auth routes"
```

### Task 4: ปรับปรุง Frontend ให้ใช้ HTTP-Only Auth

**Files:**
- Modify: `src/services/auth.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: ลบการอ้างอิง sessionStorage ออกจาก auth.ts**
ลบ `getToken`, `storeAuthData`, `getCurrentUser` ที่อ้างอิง `sessionStorage` ทิ้ง และให้ไปดึง State ใน App.tsx แทน

- [ ] **Step 2: เพิ่มการโหลด Session ตอนเริ่มแอป (App.tsx)**
ใน `src/App.tsx` เพิ่ม `useEffect` เพื่อยิง `GET /api/auth/me` ตอนเริ่มแอป
```tsx
const [isCheckingAuth, setIsCheckingAuth] = useState(true);

useEffect(() => {
  fetch('/api/auth/me').then(res => {
    if (res.ok) return res.json();
    throw new Error('Not logged in');
  }).then(data => {
    // Set user state
  }).catch(() => {
    // Clear state
  }).finally(() => {
    setIsCheckingAuth(false);
  });
}, []);

if (isCheckingAuth) return <LoadingScreen />;
```

- [ ] **Step 3: ลบ Auth Headers จาก api.ts**
ปรับแก้ฝั่ง Frontend ไม่ให้ส่ง `Authorization: Bearer` ใน Headers อีกต่อไป เพราะ Cookie ถูกส่งอัตโนมัติ

- [ ] **Step 4: Commit**
```bash
git add src/services/ src/App.tsx src/services/api.ts
git commit -m "refactor(frontend): migrate to server-state http-only cookie auth"
```
