import { isLocale, type Locale, LOCALE_COOKIE } from './config'

/** A year: the choice is the person's, not the visit's. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/**
 * I18N-02: the cookie the middleware reads, written from the account's stored
 * language. `null` clears it, so the next request follows the browser
 * (`DETECT_BROWSER_LOCALE`) instead of a stale choice.
 */
export function localeCookieValue(locale: Locale | null): string {
	return locale
		? `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`
		: `${LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function writeLocaleCookie(locale: Locale | null): void {
	document.cookie = localeCookieValue(locale)
}

export function readLocaleCookie(): Locale | null {
	const entry = document.cookie
		.split(';')
		.map(part => part.trim())
		.find(part => part.startsWith(`${LOCALE_COOKIE}=`))
	const value = entry?.slice(LOCALE_COOKIE.length + 1)
	return isLocale(value) ? value : null
}
