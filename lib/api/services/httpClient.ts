import { supabase } from '@/lib/supabase/client';

// Base API URL - use environment variable in production, localhost in development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiRequestConfig extends RequestInit {
  secure?: boolean
}

export const httpClient = {
  async request<T>(endpoint: string, options: ApiRequestConfig = {}): Promise<T> {
    const { secure = false, ...fetchOptions } = options
    const url = `${API_BASE_URL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    }

    if (secure) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session expired')
      }
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: 'include',
    }

    const method = (config.method || 'GET').toUpperCase()
    console.debug('[http] →', method, url, { secure })
    const response = await fetch(url, config)
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')
    const raw = await response.text()

    if (!response.ok) {
      let errorMessage = `Request failed with status: ${response.status}`
      try {
        const parsed = raw ? JSON.parse(raw) : undefined
        if (parsed && typeof parsed.message === 'string') {
          errorMessage = parsed.message
        }
      } catch {}
      console.error('[http] ←', response.status, method, url, {
        contentType,
        contentLength,
        rawPreview: raw?.slice(0, 200),
      })
      throw new Error(errorMessage)
    }

    if (response.status === 204 || !raw || raw.trim().length === 0) {
      console.debug('[http] ←', response.status, method, url, '(empty body)')
      return {} as T
    }

    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(raw) as T
        console.debug('[http] ←', response.status, method, url, '(json)')
        return data
      } catch {
        console.warn('[http] JSON parse failed despite content-type json', {
          url,
          status: response.status,
          rawPreview: raw.slice(0, 200),
        })
        return {} as T
      }
    }

    console.warn('[http] Non-JSON response; returning text', {
      url,
      status: response.status,
      contentType,
    })
    return raw as unknown as T
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

// Request variant that exposes status and headers without throwing on non-2xx
export async function requestWithMeta<T>(
  endpoint: string,
  options: ApiRequestConfig = {},
): Promise<{ data?: T; status: number; headers: Headers; ok: boolean }> {
  const { secure = false, ...fetchOptions } = options
  const url = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (secure) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { data: undefined, status: 401, headers: new Headers(), ok: false }
    }
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include',
  }

  const method = (config.method || 'GET').toUpperCase()
  console.debug('[http-meta] →', method, url, { secure })
  const response = await fetch(url, config)
  const contentType = response.headers.get('content-type') || ''
  const raw = await response.text()

  if (!response.ok) {
    // Return meta without throwing
    let parsed: T | undefined = undefined
    if (raw && contentType.includes('application/json')) {
      try { parsed = JSON.parse(raw) as T } catch {}
    }
    return {
      data: parsed,
      status: response.status,
      headers: response.headers,
      ok: false,
    }
  }

  if (response.status === 204 || !raw || raw.trim().length === 0) {
    return { data: undefined, status: response.status, headers: response.headers, ok: true }
  }

  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(raw) as T
      return { data, status: response.status, headers: response.headers, ok: true }
    } catch {}
  }

  return {
    data: (raw as unknown as T),
    status: response.status,
    headers: response.headers,
    ok: true,
  }
}
