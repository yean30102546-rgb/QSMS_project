import { createClient } from '@supabase/supabase-js';

const ragSupabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL || '';
const ragSupabaseServiceKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY || '';

if (!ragSupabaseUrl || !ragSupabaseServiceKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RAG Supabase URL or Key is missing. Check your environment variables.');
  } else {
    console.warn('RAG Supabase URL or Key is missing. Database operations will fail.');
  }
}

export const ragSupabaseServer = createClient(ragSupabaseUrl, ragSupabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
