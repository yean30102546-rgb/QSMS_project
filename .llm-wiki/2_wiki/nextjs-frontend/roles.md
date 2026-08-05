# User Roles & Permissions — QSMS
[วันที่อัปเดต: 2026-07-21]

## 1. Summary & Current Implementation
ระบบใช้ Role-Based Access Control (RBAC) กำหนดใน `src/config/auth.config.ts` โดยเหลือบทบาทปฏิบัติงานจริง 2 บทบาทหลัก (QSMS และ OPERATOR)

## 2. UserRole Enum
```typescript
// src/config/auth.config.ts (Current)
export enum UserRole {
  QSMS     = 'QSMS',     // Full access + Delete + Management
  OPERATOR = 'OPERATOR',  // Production Rework & Case Entry
}
```
> [Deprecated 2026-07-21] ถอดบทบาท `FINANCE` และการประเมินราคาออกอย่างสมบูรณ์ และยกเลิก `PDB` โดยควบรวมเข้ากับ `OPERATOR` 100%

## 3. Permission Matrix
| Permission | QSMS | OPERATOR |
|---|:---:|:---:|
| `view_dashboard` | ✅ | ❌ |
| `view_overall` | ✅ | ✅ |
| `create_case` | ✅ | ✅ |
| `edit_case` | ✅ | ❌ |
| `delete_case` | ✅ | ❌ |
| `update_status` | ✅ | ✅ |
| `fill_resolution` | ✅ | ✅ |
| `export_data` | ✅ | ❌ |

## 4. วิธีตรวจสิทธิ์ในโค้ด
```typescript
import { hasPermission } from '../services/auth';

const { hasPermission: canDelete } = hasPermission('delete_case');
if (!canDelete) return <div>ไม่มีสิทธิ์</div>;
```

## 5. Token & Auth Config
| ค่า | กำหนดไว้ |
|---|---|
| Token Storage | HTTP-only Cookie (ไม่เก็บใน sessionStorage) |
| Token Expiry | 8 ชั่วโมง |
| Session Restore | `/api/auth/me` → Supabase query (ไม่ใช่ mock) |
| Max Failed Login | 5 ครั้ง (config มี แต่ยังไม่ enforce) |
| Lockout Duration | 15 นาที (config มี แต่ยังไม่ enforce) |
| Password Min Length | 8 ตัวอักษร + uppercase + number + special char |
| Register Default Role | OPERATOR (backend force) |

## 6. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — Role ถูกกำหนดตอน login
- **Depends On**: [[architecture/nextjs-supabase-auth-storage.md]] — Auth ย้ายมาใช้ Supabase 100%
- **[Deprecated]**: ระบบเก่าเคยมี 6 roles (ADMIN, QSMS, PDB, OPERATOR, FINANCE, WFG) และเก็บ token ใน sessionStorage — ถูกยกเลิกแล้ว

---
## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/AUTHENTICATION_IMPLEMENTATION_47689780.md]]
- Ingested Raw Source: [[1_raw/testsprite_spec_158072961.md]]
