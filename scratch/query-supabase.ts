import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('rework_items')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error fetching rework_items:', error);
    return;
  }
  
  console.log('Fetched Rework Items:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
