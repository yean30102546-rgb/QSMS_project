require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('rework_items')
    .select('*')
    .eq('id', 'fa2f55b6-ce02-4a84-93b4-cbea569474d5')
    .single();
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
run();
