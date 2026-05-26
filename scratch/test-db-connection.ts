import { supabaseServer } from '../src/lib/supabaseServer';

async function testConnection() {
  console.log("🔍 Checking connection to Supabase...");
  try {
    const { data, error } = await supabaseServer.from('rag_documents').select('id').limit(1);
    if (error) {
      if (error.code === 'P0001' || error.message.includes('does not exist')) {
        console.log("⚠️ Connection OK, but 'rag_documents' table does not exist yet. Please execute 'supabase/migrations/20260526_rag_init.sql' in the Supabase SQL Editor.");
        process.exit(0);
      } else {
        console.error("❌ Database connection error:", error);
        process.exit(1);
      }
    }
    console.log("✅ Database connection successful! 'rag_documents' table exists and is accessible. Data:", data);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

testConnection();
