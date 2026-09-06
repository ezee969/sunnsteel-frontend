export const DEFAULT_AUTH_REDIRECT = '/dashboard'

const REDIRECT_BASE_URL = 'https://sunnsteel.invalid'
const AUTH_ENTRY_PATHS = ['/login', '/signup', '/auth/callback'] as const
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i

/**
 * Accept only an app-relative path that cannot be interpreted as another
 * origin. Auth entry routes are also rejected to prevent redirect loops.
 */
export function sanitizeInternalRedirect(
	value: string | null | undefined,
): string {
	if (
		!value ||
		value !== value.trim() ||
		!value.startsWith('/') ||
		value.startsWith('//') ||
		value.includes('\\') ||
		ENCODED_PATH_SEPARATOR.test(value)
	) {
		return DEFAULT_AUTH_REDIRECT
	}

	try {
		const url = new URL(value, REDIRECT_BASE_URL)

		if (url.origin !== REDIRECT_BASE_URL) {
			return DEFAULT_AUTH_REDIRECT
		}

		const pointsBackToAuth = AUTH_ENTRY_PATHS.some(
			path => url.pathname === path || url.pathname.startsWith(`${path}/`),
		)

		if (pointsBackToAuth) {
			return DEFAULT_AUTH_REDIRECT
		}

		return `${url.pathname}${url.search}${url.hash}`
	} catch {
		return DEFAULT_AUTH_REDIRECT
	}
}
