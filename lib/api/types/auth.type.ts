export interface User {
  id: string;
  email: string;
  name: string;
}
// Legacy token-based DTOs removed. Supabase flows return profile via
// supabase-auth-provider (see supabaseAuthService.verifyToken).
