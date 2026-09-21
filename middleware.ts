import { type NextRequest, NextResponse } from 'next/server'

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

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname
	const hasValidSession = request.cookies.get('ss_session')?.value === '1'

	if (isProtectedPath(path) && !hasValidSession) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('redirectTo', `${path}${request.nextUrl.search}`)
		return NextResponse.redirect(loginUrl)
	}

	if (AUTH_PAGES.has(path) && hasValidSession) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	return NextResponse.next()
}

/**
 * Next.js only runs this file for paths the matcher names, so a prefix that is
 * in `PROTECTED_PREFIXES` but missing here is **not protected by middleware at
 * all**: the signed-out visitor loads the protected shell, renders an empty
 * page, and is redirected by the client with no `redirectTo`, so signing in
 * drops them on the dashboard instead of where they asked to go.
 *
 * That drifted four times (TD-45) — `/schedule` and `/notifications` were
 * missed, then `/activity` with `SOC-03` and `/moderation` with `TRUST-04` —
 * because the two lists are edited independently and nothing compared them.
 * `middleware.test.ts` now does, so the next one fails a test rather than
 * shipping.
 *
 * The matcher cannot be derived from `PROTECTED_PREFIXES` at runtime: Next.js
 * statically analyses this array at build time and rejects a computed value.
 * It has to stay literal, which is exactly why it needs the test.
 */
export const config = {
	matcher: [
		'/login',
		'/signup',
		// '/auth/:path*' used to be here. The function does nothing with those
		// paths (they are in neither PROTECTED_PREFIXES nor AUTH_PAGES), so every
		// visit to /auth/callback paid a middleware invocation to fall through to
		// NextResponse.next(). Removed in TD-16.
		'/dashboard/:path*',
		'/workouts/:path*',
		'/routines/:path*',
		'/profile/:path*',
		'/progress/:path*',
		'/exercises/:path*',
		'/schedule/:path*',
		'/achievements/:path*',
		'/notifications/:path*',
		'/settings/:path*',
		'/search/:path*',
		'/activity/:path*',
		'/moderation/:path*',
	],
}
