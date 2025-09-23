// Temporary adapter to unify legacy useAuth consumers onto Supabase auth.
// Gradually replace imports of '@/providers/auth-provider' with this module.

export { useSupabaseAuth as useAuth } from './supabase-auth-provider'
