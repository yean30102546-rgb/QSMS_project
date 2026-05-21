import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

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
          data: { 
            id: data.id, 
            name: data.name, 
            phase: data.phase, 
            startWorkingSaturday: data.start_working_saturday 
          }
        });
      }

      default:
        // Pass unknown actions to existing GAS proxy logic for backwards compatibility during migration
        return proxyToGAS(body);
    }
  } catch (error: any) {
    console.error('Roster API Error:', error);
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
