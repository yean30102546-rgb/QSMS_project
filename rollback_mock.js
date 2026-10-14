const { createClient } = require('c:/Workplace/QSMS_project/node_modules/@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('c:\\Workplace\\QSMS_project\\.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const mockCaseIds = [];
for (let i = 11; i <= 65; i++) {
  mockCaseIds.push(`RW-2026-${String(i).padStart(3, '0')}`);
}
mockCaseIds.push('RT-2026-003', 'RT-2026-004', 'RT-2026-005');

async function rollback() {
  console.log('Starting rollback of ' + mockCaseIds.length + ' mock cases...');
  
  const { error: err1 } = await supabase.from('rework_items').delete().in('case_id', mockCaseIds);
  if (err1) console.error('Error deleting items:', err1);
  else console.log('Mock rework_items deleted.');

  const { error: err2 } = await supabase.from('rework_logs').delete().in('case_id', mockCaseIds);
  if (err2) console.error('Error deleting logs:', err2);
  else console.log('Mock rework_logs deleted.');

  const { error: err3 } = await supabase.from('rework_cases').delete().in('id', mockCaseIds);
  if (err3) console.error('Error deleting cases:', err3);
  else console.log('Mock rework_cases deleted.');

  console.log('Rollback completed.');
}

rollback().catch(console.error);
