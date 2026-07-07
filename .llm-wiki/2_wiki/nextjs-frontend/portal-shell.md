# Portal Shell — Workspace Portal (Landing Page & Guest Mode)
[วันที่อัปเดต: 2026-05-22]

## 1. Summary & Current Implementation
Portal Shell (`WorkspacePortal.tsx`) ทำหน้าที่เป็น Landing Page ศูนย์กลางควบคุมกลางแบบสาธารณะ (Unauthenticated Entry)
- **Guest Mode (ผู้มาเยือน)**: ผู้ใช้ที่ไม่ผ่านการล็อกอินสามารถดูสถิติจริง (Live Overview) ได้โดยตรง โดย API จะเรียกผ่าน Endpoint สาธารณะ `fetchPublicOverview` ซึ่งมีความปลอดภัยสูง ดึงเฉพาะสถิติสรุปเท่านั้น ไม่ดึงรายชื่อหรือรายละเอียดส่วนตัว
- **Live Dot Status Indicators**: เพิ่มสัญลักษณ์จุดสีเขียวกระพริบ (Green pulsating dot) เพื่อระบุว่าเป็นข้อมูลจริง ณ ปัจจุบัน (Live)
- **Authentication & Redirection**: 
  - เมื่อผู้ใช้ Guest กดปุ่ม "เริ่มใช้งาน" ที่ Rework หรือ Roster จะถูกสลับไปหน้า Login ทันที โดยระบบจำจำค่าเป้าหมาย (`redirectAfterLogin`)
  - หลังจากล็อกอินสำเร็จ ระบบจะนำทางผู้ใช้ไปที่โมดูลนั้นๆ โดยอัตโนมัติ (Auto-redirect)
  - หน้า Login มีปุ่ม "ย้อนกลับสู่ศูนย์ควบคุม" (`onBack`) เพื่อให้สามารถกลับมาหน้า Landing Page ได้อย่างสะดวก

## 2. Technical Code Snippet (Best Practice)
```typescript
// การแยกแยะผู้มาเยือนกับผู้ใช้ทั่วไปในการดึงข้อมูล
useEffect(() => {
  if (isGuest) {
    // ดึงข้อมูลผ่าน Endpoint สาธารณะที่ไม่เปิดเผยข้อมูลส่วนตัว
    const fetchPublic = async () => {
      const response = await fetch('/api/rework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchPublicOverview' })
      });
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setReworkStats({ ...resJson.data.rework, hasData: true });
        setRosterStats({ ...resJson.data.roster, hasData: true });
      }
    };
    fetchPublic();
    return;
  }
  // ดึงข้อมูลตัวเต็มเมื่อล็อกอินแล้ว
  fetchRework();
  fetchRoster();
}, [isGuest]);
```

## 3. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — การขัดจังหวะเพื่อล็อกอินเมื่อเปิดโมดูลและการบันทึกสเตตเพื่อทำ Auto-redirect
- **Depends On**: [[nextjs-frontend/rework-module.md]] — โครงสร้างสถิติของ Rework
- **Depends On**: [[nextjs-frontend/roster-module.md]] — โครงสร้างการลางานและพนักงานของ Roster
- **Impacted By**: [[architecture/system-architecture.md]] — ส่วนประกอบหลักใน Frontend Layer

---
## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/central_portal_plan_603507707.md]]

