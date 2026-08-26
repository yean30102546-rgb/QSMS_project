import { createClient } from '@supabase/supabase-js'; // Force Turbopack Cache Invalidate

const ragSupabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL || 'https://bjibpmmuhggpvuaqgpjd.supabase.co';
const ragSupabaseServiceKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqaWJwbW11aGdncHZ1YXFncGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQ4ODcyMiwiZXhwIjoyMDk3MDY0NzIyfQ.f31sl6KMVTVbiRfYCbQJGxq7Fo7iqDOiw-xMrSMX0uU';

export const ragSupabaseServer = createClient(ragSupabaseUrl, ragSupabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
