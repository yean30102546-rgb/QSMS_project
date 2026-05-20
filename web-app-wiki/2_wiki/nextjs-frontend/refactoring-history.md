# Refactoring History — QSMS
[วันที่อัปเดต: 2026-05-21]
**Source**: `archive_docs/REFACTORING_SUMMARY.md`

## 1. Summary & Current Implementation
โปรเจกต์ผ่าน Major Refactoring ครั้งใหญ่ — แตก monolithic `App.tsx` (1200+ บรรทัด) ออกเป็น modules ย่อย

## 2. สิ่งที่เปลี่ยนแปลง

### Component Split (เสร็จแล้ว ✅)
**Before**: `App.tsx` 1200+ บรรทัด ทำทุกอย่าง
**After**:
```
App.tsx (orchestrator ≈400 บรรทัด)
├── components/layout/MainLayout.tsx   — Sidebar + routing
├── components/tabs/OverallTab.tsx     — Case list + search
├── components/tabs/AddCaseTab.tsx     — Form + item management  
├── components/tabs/DashboardTab.tsx   — Analytics wrapper
└── components/layout/ErrorBoundary.tsx — Error handling
```

### Services ที่สร้างใหม่ (เสร็จแล้ว ✅)
| Service | ไฟล์ | บทบาท |
|---|---|---|
| Auth | `src/services/auth.ts` | JWT token, session management |
| Validation | `src/services/validation.ts` | Input validation ทุก field |
| Logger | `src/services/logger.ts` | Centralized logging |
| API | `src/services/api.ts` | GAS API calls (เดิม) |

### Case ID Collision Fix (เสร็จแล้ว ✅)
```typescript
// ❌ เก่า: RWYYMMDDHHmm — collision risk ถ้า 2 case ใน 1 นาที
// ✅ ใหม่: RWYYMMDDHHmmMsRRR — millisecond + random suffix
const ms = now.getMilliseconds().toString().padStart(3, '0');
const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
return `RW${yy}${mm}${dd}${hh}${min}${ms}${random}`;
// ไฟล์: src/utils/helpers.ts
```

## 3. Validation Functions (src/services/validation.ts)
```typescript
validateItemNumber(value)   // 10-12 digits
validateItemName(value)     // 2-100 chars, no XSS
validateItemCode(value)     // 1-12 numeric digits
validateAmount(value)       // 1-1000 quantity
validateReason(value)       // Approved reasons only
validateResponsible(value)  // Approved parties only
validateDetails(value)      // 0-500 chars, no XSS
validateReworkItem(item)    // { isValid, errors[] }
sanitizeInput(input)        // Remove XSS patterns (<script, javascript:)
```

## 4. Logger API (src/services/logger.ts)
```typescript
log.debug('msg', data)
log.info('msg', data)
log.warn('msg', data)
log.error('msg', error, metadata)
log.performance('name', durationMs)
log.api('GET', '/api/cases', 200, 1234)
logger.exportLogs()         // JSON export
logger.getLogsByLevel('ERROR')
logger.clearLogs()
```

## 5. สิ่งที่ยังไม่ได้ทำ (Pending)
- [ ] Pagination — ต้องแก้ GAS backend ให้รองรับ offset/limit
- [ ] Remote Logging — ส่ง error ไป Sentry หรือ custom endpoint

## 6. Performance ที่ได้หลัง Refactor
| Metric | Before | After |
|---|---|---|
| App.tsx lines | 1200+ | ~400 |
| Component size avg | 600 | ~150 |
| Build time | ~4s | ~3.1s |
| Bundle size | — | 384.6 KB (118 KB gzipped) |

## 7. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/nextjs.md]] — โครงสร้างโฟลเดอร์ปัจจุบัน
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — auth.ts เป็นส่วนหนึ่งของ refactor
- **Impacted By**: [[nextjs-frontend/rework-module.md]] — components ที่ split ออกมา

> 🔄 *สร้างเมื่อ 2026-05-21*: Ingested จาก `archive_docs/REFACTORING_SUMMARY.md`
