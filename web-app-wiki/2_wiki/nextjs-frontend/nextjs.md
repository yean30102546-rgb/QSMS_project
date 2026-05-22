# Next.js Config & Architecture — QSMS
[วันที่อัปเดต: 2026-05-22]

## 1. Summary & Current Implementation
โปรเจกต์ใช้ **Next.js App Router** (ไม่ใช่ Pages Router) รันที่ port 3000
GAS ไม่ถูกเรียกตรงจาก browser — ผ่าน Next.js API Routes เป็น Proxy ทั้งหมด (แก้ปัญหา CORS)

## 2. Next.js 15 Features & Rendering Strategies
โปรเจกต์ QSMS เลือกใช้ Next.js 15 เพื่อเพิ่มประสิทธิภาพและผลิตภาพของนักพัฒนา:
- **Rendering Modes Selection**:
  - **Server-Side Rendering (SSR)**: ทำการเรนเดอร์หน้าเว็บฝั่ง Server ทุกครั้งที่มี Request เหมาะสมกับข้อมูล Rework/Roster ที่เปลี่ยนแปลงบ่อยครั้งเพื่อความสดใหม่ของข้อมูล
  - **Static Site Generation (SSG)**: เหมาะสำหรับหน้าเพจที่เป็นข้อมูลคงที่ (เช่น หน้าแนะนำหรือข้อตกลงใช้งาน) ซึ่งจะเรนเดอร์เป็น HTML ตั้งแต่ขั้นตอน Build ทำให้โหลดหน้าเว็บได้รวดเร็วมาก
  - **Client-Side Rendering (CSR)**: ใช้สำหรับส่วนโต้ตอบที่ซับซ้อน เช่น ตารางเวรและการอัปเดตข้อมูลของ modal ที่ต้องการประมวลผลบนเบราว์เซอร์ทันที
- **Automatic Code Splitting**: Next.js แบ่งย่อย JavaScript อัตโนมัติเป็นชิ้นเล็กๆ ตามเส้นทางที่ใช้งานจริง ทำให้ไฟล์ที่ไม่จำเป็นยังไม่ถูกโหลดมา ทำให้ผู้ใช้เข้าหน้า Portal ได้อย่างฉับไว
- **Turbopack**: ใช้เป็นระบบ Compiler แทน Webpack ในระหว่างพัฒนา (`next dev --turbo`) ทำให้การประมวลผลและการทำ Fast Refresh รวดเร็วขึ้นอย่างมหาศาล
- **Built-in Support for Tailwind CSS & TypeScript**: รองรับการตรวจสอบคุณภาพโค้ดผ่าน ESLint และการประมวลผลสไตล์ร่วมกับ Tailwind ได้อย่างเป็นธรรมชาติ

## 3. โครงสร้างสำคัญ
```
src/
├── app/
│   ├── layout.tsx          # Root Layout
│   ├── page.tsx            # Entry page (redirect to login/app)
│   └── api/
│       ├── rework/route.ts # Proxy → GAS_WEB_APP_URL (Rework)
│       └── roster/route.ts # Proxy → GAS_CALENDAR_WEB_APP_URL (Roster)
├── components/
│   ├── Login.tsx           # หน้า Login (PIN-based)
│   ├── ImageUpload.tsx     # อัปโหลดรูปสูงสุด 5 รูป/item
│   ├── layout/             # ErrorBoundary, Layout components
│   ├── modals/             # UpdateModal และ modals อื่นๆ
│   ├── tabs/               # Overall, AddCase, Dashboard tabs
│   └── ui/                 # Reusable UI components
├── modules/
│   ├── rework/             # ReworkApp.tsx — ระบบจัดการงาน Rework
│   ├── roster/             # ระบบตารางเวร
│   └── platform/           # Platform-level features
├── services/
│   ├── api.ts              # GAS API calls (Rework)
│   ├── auth.ts             # Authentication logic
│   ├── rosterApi.ts        # GAS API calls (Roster/Calendar)
│   ├── validation.ts       # Input validation rules
│   ├── logger.ts           # Logging utility
│   └── mockData.ts         # Mock data สำหรับ dev/test
├── config/
│   └── auth.config.ts      # Roles, Permissions, Token config
└── utils/                  # Utility functions
```

## 3. Technical Code Snippet (Best Practice)
```typescript
// Pattern: Next.js API Route as GAS Proxy
// src/app/api/rework/route.ts
export async function POST(request: Request) {
  const gasUrl = (process.env.GAS_WEB_APP_URL || '').trim();
  const body = await request.json();
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // ⚠️ text/plain หรือ GAS จะ CORS error
    body: JSON.stringify(body),
  });
  return NextResponse.json(await response.json());
}
```

## 4. Environment Variables ที่ Next.js ใช้
| Variable | ใช้ที่ | หมายเหตุ |
|---|---|---|
| `GAS_WEB_APP_URL` | `/api/rework/route.ts` | Server-side เท่านั้น |
| `GAS_CALENDAR_WEB_APP_URL` | `/api/roster/route.ts` | Server-side เท่านั้น |
| `REACT_APP_GAS_WEB_APP_URL` | `modules/rework/ReworkApp.tsx` | Client-side fallback |
| `NODE_ENV` | logger.ts, ErrorBoundary | dev vs prod |

## 5. Knowledge Relationships
- **Depends On**: [[gas-backend/gas-api.md]] — API routes ต้องมี GAS URL ตั้งค่าใน `.env`
- **Impacted By**: [[nextjs-frontend/auth-flow.md]] — auth ผ่าน `/api/rework` route
