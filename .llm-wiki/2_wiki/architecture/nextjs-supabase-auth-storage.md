# Title: Next.js + Supabase Authentication & Storage Architecture
[Updated: 2026-06-05]

## 1. Summary & Current Implementation
ระบบได้ทำการย้าย (Migrate) จากการพึ่งพา Google Apps Script (GAS) สำหรับการจัดการ Auth และ Storage (Google Drive) มาเป็น Next.js Route Handlers และ Supabase แทน 100% 
- **Authentication**: เปลี่ยนจาก Client-Side `sessionStorage` ไปใช้ Server-State Auth ผ่าน HTTP-Only, Secure Cookie (`auth_token`) 
- **Storage**: อัปโหลดรูปภาพหลักฐานและ OR Files เข้าสู่ Supabase Storage Bucket (`rework_images`) ผ่าน Next.js API โดยตรง ไม่มีการสร้างโฟลเดอร์ใน Google Drive อีกต่อไป และในส่วนของ UI (`UpdateModal.tsx`) ได้ทำการปรับเปลี่ยนลิงก์ "Drive" (Google Drive) ที่เคยใช้ในอดีตมาเป็น **"ปุ่มดาวน์โหลดรูปภาพ"** เพื่อดึงไฟล์ภาพจาก Supabase Storage และดาวน์โหลดลงเครื่องโดยตรง
- **Testing Refactoring**: ได้ปรับปรุงชุดทดสอบ `src/services/auth.test.ts` ให้จำลองการตอบกลับของ fetch API (`/api/auth/me`, `/api/auth/login`, `/api/auth/logout`) และอิงกับ in-memory state (`cachedUser`) แทนการใช้ `sessionStorage` แบบในอดีต

## 2. Technical Code Snippet (Best Practice)
**การทำงานของปุ่มดาวน์โหลดรูปภาพ:**
```tsx
const handleDownloadImages = async (imageUrls: string[], itemName: string) => {
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      a.download = `${itemName.replace(/\s+/g, '_')}_image_${i + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(url, '_blank');
    }
  }
};
```

**การอ่าน Session ในฝั่ง Frontend (React):**
```tsx
// src/services/auth.ts
export async function restoreSession(): Promise<boolean> {
  const res = await fetch('/api/auth/me');
  if (res.ok) {
    const result = await res.json();
    cachedUser = result.data.user;
    return true;
  }
  return false;
}
```

**การตรวจสอบ Auth ในฝั่ง Backend (Next.js):**
```tsx
// src/lib/serverAuth.ts
export async function requireServerAuth(body: Record<string, unknown> = {}): Promise<AuthContext> {
  let token = String(body.token || '');
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value || '';
  }
  return await verifyToken(token);
}
```

## 3. Knowledge Relationships
- Depends On (must read): N/A
- Impacted By (changes affect): `src/App.tsx`, `src/services/api.ts`, `src/components/modals/UpdateModal.tsx`
- Contradicts (historical mismatch): [Deprecated] การใช้ `proxyToGAS()` ใน `src/app/api/rework/route.ts`, การใช้ Google Drive Folder URLs สำหรับแสดงรูป, และการเก็บ JWT ไว้ใน `sessionStorage.getItem('qsms_token')` ถูกลบทิ้งและยกเลิกการใช้งานแล้ว
