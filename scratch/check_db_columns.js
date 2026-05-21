import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Key missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('Querying schema info from Supabase...');
  try {
    const { data, error } = await supabase.from('rework_items').select('*').limit(1);
    if (error) {
      console.error('Error fetching from rework_items:', error);
    } else {
      console.log('Successfully fetched from rework_items. Returned keys:');
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
      } else {
        const res = await fetch(`${supabaseUrl}/rest/v1/rework_items?select=*`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Range-Unit': 'items',
            'Range': '0-0'
          }
        });
        const json = await res.json();
        console.log('REST response keys/values:', json[0] ? Object.keys(json[0]) : json);
      }
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

checkColumns();
