require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const supabaseKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching distinct shelf_life values from engineering_drawings...");
  
  const { data, error } = await supabase
    .from('engineering_drawings')
    .select('shelf_life')
    .not('shelf_life', 'is', null);
    
  if (error) {
    console.error("Error fetching data:", error);
    return;
  }
  
  const uniqueValues = new Map();
  data.forEach(row => {
    const val = row.shelf_life.trim();
    if (val) {
      uniqueValues.set(val, (uniqueValues.get(val) || 0) + 1);
    }
  });
  
  console.log(`Found ${uniqueValues.size} unique values:`);
  const sorted = Array.from(uniqueValues.entries()).sort((a, b) => b[1] - a[1]);
  for (const [val, count] of sorted) {
    console.log(`- "${val}" (Count: ${count})`);
  }
}

main();
