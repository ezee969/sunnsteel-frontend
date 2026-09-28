import { type NextRequest, NextResponse } from 'next/server'

import { isLocale, LOCALE_COOKIE, resolveLocale } from '@/i18n/config'

export const PROTECTED_PREFIXES = [
	'/dashboard',
	'/workouts',
	'/routines',
	'/profile',
	'/progress',
	'/exercises',
	'/schedule',
	'/achievements',
	'/notifications',
	'/settings',
	'/search',
	'/activity',
	'/moderation',
] as const

const AUTH_PAGES = new Set(['/login', '/signup'])

function isProtectedPath(pathname: string) {
	return PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

/** The locale an address names in its first segment, if any. */
export function localePrefixOf(pathname: string) {
	const first = pathname.split('/')[1]
	return isLocale(first) ? first : null
}

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname

	// I18N-01: the language is never part of the address. A `/es/...` link
	// typed or pasted by hand goes to the same page without the prefix, where
	// the cookie decides; the rewrite below is the only way into `[locale]`.
	const prefix = localePrefixOf(path)
	if (prefix) {
		const url = request.nextUrl.clone()
		url.pathname = path.slice(prefix.length + 1) || '/'
		return NextResponse.redirect(url)
	}

	const hasValidSession = request.cookies.get('ss_session')?.value === '1'

	if (isProtectedPath(path) && !hasValidSession) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('redirectTo', `${path}${request.nextUrl.search}`)
		return NextResponse.redirect(loginUrl)
	}

	if (AUTH_PAGES.has(path) && hasValidSession) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	// The root has no page of its own. It used to redirect from a Server
	// Component reading this cookie, which a static `[locale]` build cannot do
	// per request, so the decision is made here instead.
	if (path === '/') {
		return NextResponse.redirect(
			new URL(hasValidSession ? '/dashboard' : '/login', request.url),
		)
	}

	const locale = resolveLocale({
		cookie: request.cookies.get(LOCALE_COOKIE)?.value,
		acceptLanguage: request.headers.get('accept-language'),
	})
	const url = request.nextUrl.clone()
	url.pathname = `/${locale}${path}`
	return NextResponse.rewrite(url)
}

/**
 * I18N-01: every page is rewritten into its `[locale]` build, so the
 * middleware runs for every page address. It skips the route handlers under
 * `/api`, Next's own files and anything with a file extension (icons, the
 * manifest, `sw.js`), none of which is a page -- no username, id or share
 * token contains a dot.
 *
 * That also closed TD-45 for good: a protected prefix can no longer be left out
 * of the matcher, because the matcher no longer lists prefixes.
 * `middleware.test.ts` asserts it still reaches every one of them.
 */
export const config = {
	matcher: ['/((?!api/|_next/|_vercel/|.*\\.[^/]+$).*)'],
}
