/**
 * SITE-01: who sees the landing at `/`. A signed-in visitor always goes to the
 * dashboard. A signed-out one sees the landing once `SITE_LANDING=on` is set
 * (the launch), and until then only with the preview cookie, which
 * `/?site-preview=1` sets and `/?site-preview=0` clears; everyone else still
 * goes to Login, as before the site existed.
 */
export const SITE_PREVIEW_COOKIE = 'ss-site-preview'
export const SITE_PREVIEW_PARAM = 'site-preview'

export function siteLandingLive(
	env: Record<string, string | undefined> = process.env,
): boolean {
	return env.SITE_LANDING === 'on'
}

export type RootDecision =
	| { kind: 'dashboard' }
	| { kind: 'login' }
	| { kind: 'landing' }
	| { kind: 'preview'; on: boolean }

export function rootDecision({
	signedIn,
	live,
	previewCookie,
	previewParam,
}: {
	signedIn: boolean
	live: boolean
	previewCookie: string | undefined
	previewParam: string | null
}): RootDecision {
	if (previewParam === '1' || previewParam === '0') {
		return { kind: 'preview', on: previewParam === '1' }
	}
	if (signedIn) return { kind: 'dashboard' }
	if (live || previewCookie === '1') return { kind: 'landing' }
	return { kind: 'login' }
}
