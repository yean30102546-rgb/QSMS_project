# Portal Shell — Workspace Portal
[วันที่อัปเดต: 2026-05-21]

## 1. Summary & Current Implementation
Portal Shell (`WorkspacePortal.tsx`) ทำหน้าที่เป็นศูนย์กลาง (Central Launcher) สำหรับเข้าถึงโมดูลต่างๆ โดยเวอร์ชันล่าสุดได้เพิ่ม **Live Previews** เพื่อดึงสถิติสำคัญจากแต่ละโมดูลมาแสดงผลลัพธ์แบบ Real-time ก่อนเข้าใช้งาน
- **Data Fetching**: ใช้ `fetchAllCases` จาก Rework API และ `fetchRosterMonth` จาก Roster API
- **Visual Style**: ใช้ Soft Glassmorphism สอดคล้องกับหน้า Login
- **Localization**: รองรับภาษาไทย 100% สำหรับ Label และ Header หลัก

## 2. Technical Code Snippet (Best Practice)
```typescript
// การดึงข้อมูล Preview สถิติใน Portal
useEffect(() => {
  const fetchStats = async () => {
    const rework = await fetchAllCases();
    const roster = await fetchRosterMonth(currentMonthKey);
    // สังเคราะห์ข้อมูลเป็นสถานะย่อย (Pending, In-Progress, Active Employees)
    setReworkStats({ ... });
    setRosterStats({ ... });
  };
  fetchStats();
}, []);
```

## 3. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/auth-flow.md]] — ต้องผ่านการพิสูจน์ตัวตนก่อนเข้าถึง Portal
- **Depends On**: [[nextjs-frontend/rework-module.md]] — ดึงข้อมูลเคสมาแสดงผล Preview
- **Depends On**: [[nextjs-frontend/roster-module.md]] — ดึงรายชื่อพนักงานมาแสดงผล Preview
- **Impacted By**: [[architecture/system-architecture.md]] — เป็นส่วนประกอบหลักใน Frontend Layer

---
> 🔄 *สร้างเมื่อ 2026-05-21*: บันทึกการเพิ่มระบบ Preview และการปรับปรุง UI/UX ใน Portal Shell
