import type { ApiErrorParams } from '@sunsteel/contracts'

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
	/**
	 * I18N-06: the refusal's stable code and the values its sentence names,
	 * when the server sent them, so the client can say it in the member's
	 * language. `message` stays the server's English.
	 */
	readonly code?: string
	readonly params?: ApiErrorParams

	constructor(
		message: string,
		status: number,
		code?: string,
		params?: ApiErrorParams,
	) {
		super(message)
		this.name = 'HttpError'
		this.status = status
		this.code = code
		this.params = params
	}
}

/** The code and params of an error body, when it carries them. */
export function errorBodyDetails(body: unknown): {
	message?: string
	code?: string
	params?: ApiErrorParams
} {
	if (!body || typeof body !== 'object') return {}
	const { message, code, params } = body as Record<string, unknown>
	return {
		message: typeof message === 'string' ? message : undefined,
		code: typeof code === 'string' ? code : undefined,
		params:
			params && typeof params === 'object'
				? (params as ApiErrorParams)
				: undefined,
	}
}
