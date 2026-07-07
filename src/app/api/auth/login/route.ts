import { NextResponse } from 'next/server';
import { generateToken } from '../../../../lib/serverAuth';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../../lib/supabaseServer';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, password } = body;
    const profileLower = (profile || '').toLowerCase();

    // Query user from Supabase
    const { data: user, error: fetchError } = await supabaseServer
      .from('users')
      .select('id, username, password_hash, name, role')
      .eq('username', profileLower)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Verify password
    const [salt, hash] = user.password_hash.split(':');
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');

    if (hash === verifyHash) {
      const role = user.role.toLowerCase();
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
              email: profileLower,
              name: user.name,
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
