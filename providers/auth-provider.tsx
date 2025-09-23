// Legacy auth provider removed – Supabase auth now in supabase-auth-provider.
// This file remains only as stub to prevent import errors.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => children
export const useAuth = () => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasTriedRefresh: false,
})
