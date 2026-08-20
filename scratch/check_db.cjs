require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('rework_items')
    .select('id, case_id')
    // A UUID has length 36
    .filter('case_id', 'not.ilike', 'RT%')
    .filter('case_id', 'not.ilike', 'RW%');
  console.log("Items without RW/RT:", data);
}

test();
