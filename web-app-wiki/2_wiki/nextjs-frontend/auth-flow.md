# Auth Flow — QSMS Rework Management
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
> ⚠️ **[Deprecated - Old Flow]** ระบบเก่าใช้ hardcoded `admin/admin123` ใน sessionStorage โดยตรง (ดู `1_raw/SYSTEM_ARCHITECTURE.md` หัวข้อ Authentication)
> ระบบปัจจุบันย้ายไปใช้ GAS PIN Login แล้ว (ดู section ด้านล่าง)
ระบบ Login ใช้ PIN-based authentication ผ่าน GAS backend
Frontend ไม่เคยตรวจ PIN เอง — ส่งไปให้ GAS ตรวจและออก JWT กลับมา
Token เก็บใน `sessionStorage` (ไม่ใช่ localStorage หรือ Cookie)

**Login Flow:**
```
Login.tsx → loginWithPassword(userId, pin)
  → auth.ts → POST /api/rework { action: 'loginWithPassword', profile, password }
    → Next.js Route → GAS (ตรวจ Script Properties)
      → GAS ออก JWT token กลับ
        → storeAuthData() → sessionStorage
          → Redirect to App
```

## 2. Technical Code Snippet (Best Practice)
```typescript
// src/services/auth.ts — PIN Login
export async function loginWithPassword(userId: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/rework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'loginWithPassword', profile: userId, password }),
  });
  const result = await response.json() as AuthResponse;
  if (result.success && result.data) {
    storeAuthData(result.data.token, result.data.user, result.data.expiresIn);
  }
  return result;
}

// Session storage keys
// TOKEN_KEY = 'qsms_token'
// USER_KEY  = 'qsms_user'
// ROLE_KEY  = 'qsms_role'
// TOKEN_EXPIRY_KEY = 'qsms_token_expiry'
```

## 3. ฟังก์ชันสำคัญใน auth.ts
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `loginWithPassword(userId, password)` | PIN Login ผ่าน GAS |
| `isAuthenticated()` | ตรวจ token + expiry ใน sessionStorage |
| `getCurrentUser()` | อ่าน User object จาก sessionStorage |
| `getCurrentUserRole()` | อ่าน UserRole จาก sessionStorage |
| `hasPermission(permission)` | ตรวจสิทธิ์จาก ROLE_PERMISSIONS |
| `logout()` | ล้าง sessionStorage ทั้งหมด |
| `getAuthHeaders()` | ส่ง Authorization: Bearer token header |

## 4. Lessons Learned {#lessons}
> **[Deprecated - Local PIN Auth]** เดิมระบบตรวจ PIN ใน frontend (`auth.ts` มีโค้ด commented out)
> **เปลี่ยนไปใช้:** GAS ออก JWT token เท่านั้น เพราะ local PIN อยู่ใน source code = ไม่ปลอดภัย
> **หลักฐาน:** บรรทัด 182-211 ใน `src/services/auth.ts` (commented legacy code)

> **[หมายเหตุ]** `loginWithGoogle()` และ `loginWithEmail()` ถูก Disable แล้ว
> ใช้เฉพาะ `loginWithPassword()` เท่านั้นในระบบปัจจุบัน

## 5. Firebase / Google OAuth (Planned — ยังไม่ได้ implement)
> **[Planned]** มีเอกสาร `archive_docs/AUTHENTICATION_IMPLEMENTATION.md` วางแผนใช้ Firebase + Google OAuth
> แต่ปัจจุบัน `loginWithGoogle()` และ `loginWithEmail()` ถูก **Disable** แล้วในโค้ดจริง

ถ้าต้องการ implement ในอนาคต จะต้องเพิ่ม env vars:
```env
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_TOKEN_EXPIRY_HOURS=8
```

## 6. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — GAS ต้องมี `AUTH_TOKEN_SECRET` และ `*_PIN` properties
- **Depends On**: [[nextjs-frontend/roles.md]] — Role กำหนดสิทธิ์หลัง login
- **Impacted By**: [[nextjs-frontend/nextjs.md]] — `/api/rework` route เป็น proxy ที่ auth ต้องพึ่ง

> 🔄 *อัปเดตเมื่อ 2026-05-21*: เพิ่ม Deprecated note, Firebase/OAuth planned section จาก `archive_docs/AUTHENTICATION_IMPLEMENTATION.md`
