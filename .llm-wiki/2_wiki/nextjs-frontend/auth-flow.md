# Auth Flow — QSMS Rework Management
[วันที่อัปเดต: 2026-05-22]

## 1. Summary & Current Implementation
ระบบ Login ใช้ PIN-based authentication ผ่าน GAS backend โดยมีการออกแบบหน้าจอใหม่ในสไตล์ **Soft Glassmorphism** (Apple-inspired) เพื่อความทันสมัยและเป็นมิตรต่อผู้ใช้งาน
- **Frontend**: ใช้ React + Tailwind CSS + motion/react สำหรับ UI/UX
- **Backend**: สื่อสารกับ GAS ผ่าน Next.js API Routes (Proxy)
- **Token**: เก็บใน `sessionStorage` (JWT)
- **Logout Transition**: ระบบออกจากระบบมีกระบวนการแอนิเมชันแบบสปริงร่วมกับกลาสมอร์ฟิสซึมระดับพรีเมียม (Apple-style segment loader) หน่วงเวลาการเปลี่ยนผ่าน 1.5 วินาทีเพื่อป้องกันความหยาบกระด้างและถอดถอนข้อมูลเซสชันอย่างปลอดภัย

## 2. UI/UX Design (Modernization 2026)
หน้าจอ Login และส่วนอื่นๆ เปลี่ยนจาก Dark Theme เป็น **Minimal Monochrome (Apple Pro)**:
- **Visual Style**:Grayscale Gradient (`#F5F5F7` to White), ใช้การเบลอหลังกระจก (`backdrop-blur-xl`)
- **Buttons**: ใช้สี Midnight Black (`#1d1d1f`) พร้อม Apple-inspired scale effects
- **Interactions**: Micro-animations ตอนเข้าหน้าจอ และ Group-focus feedback บนช่อง Input

## 3. Backend Strategy
ปัจจุบันระบบกำลังย้ายจาก GAS ไปสู่ **Supabase**:
- **Status**: Roster และ Rework Transactional data ย้ายไป Supabase 100% แล้ว
- **API**: เชื่อมต่อผ่าน `/api/rework` และ `/api/roster` (Next.js Server-side)
- **Speed**: การบันทึกและตรวจสอบรหัสสินค้า (ItemMaster) ทำงานในหลักมิลลิวินาที
```typescript
// src/components/Login.tsx — Glassmorphism Implementation
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="glass-panel rounded-[36px] bg-white/30 backdrop-blur-md shadow-2xl"
>
  <input className="glass-input w-full rounded-2xl py-3.5" ... />
</motion.section>

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
```

## 4. ฟังก์ชันสำคัญใน auth.ts
| ฟังก์ชัน | หน้าที่ |
|---|---|
| `loginWithPassword(userId, password)` | PIN Login ผ่าน GAS |
| `isAuthenticated()` | ตรวจ token + expiry ใน sessionStorage |
| `getCurrentUser()` | อ่าน User object จาก sessionStorage |
| `getCurrentUserRole()` | อ่าน UserRole จาก sessionStorage |
| `hasPermission(permission)` | ตรวจสิทธิ์จาก ROLE_PERMISSIONS |
| `logout()` | ล้าง sessionStorage ทั้งหมด |
| `getAuthHeaders()` | ส่ง Authorization: Bearer token header |

## 5. Lessons Learned {#lessons}
- **Glassmorphism**: การใช้ `backdrop-filter` ช่วยให้ UI ดูพรีเมียม แต่ต้องระวังเรื่อง Contrast สีตัวอักษร (ใช้ Deep Navy `#1d1d1f` บนพื้นหลังสว่าง)
- **Token Security**: ย้ายจาก local PIN → GAS-issued JWT เพื่อความปลอดภัยสูงสุด
- **[Deprecated]**: ระบบเก่าใช้ hardcoded `admin/admin123` และตรวจ PIN ใน frontend (ถูกยกเลิกแล้ว)

## 6. Firebase / Google OAuth (Planned — ยังไม่ได้ implement)
> **[Planned]** มีเอกสาร `archive_docs/AUTHENTICATION_IMPLEMENTATION.md` วางแผนใช้ Firebase + Google OAuth
> แต่ปัจจุบัน `loginWithGoogle()` และ `loginWithEmail()` ถูก **Disable** แล้วในโค้ดจริง

## 7. Premium Logout Transition (Apple Pro Style)
เพื่อเพิ่มความลื่นไหลและดูเป็นมืออาชีพ ระบบได้ทำ Centralized Transition ใน `App.tsx`:
- **Main View Wrapper**: ห่อหุ้มหน้าจอหลักทั้งหมดและลดขนาดลง (`scale: 0.96`), ใส่เอฟเฟกต์เบลอ (`blur(12px)`) และลดความโปร่งแสง (`opacity: 0`) ด้วย `motion.div` แบบสปริงตอนออกจากระบบ
- **Logout Overlay**: ใช้ `AnimatePresence` แสดง Fullscreen Glassmorphic Overlay (`bg-slate-950/50 backdrop-blur-md`) และกล่องข้อความที่มีเอฟเฟกต์ Pulsing และ SVG segment loader แบบหมุน 360 องศา
- **Execution Flow**: 
  1. ตั้งค่าสถานะ `isLoggingOut` เป็น `true` เพื่อจำลองการแสดงอนิเมชันและ Overlay
  2. รอเวลา 1.5 วินาทีเพื่อให้ออนิเมชันรันเสร็จเรียบร้อย
  3. ดำเนินการล้างเซสชันผ่าน `authLogout()`
  4. ตั้งค่ามุมมองหลักกลับสู่ `'portal'` หน้าแรก และสลับ `isLoggingOut` กลับเป็น `false` เพื่อให้อนิเมชันไหลออกนุ่มนวล

## 8. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — GAS ต้องมี `AUTH_TOKEN_SECRET` และ `*_PIN` properties
- **Depends On**: [[nextjs-frontend/roles.md]] — Role กำหนดสิทธิ์หลัง login
- **Impacted By**: [[nextjs-frontend/nextjs.md]] — `/api/rework` route เป็น proxy ที่ auth ต้องพึ่ง
- **Uses**: [[nextjs-frontend/shadcn-ui.md]] — ใช้มาตรฐานการดีไซน์ร่วมกับ component อื่นๆ

---
> 🔄 *อัปเดตเมื่อ 2026-05-22*: เพิ่มคุณลักษณะ Premium Logout Transition (Apple Pro Style) เพื่อการหน่วงสลับเซสชันอย่างงดงาม



## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/FIREBASE_PROVIDER_GUIDE_1202618693.md]]
