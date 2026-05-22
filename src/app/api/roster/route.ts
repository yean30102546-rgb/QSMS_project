import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { AuthError, requireServerAuth } from '../../../lib/serverAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    await requireServerAuth(body);

    switch (action) {
      case 'rosterGetMonth': {
        const { monthKey } = body; // Format: YYYY-MM
        
        // Fetch data from all relevant tables
        // We use .like('date_key', `${monthKey}-%`) to get all records for that month
        const [empRes, overRes, leaveRes] = await Promise.all([
          supabaseServer
            .from('roster_employees')
            .select('*')
            .order('created_at', { ascending: true }),
          supabaseServer
            .from('roster_overrides')
            .select('*')
            .like('date_key', `${monthKey}-%`),
          supabaseServer
            .from('roster_leaves')
            .select('*')
            .like('date_key', `${monthKey}-%`)
        ]);

        if (empRes.error) throw empRes.error;
        if (overRes.error) throw overRes.error;
        if (leaveRes.error) throw leaveRes.error;

        const employees = empRes.data.map(e => ({
          id: e.id,
          name: e.name,
          phase: e.phase,
          startWorkingSaturday: e.start_working_saturday
        }));

        const overrides = overRes.data.map(o => ({
          employeeId: o.employee_id,
          dateKey: o.date_key,
          status: o.status
        }));

        const leaves = leaveRes.data.map(l => ({
          id: l.id,
          employeeId: l.employee_id,
          dateKey: l.date_key,
          leaveType: l.leave_type,
          note: l.note
        }));

        // Note: Holidays are currently returned empty. 
        // In the future, these can be fetched from a static holidays table.
        return NextResponse.json({
          success: true,
          data: { 
            employees, 
            overrides, 
            leaves, 
            holidays: [] 
          }
        });
      }

      case 'rosterAddEmployee': {
        const { name, phase, startWorkingSaturday } = body;
        
        const { data, error } = await supabaseServer
          .from('roster_employees')
          .insert([{ 
            name, 
            phase, 
            start_working_saturday: startWorkingSaturday || null 
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        return NextResponse.json({
          success: true,
          data: { id: data.id, name: data.name, phase: data.phase, startWorkingSaturday: data.start_working_saturday }
        });
        }

        case 'rosterUpdateEmployeePhase': {
        const { employeeId, phase } = body;
        const { error } = await supabaseServer
          .from('roster_employees')
          .update({ phase })
          .eq('id', employeeId);

        if (error) throw error;
        return NextResponse.json({ success: true, data: { employeeId, phase } });
        }

        case 'rosterUpdateEmployeeStartSaturday': {
        const { employeeId, startWorkingSaturday } = body;
        const { error } = await supabaseServer
          .from('roster_employees')
          .update({ start_working_saturday: startWorkingSaturday })
          .eq('id', employeeId);

        if (error) throw error;
        return NextResponse.json({ success: true, data: { employeeId, startWorkingSaturday } });
        }

        case 'rosterUpsertOverride': {
        const { employeeId, dateKey, status } = body;

        // Use upsert with onConflict on the unique constraint [employee_id, date_key]
        const { data, error } = await supabaseServer
          .from('roster_overrides')
          .upsert(
            { employee_id: employeeId, date_key: dateKey, status },
            { onConflict: 'employee_id,date_key' }
          )
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ 
          success: true, 
          data: { 
            employeeId: data.employee_id, 
            dateKey: data.date_key, 
            status: data.status 
          } 
        });
        }

        case 'rosterSwapSaturday': {
        const { employeeId, sourceDateKey, targetDateKey, sourceStatus, targetStatus } = body;

        // Prepare swap operations
        const p1 = sourceStatus === 'CLEAR' 
          ? supabaseServer.from('roster_overrides').delete().eq('employee_id', employeeId).eq('date_key', sourceDateKey)
          : supabaseServer.from('roster_overrides').upsert({ employee_id: employeeId, date_key: sourceDateKey, status: sourceStatus }, { onConflict: 'employee_id,date_key' });

        const p2 = targetStatus === 'CLEAR'
          ? supabaseServer.from('roster_overrides').delete().eq('employee_id', employeeId).eq('date_key', targetDateKey)
          : supabaseServer.from('roster_overrides').upsert({ employee_id: employeeId, date_key: targetDateKey, status: targetStatus }, { onConflict: 'employee_id,date_key' });

        const [res1, res2] = await Promise.all([p1, p2]);

        if (res1.error) throw res1.error;
        if (res2.error) throw res2.error;

        return NextResponse.json({ success: true, data: { employeeId } });
        }

        case 'rosterClearMonthOverrides': {
        const { monthKey } = body;
        const { error } = await supabaseServer
          .from('roster_overrides')
          .delete()
          .like('date_key', `${monthKey}-%`);

        if (error) throw error;
        return NextResponse.json({ success: true, data: { monthKey } });
      }

      case 'rosterDeleteEmployee': {
        const { employeeId } = body;
        // Foreign key cascade delete handles overrides and leaves in Supabase
        const { error } = await supabaseServer
          .from('roster_employees')
          .delete()
          .eq('id', employeeId);
        
        if (error) throw error;
        return NextResponse.json({ success: true, data: { employeeId } });
      }

      case 'rosterUpsertLeave': {
        const { employeeId, dateKey, leaveType, note } = body;
        const { data, error } = await supabaseServer
          .from('roster_leaves')
          .upsert(
            { employee_id: employeeId, date_key: dateKey, leave_type: leaveType, note },
            { onConflict: 'employee_id,date_key' }
          )
          .select()
          .single();
        
        if (error) throw error;
        
        return NextResponse.json({ 
          success: true, 
          data: { 
            id: data.id, 
            employeeId: data.employee_id, 
            dateKey: data.date_key, 
            leaveType: data.leave_type, 
            note: data.note 
          } 
        });
      }

      case 'rosterDeleteLeave': {
        const { employeeId, dateKey } = body;
        const { error } = await supabaseServer
          .from('roster_leaves')
          .delete()
          .eq('employee_id', employeeId)
          .eq('date_key', dateKey);
        
        if (error) throw error;
        return NextResponse.json({ success: true, data: { employeeId, dateKey, deleted: true } });
      }

      default:

        // Pass unknown actions to existing GAS proxy logic for backwards compatibility during migration
        return proxyToGAS(body);
    }
  } catch (error: any) {
    console.error('Roster API Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message, statusCode: error.status },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback proxy to existing Google Apps Script backend
 */
async function proxyToGAS(body: any) {
  const gasUrl = (process.env.GAS_CALENDAR_WEB_APP_URL || '').trim();
  if (!gasUrl) {
    return NextResponse.json(
      { success: false, error: 'Legacy GAS backend URL not configured.' },
      { status: 500 }
    );
  }

  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: `Legacy backend error: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
