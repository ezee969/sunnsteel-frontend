import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { PUBLIC_ENV } from '@/lib/config/env'

const API_BASE_URL = PUBLIC_ENV.API_URL

interface ApiRequestConfig extends RequestInit {
	secure?: boolean
}

/**
 * Error carrying the HTTP status, so callers can branch on it.
 *
 * This exists because `query-provider.tsx` decides whether to retry by reading
 * `error.status`: throwing a bare `Error` made that check silently unreachable
 * and every 4xx got retried 3 times with backoff. Extends `Error`, so existing
 * `instanceof Error` / `.message` handling is unaffected. See TD-23.
 */
export class HttpError extends Error {
	readonly status: number

	constructor(message: string, status: number) {
		super(message)
		this.name = 'HttpError'
		this.status = status
	}
}

function buildBaseHeaders(fetchOptions: RequestInit): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		...(fetchOptions.headers as Record<string, string>),
	}
}

/**
 * Attaches a Supabase bearer token to `headers` in place. Returns false
 * (without mutating `headers`) when there is no active session, letting
 * callers decide how to handle an expired/missing session.
 */
async function attachAuthHeader(headers: Record<string, string>): Promise<boolean> {
	const {
		data: { session },
	} = await supabase.auth.getSession()

	if (!session?.access_token) {
		return false
	}

	headers.Authorization = `Bearer ${session.access_token}`
	return true
}

function prepareRequest(endpoint: string, fetchOptions: RequestInit, headers: Record<string, string>) {
	const url = `${API_BASE_URL}${endpoint}`
	const config: RequestInit = { ...fetchOptions, headers, credentials: 'include' }
	const method = (config.method || 'GET').toUpperCase()
	return { url, config, method }
}

async function readResponseBody(response: Response): Promise<{ raw: string; contentType: string }> {
	const contentType = response.headers.get('content-type') || ''
	const raw = await response.text()
	return { raw, contentType }
}

export const httpClient = {
	async request<T>(endpoint: string, options: ApiRequestConfig = {}): Promise<T> {
		const { secure = false, ...fetchOptions } = options
		const headers = buildBaseHeaders(fetchOptions)

		if (secure && !(await attachAuthHeader(headers))) {
			// 401-equivalent: there is no token to send, so retrying cannot help.
			throw new HttpError('Session expired', 401)
		}

		const { url, config, method } = prepareRequest(endpoint, fetchOptions, headers)
		logger.debug('[http] ->', method, url, { secure })

		const response = await fetch(url, config)
		const { raw, contentType } = await readResponseBody(response)

		if (!response.ok) {
			let errorMessage = `Request failed with status: ${response.status}`

			try {
				const parsed = raw ? JSON.parse(raw) : undefined
				if (parsed && typeof parsed.message === 'string') {
					errorMessage = parsed.message
				}
			} catch {}

			logger.error('[http] <-', response.status, method, url, {
				contentType,
				contentLength: response.headers.get('content-length'),
				rawPreview: raw?.slice(0, 200),
			})
			throw new HttpError(errorMessage, response.status)
		}

		if (response.status === 204 || !raw || raw.trim().length === 0) {
			logger.debug('[http] <-', response.status, method, url, '(empty body)')
			return {} as T
		}

		if (contentType.includes('application/json')) {
			try {
				const data = JSON.parse(raw) as T
				logger.debug('[http] <-', response.status, method, url, '(json)')
				return data
			} catch {
				logger.warn('[http] JSON parse failed despite content-type json', {
					url,
					status: response.status,
					rawPreview: raw.slice(0, 200),
				})
				return {} as T
			}
		}

		logger.warn('[http] Non-JSON response; returning text', {
			url,
			status: response.status,
			contentType,
		})
		return raw as unknown as T
	},

	get<T>(endpoint: string, secure = false): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET', secure })
	},

	post<T, D = unknown>(endpoint: string, data?: D, secure = false): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
			secure,
		})
	},

	patch<T, D = unknown>(endpoint: string, data?: D, secure = false): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined,
			secure,
		})
	},

	delete<T>(endpoint: string, secure = false): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'DELETE',
			secure,
		})
	},
}

export async function requestWithMeta<T>(
	endpoint: string,
	options: ApiRequestConfig = {},
): Promise<{ data?: T; status: number; headers: Headers; ok: boolean }> {
	const { secure = false, ...fetchOptions } = options
	const headers = buildBaseHeaders(fetchOptions)

	if (secure && !(await attachAuthHeader(headers))) {
		return { data: undefined, status: 401, headers: new Headers(), ok: false }
	}

	const { url, config, method } = prepareRequest(endpoint, fetchOptions, headers)
	logger.debug('[http-meta] ->', method, url, { secure })

	const response = await fetch(url, config)
	const { raw, contentType } = await readResponseBody(response)

	if (!response.ok) {
		let parsed: T | undefined

		if (raw && contentType.includes('application/json')) {
			try {
				parsed = JSON.parse(raw) as T
			} catch {}
		}

		return {
			data: parsed,
			status: response.status,
			headers: response.headers,
			ok: false,
		}
	}

	if (response.status === 204 || !raw || raw.trim().length === 0) {
		return {
			data: undefined,
			status: response.status,
			headers: response.headers,
			ok: true,
		}
	}

	if (contentType.includes('application/json')) {
		try {
			const data = JSON.parse(raw) as T
			return { data, status: response.status, headers: response.headers, ok: true }
		} catch {}
	}

	return {
		data: raw as unknown as T,
		status: response.status,
		headers: response.headers,
		ok: true,
	}
}
