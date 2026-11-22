import { type NextRequest, NextResponse } from 'next/server'

import { isLocale, LOCALE_COOKIE, resolveLocale } from '@/i18n/config'
import { signedInSignupTarget } from '@/lib/site/handoff'
import {
	rootDecision,
	SITE_PREVIEW_COOKIE,
	SITE_PREVIEW_PARAM,
	siteLandingLive,
} from '@/lib/site/landing'

/** next-intl's own request header for the locale (`HEADER_LOCALE_NAME`). */
export const LOCALE_HEADER = 'X-NEXT-INTL-LOCALE'

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
	'/welcome',
	'/messages',
	'/plans',
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
		// SITE-01: a landing link to sign-up (`?template=`, `?plan=pro`) goes
		// where it meant for someone already signed in.
		const target =
			path === '/signup'
				? signedInSignupTarget(request.nextUrl.searchParams)
				: '/dashboard'
		return NextResponse.redirect(new URL(target, request.url))
	}

	// The root is decided here, by the marker, because a static `[locale]` build
	// cannot read a cookie per request. SITE-01: a signed-out visitor sees the
	// landing once it is live, or with the preview cookie; everyone else signed
	// out still goes to Login (`lib/site/landing.ts`).
	if (path === '/') {
		const decision = rootDecision({
			signedIn: hasValidSession,
			live: siteLandingLive(),
			previewCookie: request.cookies.get(SITE_PREVIEW_COOKIE)?.value,
			previewParam: request.nextUrl.searchParams.get(SITE_PREVIEW_PARAM),
		})
		if (decision.kind === 'preview') {
			// Everything but the preview switch survives, so a phone opening
			// `/?site-preview=1&install=1` keeps its install helper.
			const target = request.nextUrl.clone()
			target.searchParams.delete(SITE_PREVIEW_PARAM)
			const response = NextResponse.redirect(target)
			if (decision.on) {
				response.cookies.set(SITE_PREVIEW_COOKIE, '1', {
					path: '/',
					maxAge: 60 * 60 * 24 * 30,
					sameSite: 'lax',
				})
			} else {
				response.cookies.delete(SITE_PREVIEW_COOKIE)
			}
			return response
		}
		if (decision.kind !== 'landing') {
			return NextResponse.redirect(
				new URL(
					decision.kind === 'dashboard' ? '/dashboard' : '/login',
					request.url,
				),
			)
		}
	}

	const locale = resolveLocale({
		cookie: request.cookies.get(LOCALE_COOKIE)?.value,
		acceptLanguage: request.headers.get('accept-language'),
	})
	const url = request.nextUrl.clone()
	url.pathname = `/${locale}${path}`
	// next-intl reads the language of a dynamically rendered page from this
	// header, which its own middleware would set; without it every signed-in
	// page rendered its messages in English under `lang="es"`. The static
	// pages never needed it, because the build calls `setRequestLocale`.
	const headers = new Headers(request.headers)
	headers.set(LOCALE_HEADER, locale)
	return NextResponse.rewrite(url, { request: { headers } })
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
