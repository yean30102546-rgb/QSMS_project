require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking if completed_boxes column exists...");
  const { data, error } = await supabase.from('rework_items').select('completed_boxes').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Column exists! Sample data:", data);
  }
}

check();
