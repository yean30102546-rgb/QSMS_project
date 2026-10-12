import { NextResponse } from 'next/server';
import { generateToken } from '../../../../lib/serverAuth';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../../lib/supabaseServer';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

// In-memory rate limiting map: username -> array of timestamps within last 15 mins
const LOGIN_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginRateLimitMap = new Map<string, number[]>();

function recordFailedAttempt(username: string): void {
  const now = Date.now();
  const attempts = (loginRateLimitMap.get(username) || []).filter(ts => now - ts < LOGIN_WINDOW_MS);
  attempts.push(now);
  loginRateLimitMap.set(username, attempts);
}

function clearFailedAttempts(username: string): void {
  loginRateLimitMap.delete(username);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, password } = body;
    const profileClean = (profile || '').trim().toLowerCase();

    if (!profileClean || !password) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Check rate limit: max 5 failed attempts per 15 minutes per username
    const now = Date.now();
    const failedAttempts = (loginRateLimitMap.get(profileClean) || []).filter(ts => now - ts < LOGIN_WINDOW_MS);
    if (failedAttempts.length >= LOGIN_MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: 'คุณระบุรหัสผ่านผิดเกิน 5 ครั้ง กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง' },
        { status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Query user from Supabase
    const { data: user, error: fetchError } = await supabaseServer
      .from('users')
      .select('id, username, password_hash, name, role')
      .eq('username', profileClean)
      .single();

    if (fetchError || !user) {
      recordFailedAttempt(profileClean);
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' },
        { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Verify password asynchronously
    const [salt, hash] = user.password_hash.split(':');
    const hashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
    const verifyHash = hashBuffer.toString('hex');

    if (hash === verifyHash) {
      clearFailedAttempts(profileClean);
      const role = user.role.toLowerCase();
      const token = await generateToken(profileClean, role);

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
              email: profileClean,
              name: user.name,
              role: role
            },
            expiresIn: 8 * 3600
          }
        },
        { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    recordFailedAttempt(profileClean);
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
