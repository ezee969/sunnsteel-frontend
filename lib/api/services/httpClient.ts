import { tokenService } from './tokenService';
import { authService } from './authService';

// Base API URL
const API_BASE_URL = 'http://localhost:4000/api';

interface ApiRequestConfig extends RequestInit {
  secure?: boolean;
}

export const httpClient = {
  async request<T>(endpoint: string, options: ApiRequestConfig = {}): Promise<T> {
    const { secure = false, ...fetchOptions } = options;
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Add auth header if secure request
    if (secure) {
      Object.assign(headers, tokenService.getAuthHeader());
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 by attempting token refresh
      if (response.status === 401 && secure) {
        try {
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            // Retry with new token
            tokenService.setAccessToken(refreshed.accessToken);
            return this.request<T>(endpoint, options);
          }
        } catch {
          // If refresh fails, redirect to login
          tokenService.clearAccessToken();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `Request failed with status: ${response.status}`
        );
      }

      // For 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // GET request
  get<T>(endpoint: string, secure = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', secure });
  },

  // POST request
  post<T, D = unknown>(endpoint: string, data?: D, secure = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      secure,
    });
  },
};
