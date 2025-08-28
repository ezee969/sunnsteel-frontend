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
      const method = (config.method || 'GET').toUpperCase();
      console.debug('[http] →', method, url, { secure });
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      // Handle 401 by attempting token refresh
      if (response.status === 401 && secure) {
        try {
          console.log('Refreshing token');
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            // Retry with new token
            tokenService.setAccessToken(refreshed.accessToken);
            return this.request<T>(endpoint, options);
          }
        } catch {
          console.log('Refresh token failed, redirecting to login');
          // If refresh fails, redirect to login
          tokenService.clearAccessToken();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      // Read the body once as text to robustly handle empty/non-JSON payloads
      const raw = await response.text();

      if (!response.ok) {
        let errorMessage = `Request failed with status: ${response.status}`;
        try {
          const parsed = raw ? JSON.parse(raw) : undefined;
          if (parsed && typeof parsed.message === 'string') {
            errorMessage = parsed.message;
          }
        } catch {
          // Non-JSON error body; keep default message
        }
        console.error('[http] ←', response.status, method, url, {
          contentType,
          contentLength,
          rawPreview: raw?.slice(0, 200),
        });
        throw new Error(errorMessage);
      }

      // For 204 No Content or empty body
      if (response.status === 204 || !raw || raw.trim().length === 0) {
        console.debug('[http] ←', response.status, method, url, '(empty body)');
        return {} as T;
      }

      // Prefer JSON; gracefully fallback to raw text if parsing fails
      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(raw) as T;
          console.debug('[http] ←', response.status, method, url, '(json)');
          return data;
        } catch {
          console.warn('[http] JSON parse failed despite content-type json', {
            url,
            status: response.status,
            rawPreview: raw.slice(0, 200),
          });
          return {} as T;
        }
      }

      // Non-JSON content type; return raw text casted with a warning
      console.warn('[http] Non-JSON response; returning text', {
        url,
        status: response.status,
        contentType,
      });
      return raw as unknown as T;
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
