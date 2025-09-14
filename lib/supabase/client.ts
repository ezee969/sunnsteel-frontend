import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, environment variables might not be available
// Create a dummy client to prevent build errors, but throw at runtime if needed
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Only throw error on client-side (runtime)
    throw new Error('Missing Supabase environment variables');
  }

  // During build time (server-side), create dummy client to prevent build errors
  console.warn(
    '⚠️ Supabase environment variables not found during build - using dummy client'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
