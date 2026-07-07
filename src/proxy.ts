import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/serverAuth';

export const config = {
  // ทำงานกับทุก path ยกเว้น assets (รูปภาพ) และไฟล์ระบบของ Next.js (_next)
  matcher: [
    '/((?!api/auth|_next|.*\\..*).*)',
    '/api/(.*)'
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ปล่อยผ่าน API เกี่ยวกับการล็อกอินและตรวจสอบสถานะ (Allow-list)
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me' ||
    pathname === '/api/auth/register'
  ) {
    return NextResponse.next();
  }

  // 2. ดึงค่า Cookie 'auth_token'
  const token = request.cookies.get('auth_token')?.value;

  // 3. ตรวจสอบความถูกต้องของ Token ด้วย WebCrypto
  let isAuthenticated = false;
  if (token) {
    try {
      await verifyToken(token);
      isAuthenticated = true;
    } catch (err) {
      // หากเกิดข้อผิดพลาด เช่น Token หมดอายุ หรือ โดนปลอมแปลง
      console.warn(`[Middleware] Token invalid or expired: ${err}`);
    }
  }

  // 4. การจัดการ API Routes
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. ปล่อยผ่าน Page Routes ให้ React SPA (App.tsx) เป็นคนจัดการ Render หน้า Login เอง
  return NextResponse.next();
}
