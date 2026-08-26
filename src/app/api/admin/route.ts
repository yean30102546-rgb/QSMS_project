import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { requireServerAuth, assertPermission, AuthError } from '@/src/lib/serverAuth';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

export const dynamic = 'force-dynamic';

const PASSWORD_RULES = {
  minLength: 6,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_RULES.minLength) {
    return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_RULES.minLength} ตัวอักษร`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const auth = await requireServerAuth(body);
    
    // Only ADMIN (or QSMS with manage_users if granted) can use this API
    const userRole = String(auth.profile || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'QSMS') {
      throw new AuthError('คุณไม่มีสิทธิ์เข้าถึงส่วนควบคุมของผู้ดูแลระบบ (Admin Only)', 403);
    }

    const { action } = body;

    switch (action) {
      // 1. List all users
      case 'listUsers': {
        const { data: users, error } = await supabaseServer
          .from('users')
          .select('id, username, name, role, employee_id, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(
          { success: true, data: users || [] },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      // 2. Create user (Admin-only)
      case 'createUser': {
        const { username, password, name, role, employee_id } = body;
        const usernameClean = (username || '').trim().toLowerCase();
        const nameClean = (name || '').trim();
        const roleClean = String(role || 'PDF').trim().toUpperCase();
        const employeeIdClean = (employee_id || '').trim().toUpperCase();

        if (!usernameClean || !password || !nameClean) {
          return NextResponse.json(
            { success: false, error: 'กรุณาระบุ Username, Password และชื่อ-นามสกุลให้ครบถ้วน' },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
          return NextResponse.json(
            { success: false, error: passwordError },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Check if username already exists
        const { data: existingUser, error: checkError } = await supabaseServer
          .from('users')
          .select('id')
          .eq('username', usernameClean)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          return NextResponse.json(
            { success: false, error: `ชื่อผู้ใช้งาน "${usernameClean}" มีอยู่ในระบบแล้ว` },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Hash password
        const salt = crypto.randomBytes(16).toString('hex');
        const hashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
        const hash = hashBuffer.toString('hex');
        const password_hash = `${salt}:${hash}`;

        const { data: newUser, error: insertError } = await supabaseServer
          .from('users')
          .insert({
            username: usernameClean,
            password_hash,
            name: nameClean,
            role: roleClean,
            employee_id: employeeIdClean || null,
          })
          .select('id, username, name, role, employee_id, created_at')
          .single();

        if (insertError) throw insertError;

        // Log admin audit event
        await supabaseServer.from('rework_logs').insert([{
          case_id: 'SYSTEM',
          action: `Admin created user "${usernameClean}" with role ${roleClean}`,
          performed_by: auth.email || auth.profile || 'Admin',
          timestamp: new Date().toISOString()
        }]);

        return NextResponse.json(
          { success: true, data: newUser, message: 'สร้างบัญชีผู้ใช้งานสำเร็จ' },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      // 3. Update user
      case 'updateUser': {
        const { id, name, role, employee_id, password } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'User ID is required' },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = String(name).trim();
        if (role) updateData.role = String(role).trim().toUpperCase();
        if (employee_id !== undefined) updateData.employee_id = (employee_id || '').trim().toUpperCase() || null;

        if (password) {
          const passwordError = validatePassword(password);
          if (passwordError) {
            return NextResponse.json(
              { success: false, error: passwordError },
              { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
          const salt = crypto.randomBytes(16).toString('hex');
          const hashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
          const hash = hashBuffer.toString('hex');
          updateData.password_hash = `${salt}:${hash}`;
        }

        const { data: updatedUser, error: updateError } = await supabaseServer
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select('id, username, name, role, employee_id, created_at')
          .single();

        if (updateError) throw updateError;

        // Log audit
        await supabaseServer.from('rework_logs').insert([{
          case_id: 'SYSTEM',
          action: `Admin updated user "${updatedUser.username}" (Role: ${updatedUser.role})`,
          performed_by: auth.email || auth.profile || 'Admin',
          timestamp: new Date().toISOString()
        }]);

        return NextResponse.json(
          { success: true, data: updatedUser, message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ' },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      // 4. Delete user
      case 'deleteUser': {
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'User ID is required' },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Get user details for logging before delete
        const { data: targetUser } = await supabaseServer
          .from('users')
          .select('username')
          .eq('id', id)
          .single();

        if (targetUser && targetUser.username === auth.email?.toLowerCase()) {
          return NextResponse.json(
            { success: false, error: 'ไม่อนุญาตให้ลบบัญชีของตนเอง' },
            { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const { error: deleteError } = await supabaseServer
          .from('users')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        await supabaseServer.from('rework_logs').insert([{
          case_id: 'SYSTEM',
          action: `Admin deleted user "${targetUser?.username || id}"`,
          performed_by: auth.email || auth.profile || 'Admin',
          timestamp: new Date().toISOString()
        }]);

        return NextResponse.json(
          { success: true, message: 'ลบบัญชีผู้ใช้งานสำเร็จ' },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      // 5. Fetch live Audit Logs & Activity Feed
      case 'fetchAuditLogs': {
        const { limit = 40 } = body;
        const { data: logs, error } = await supabaseServer
          .from('rework_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return NextResponse.json(
          { success: true, data: logs || [] },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      // 6. Fetch Admin Monitor Metrics
      case 'fetchMonitorMetrics': {
        // Fetch users summary
        const { data: allUsers } = await supabaseServer
          .from('users')
          .select('role');

        const userRoleCounts: Record<string, number> = {
          ADMIN: 0,
          QSMS: 0,
          WPK: 0,
          PDF: 0,
        };

        (allUsers || []).forEach(u => {
          const r = String(u.role || '').toUpperCase();
          if (userRoleCounts[r] !== undefined) {
            userRoleCounts[r]++;
          } else {
            userRoleCounts[r] = 1;
          }
        });

        // Fetch cases summary
        const { data: cases } = await supabaseServer
          .from('rework_cases')
          .select('id, case_name, status, customer_name, blocked_info, created_at, submission_date')
          .eq('is_deleted', false);

        const statusCounts = {
          pendingAnalysis: 0,
          awaitingMaterials: 0,
          inProgress: 0,
          blocked: 0,
          completed: 0,
          total: (cases || []).length,
        };

        const blockedCasesList: Array<{
          id: string;
          caseName: string;
          customerName: string;
          reasonCategory?: string;
          reasonDetail?: string;
          blockedAt?: string;
          reportedBy?: string;
        }> = [];

        (cases || []).forEach(c => {
          const s = String(c.status || '').trim();
          if (s === 'Pending Analysis') statusCounts.pendingAnalysis++;
          else if (s === 'Awaiting Materials') statusCounts.awaitingMaterials++;
          else if (s === 'In-Progress') statusCounts.inProgress++;
          else if (s === 'Blocked') {
            statusCounts.blocked++;
            const bInfo = c.blocked_info as Record<string, unknown> | null;
            blockedCasesList.push({
              id: c.id,
              caseName: c.case_name || c.id,
              customerName: c.customer_name || '',
              reasonCategory: (bInfo?.reasonCategory as string) || 'other',
              reasonDetail: (bInfo?.reasonDetail as string) || '',
              blockedAt: (bInfo?.blockedAt as string) || c.created_at,
              reportedBy: (bInfo?.reportedBy as string) || '',
            });
          } else if (s === 'Completed') statusCounts.completed++;
          else statusCounts.pendingAnalysis++; // Fallback
        });

        return NextResponse.json(
          {
            success: true,
            data: {
              users: {
                total: (allUsers || []).length,
                roleCounts: userRoleCounts,
              },
              cases: statusCounts,
              blockedCases: blockedCasesList,
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }
    console.error('Admin API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
