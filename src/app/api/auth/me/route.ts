import { NextResponse } from 'next/server';
import { verifyToken, AuthError } from '../../../../lib/serverAuth';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../../lib/supabaseServer';

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

    // Query real user data from Supabase
    const { data: user, error: fetchError } = await supabaseServer
      .from('users')
      .select('username, name, role')
      .eq('username', profileLower)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found', statusCode: 401 },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          email: user.username,
          name: user.name,
          role: user.role.toLowerCase()
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
