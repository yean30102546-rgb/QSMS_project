import { createClient } from '@supabase/supabase-js'; // Force Turbopack Cache Invalidate

const ragSupabaseUrl =
  process.env.NEXT_PUBLIC_RAG_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'http://127.0.0.1:54321';
const ragSupabaseServiceKey =
  process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'missing-service-role-key';

export const ragSupabaseServer = createClient(ragSupabaseUrl, ragSupabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
