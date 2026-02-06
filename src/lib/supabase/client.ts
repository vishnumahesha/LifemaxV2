import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or if env vars are missing, return a mock client
    // that won't be used (pages will handle auth state properly)
    console.warn('Supabase credentials not available');
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
