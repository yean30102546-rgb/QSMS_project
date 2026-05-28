# Title: Type-Safety Refactoring & E2E Session Storage Bootstrapping
[วันที่อัปเดต: 2026-05-28]

## 1. Summary & Current Implementation
การเปิดใช้งาน `"noImplicitAny": true` ใน `tsconfig.json` กำหนดให้ระบบห้ามใช้ type `any` ทั้งหมด โดยเฉพาะการจัดการผลลัพธ์ของ Supabase RPC, error ใน catch block, และฟังก์ชัน proxy ต่างๆ 
นอกจากนี้ ในการทดสอบ End-to-End (E2E) ด้วย Playwright เราหลีกเลี่ยงขั้นตอนการกด UI ล็อกอินที่ล่าช้าและเปราะบางด้วยการใช้ `page.evaluate()` บูตสแตรปข้อมูล JWT Token, User Role (`QSMS`), และสถานะ View หน้าจอลงใน `sessionStorage` โดยตรงก่อนที่แอปพลิเคชันจะ Mount ซึ่งทำรอบทดสอบ E2E ทำงานได้เสถียรและเร็วขึ้นมาก

## 2. Technical Code Snippet (Best Practice)

### การจัดการ Type-Safe RPC และ Catch Block
```typescript
interface DocumentChunk {
  content: string;
  image_urls?: string[];
  similarity: number;
}

// 1. แคสต์ผลลัพธ์จาก RPC
const chunks = (matchedChunks as DocumentChunk[] | null) || [];

// 2. ใช้ type unknown สำหรับ catch block เสมอ
} catch (error: unknown) {
  console.error('❌ Error:', error);
  const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
}
```

### การทำ E2E Authentication Bootstrapping ด้วย Playwright
```typescript
test.beforeEach(async ({ page }) => {
  // 1. ม็อก API POST endpoints
  await page.route('/api/rework', async route => { ... });

  // 2. ไปที่หน้าแรกแล้วเขียนค่าเข้า sessionStorage ก่อนที่ React App จะ Mount โครงร่างเต็มรูปแบบ
  await page.goto('/');
  await page.evaluate(() => {
    const tokenHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const tokenPayload = btoa(JSON.stringify({ sub: 'test@example.com', profile: 'QSMS', exp: Math.floor(Date.now() / 1000) + 3600 }));
    const tokenSignature = 'dummysignature';
    const dummyToken = `${tokenHeader}.${tokenPayload}.${tokenSignature}`;
    
    sessionStorage.setItem('qsms_token', dummyToken);
    sessionStorage.setItem('qsms_user', JSON.stringify({
      email: 'test@example.com',
      name: 'Test Admin',
      role: 'QSMS' // ต้องใช้บทบาทจริง 'QSMS' (ไม่ใช่ 'ADMIN')
    }));
    sessionStorage.setItem('qsms_role', 'QSMS');
    sessionStorage.setItem('qsms_token_expiry', (Date.now() + 3600000).toString());
    sessionStorage.setItem('currentView', 'rework'); // บังคับให้โหลด ReworkApp ทันที
  });
  await page.reload(); // โหลดหน้าใหม่เพื่อให้ React ดึงค่า sessionStorage ไปตั้งค่าเริ่มต้น
});
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[tech-stack/nextjs.md]], [[tech-stack/auth.config.ts]]
Impacted By (ได้รับผลกระทบจาก): การกำหนดสิทธิ์ของระบบด้วยบทบาท `QSMS` (ดูความสัมพันธ์ใน [[lessons-learned/rbac-casing-and-e2e.md]])
Contradicts (ข้อขัดแย้งที่เคยพบ): ในอดีตทดลองใช้ UI Login ใน Playwright แต่พังได้ง่ายหาก CSS ปรับเปลี่ยน ปัจจุบันล็อกอินตรงผ่าน sessionStorage ทำให้ E2E เสถียร 100%
