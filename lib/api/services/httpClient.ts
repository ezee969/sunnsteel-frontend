import { tokenService } from './tokenService';
import { authService } from './authService';

// Base API URL
const API_BASE_URL = 'http://localhost:4000/api';

interface ApiRequestConfig extends RequestInit {
  secure?: boolean;
}

let refreshingPromise: Promise<{ accessToken: string }> | null = null;
let hasRedirectedToLogin = false;
let shuttingDown = false;

export function setAuthShuttingDown(flag: boolean) {
  shuttingDown = flag;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (flag) {
        window.sessionStorage.setItem('authShuttingDown', '1');
      } else {
        window.sessionStorage.removeItem('authShuttingDown');
      }
    }
  } catch {}
}

function clearClientSessionCookie() {
  try {
    if (typeof document !== 'undefined') {
      // Delete non-HttpOnly marker cookie
      document.cookie = 'has_session=; Max-Age=0; path=/';
    }
  } catch {}
}

async function refreshAccessToken(): Promise<{ accessToken: string }> {
  if (!refreshingPromise) {
    refreshingPromise = authService
      .refreshToken()
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
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
      const isBrowser = typeof window !== 'undefined';
      const isAuthPageGlobal =
        isBrowser && (window.location.pathname === '/login' || window.location.pathname === '/signup');

      // Never fire secure calls while on auth pages; abort early to avoid loops/noise
      if (secure && isAuthPageGlobal) {
        tokenService.clearAccessToken();
        clearClientSessionCookie();
        throw new Error('Session expired');
      }

      const method = (config.method || 'GET').toUpperCase();
      console.debug('[http] →', method, url, { secure });
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      // reuse isAuthPageGlobal computed above

      // Handle 401 by attempting token refresh (single-flight)
      if (response.status === 401 && secure && endpoint !== '/auth/refresh') {
        const isBrowser = typeof window !== 'undefined';
        const isAuthPage = isAuthPageGlobal;
        const isShuttingDown =
          shuttingDown ||
          (isBrowser && !!window.sessionStorage?.getItem('authShuttingDown'));
        const hasSessionCookie =
          typeof document !== 'undefined' &&
          document.cookie.split(';').some((c) => c.trim().startsWith('has_session=true'));

        // If we are on auth pages, in the middle of logout, or there is no session cookie, do not attempt refresh
        if (!isBrowser || isAuthPage || isShuttingDown || !hasSessionCookie) {
          tokenService.clearAccessToken();
          clearClientSessionCookie();
          if (isBrowser && !isAuthPage && !hasRedirectedToLogin) {
            hasRedirectedToLogin = true;
            window.location.href = '/login';
          }
          throw new Error('Session expired');
        }
        try {
          console.debug('Refreshing token');
          const refreshed = await refreshAccessToken();
          if (refreshed?.accessToken) {
            tokenService.setAccessToken(refreshed.accessToken);
            // Retry with new token
            return this.request<T>(endpoint, options);
          }
        } catch {
          console.debug('Refresh token failed, redirecting to login');
          tokenService.clearAccessToken();
          clearClientSessionCookie();
          if (!hasRedirectedToLogin && typeof window !== 'undefined') {
            hasRedirectedToLogin = true;
            window.location.href = '/login';
          }
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
        const isAuthRefresh = endpoint === '/auth/refresh';
        const isExpected401 = response.status === 401 && (isAuthRefresh || isAuthPageGlobal);
        const logFn = isExpected401 ? console.debug : console.error;
        logFn('[http] ←', response.status, method, url, {
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
