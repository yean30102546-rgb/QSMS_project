# Title: Presentation Scaling & Portal Rendering Gotchas
[Updated: 2026-06-07]

## 1. Summary & Current Implementation
ในการพัฒนาระบบ Guide (Interactive Presentation) ที่ใช้ CSS `transform: scale()` เพื่อย่อส่วนหน้าจอ 1920x1080 ให้พอดีกับเบราว์เซอร์ พบปัญหา 2 อย่าง:
1. **Scrollbar หาย / ขาด:** Component หลัก (`MainLayout`) ใช้ `min-h-screen` ซึ่งจะอิงความสูง `100vh` ของ Native Window ทำให้เมื่ออยู่ในกรอบที่ถูก Scale ส่วนของ UI จะทะลุกรอบและ Scrollbar หายไป 
2. **Modals หลุดออกนอกกรอบ (Escape Scale):** Component Modals (เช่น `UpdateModal`) ใช้ `createPortal(..., document.body)` และ `fixed` positioning ทำให้ Modal ไม่ถูกย่อส่วน (Scale) ไปด้วย และโผล่ออกมาทับซ้อนระบบ

**Current Implementation Fixes:**
- ใช้ `h-full` แทน `min-h-screen` สำหรับ Layout ภายในกรอบ Presentation
- เพิ่ม prop `inline={true}` เพื่อ bypass `createPortal` และเปลี่ยน class จาก `fixed` เป็น `absolute` เพื่อให้ Modal ถูกกักบริเวณอยู่ใน Parent Container 
- เพิ่ม `userRoleOverride` prop ลงใน `UpdateModal` เพื่อให้สามารถใช้งานฟีเจอร์ระดับ Admin ได้เมื่อนำมา Render ในโหมด Mockup (เนื่องจาก Authentication context ไม่ถูกส่งเข้ามาใน Presentation)

## 2. Technical Code Snippet (Best Practice)

**Modal Inline Bypass:**
```tsx
// 1. Bypass createPortal and disable fixed positioning when inline=true
const content = (
  <motion.div className={`${inline ? 'absolute' : 'fixed'} inset-0 bg-black/35 z-40`} />
  // ...
);

if (inline) return content;
return createPortal(content, document.body);
```

**Override Context in Mocks:**
```tsx
// 2. Allow mocking user roles internally
const userRole = userRoleOverride || getCurrentUserRole();
const isAdmin = userRole === UserRole.QSMS;
```

**Layout Height Fix:**
```tsx
// 3. Use h-full instead of min-h-screen for flexible height tracking
<div className="flex h-full w-full overflow-hidden bg-gradient-to-br...">
  {/* children */}
</div>
```

## 3. Knowledge Relationships
- Depends On (must read): N/A
- Impacted By (changes affect): N/A
