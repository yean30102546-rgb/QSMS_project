import { NextResponse } from 'next/server';
import { verifyToken, AuthError } from '../../../../lib/serverAuth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    const profileLower = String(payload.sub || '').toLowerCase();
    
    const mockAccounts: Record<string, { pass: string, role: string, name: string }> = {
      'qsms': { pass: process.env.MOCK_PASS_QSMS || 'Qsms123', role: 'qsms', name: 'QSMS Test' },
      'operator': { pass: process.env.MOCK_PASS_OPERATOR || 'Operator123', role: 'operator', name: 'Operator Test' },
      'finance': { pass: process.env.MOCK_PASS_FINANCE || 'Finance123', role: 'finance', name: 'Finance Test' }
    };

    const name = mockAccounts[profileLower]?.name || profileLower.toUpperCase();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          email: `${profileLower}@test.com`,
          name: name,
          role: payload.profile
        }
      }
    });

  } catch (error: unknown) {
    if (error instanceof AuthError) {
      const authError = error as AuthError;
      return NextResponse.json(
        { success: false, error: authError.message, statusCode: 401 },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
