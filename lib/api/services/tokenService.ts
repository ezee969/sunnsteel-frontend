// This file handles all token-related operations

// Storage key
const ACCESS_TOKEN_KEY = 'access_token';
let accessToken: string | null = null;

function readFromStorage(): string | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToStorage(token: string | null) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (token) {
      window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const tokenService = {
  // Set access token
  setAccessToken(token: string): void {
    accessToken = token;
    writeToStorage(token);
  },

  // Get access token
  getAccessToken(): string | null {
    if (accessToken) return accessToken;
    const fromStorage = readFromStorage();
    if (fromStorage) accessToken = fromStorage;
    return accessToken;
  },

  // Clear tokens (logout)
  clearAccessToken(): void {
    accessToken = null;
    writeToStorage(null);
  },

  // Create authorization header
  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
