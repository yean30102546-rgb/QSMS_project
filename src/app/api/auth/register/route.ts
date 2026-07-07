import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';
import crypto from 'crypto';

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireNumbers: /[0-9]/,
  requireSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_RULES.minLength) {
    return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_RULES.minLength} ตัวอักษร`;
  }
  if (!PASSWORD_RULES.requireUppercase.test(password)) {
    return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว';
  }
  if (!PASSWORD_RULES.requireNumbers.test(password)) {
    return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
  }
  if (!PASSWORD_RULES.requireSpecialChars.test(password)) {
    return 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const usernameLower = username.toLowerCase();

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('username', usernameLower)
      .maybeSingle();

    if (checkError) {
      console.error('Check User Error:', checkError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' },
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Hash the password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const password_hash = `${salt}:${hash}`;

    // Insert user — always default to OPERATOR for security
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        username: usernameLower,
        password_hash,
        name,
        role: 'OPERATOR',
      })
      .select('id, username, name, role')
      .single();

    if (insertError) {
      console.error('Insert User Error:', insertError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถสร้างบัญชีได้' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: newUser
        }
      },
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error: unknown) {
    console.error('Register Error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
