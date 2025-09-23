// Legacy tokenService removed – Supabase handles session tokens internally.
// This stub remains only to prevent import errors during transition.
export const tokenService = {
  setAccessToken: () => {},
  getAccessToken: () => null as string | null,
  clearAccessToken: () => {},
  getAuthHeader: () => ({} as Record<string, string>),
}
