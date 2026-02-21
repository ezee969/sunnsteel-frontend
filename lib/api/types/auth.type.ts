export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  sex?: 'MALE' | 'FEMALE' | null;
  weight?: number | null;
  height?: number | null;
  weightUnit?: 'KG' | 'LB' | null;
}
// Legacy token-based DTOs removed. Supabase flows return profile via
// supabase-auth-provider (see supabaseAuthService.verifyToken).
