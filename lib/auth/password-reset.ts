import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'

/**
 * FIX-11 password reset. The emailed recovery link returns through the same
 * `/auth/callback` route email confirmation and Google sign-in already use, so
 * it needs no new Supabase redirect entry; the callback then forwards the
 * signed-in recovery session to the page that sets the new password.
 */

export const FORGOT_PASSWORD_PATH = '/forgot-password'
export const RESET_PASSWORD_PATH = '/reset-password'
/** Query flag `/forgot-password` reads to explain an unusable link. */
export const EXPIRED_LINK_QUERY = 'link=expired'

export const buildPasswordResetRedirect = (siteUrl: string): string =>
	`${siteUrl}/auth/callback?callbackUrl=${encodeURIComponent(RESET_PASSWORD_PATH)}`

/** True when an auth callback was started by a password-reset email. */
export const isPasswordRecoveryCallback = (
	callbackUrl: string | null | undefined,
): boolean =>
	sanitizeInternalRedirect(callbackUrl).split(/[?#]/)[0] === RESET_PASSWORD_PATH

/**
 * Where the callback sends someone who arrives without a session. An expired
 * or already-used recovery link lands back on the request form with an
 * explanation instead of an unexplained Login page.
 */
export const callbackWithoutSessionRedirect = (
	callbackUrl: string | null | undefined,
): string =>
	isPasswordRecoveryCallback(callbackUrl)
		? `${FORGOT_PASSWORD_PATH}?${EXPIRED_LINK_QUERY}`
		: '/login?error=no_session'
