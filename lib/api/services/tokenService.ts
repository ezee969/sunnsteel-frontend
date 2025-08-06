// This file handles all token-related operations

// Storage keys
let accessToken: string | null = null;

export const tokenService = {
  // Set access token
  setAccessToken(token: string): void {
    accessToken = token;
  },

  // Get access token
  getAccessToken(): string | null {
    return accessToken;
  },

  // Clear tokens (logout)
  clearAccessToken(): void {
    accessToken = null;
  },

  // Create authorization header
  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
