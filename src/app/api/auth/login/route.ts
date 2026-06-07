import { NextResponse } from 'next/server';
import { generateToken } from '../../../../lib/serverAuth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, password } = body;
    const profileLower = (profile || '').toLowerCase();

    // MOCK ACCOUNTS
    const mockAccounts: Record<string, { pass: string, role: string, name: string }> = {
      'qsms': { pass: process.env.MOCK_PASS_QSMS || 'Qsms123', role: 'qsms', name: 'QSMS Test' },
      'operator': { pass: process.env.MOCK_PASS_OPERATOR || 'Operator123', role: 'operator', name: 'Operator Test' },
      'finance': { pass: process.env.MOCK_PASS_FINANCE || 'Finance123', role: 'finance', name: 'Finance Test' }
    };

    if (mockAccounts[profileLower] && mockAccounts[profileLower].pass === password) {
      const role = mockAccounts[profileLower].role;
      const token = await generateToken(profileLower, role);

      // Set HTTP-Only Cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 3600, // 8 hours
        path: '/',
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            user: {
              email: `${profileLower}@test.com`,
              name: mockAccounts[profileLower].name,
              role: role
            },
            expiresIn: 8 * 3600
          }
        },
        { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    return NextResponse.json(
      { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error: unknown) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
