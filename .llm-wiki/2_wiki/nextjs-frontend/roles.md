# User Roles & Permissions — QSMS
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
ระบบใช้ Role-Based Access Control (RBAC) กำหนดใน `src/config/auth.config.ts`
Role ถูกกำหนดโดย GAS ตอน login และเก็บใน `sessionStorage` ตลอด session

## 2. UserRole Enum
```typescript
export enum UserRole {
  ADMIN    = 'admin',    // Full access
  QSMS     = 'qsms',    // Full access + Delete
  PDB      = 'pdb',      // Add/Overall/Update/Resolution/Export
  OPERATOR = 'operator', // Production Rework
  FINANCE  = 'finance',  // Overall (Valuation only)
  WFG      = 'wfg',      // Rework only, Add Case, Overall, Update Resolution
}
```

## 3. Permission Matrix
| Permission | ADMIN | QSMS | PDB | OPERATOR | FINANCE | WFG |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `view_dashboard` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `view_overall` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create_case` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `edit_case` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `delete_case` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `update_status` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `fill_resolution` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `fill_valuation` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `export_data` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 4. วิธีตรวจสิทธิ์ในโค้ด
```typescript
import { hasPermission } from '../services/auth';

const { hasPermission: canDelete } = hasPermission('delete_case');
if (!canDelete) return <div>ไม่มีสิทธิ์</div>;
```

## 5. Token Config (auth.config.ts)
| ค่า | กำหนดไว้ |
|---|---|
| Token Expiry | 8 ชั่วโมง |
| Session Timeout | 480 นาที (8 ชม.) |
| Max Failed Login | 5 ครั้ง |
| Lockout Duration | 15 นาที |

## 6. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — Role ถูกกำหนดตอน login
- **Impacted By**: [[gas-backend/gas-api.md]] — GAS เป็นผู้กำหนด role ใน JWT payload
