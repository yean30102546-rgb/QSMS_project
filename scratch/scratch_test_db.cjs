const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDb() {
  const { data, error } = await supabase.from('rag_documents').select('*').limit(1);
  if (error) {
    console.error('Table error:', error);
  } else {
    console.log('Table exists, data:', data);
  }
}

testDb();
