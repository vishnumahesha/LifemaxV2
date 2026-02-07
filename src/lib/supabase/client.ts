import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient(): ReturnType<typeof createBrowserClient<Database>> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or if env vars are missing, return null
    // Callers must check for null before using
    console.warn('Supabase credentials not available');
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
