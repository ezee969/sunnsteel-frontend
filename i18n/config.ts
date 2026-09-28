/**
 * I18N-01: the languages the product speaks and how a request picks one.
 *
 * There is no locale in the URL. The language is a preference of the person,
 * not of the address, so every existing link, share token, push destination
 * and old `#anchor` keeps working unchanged.
 */
export const LOCALES = ['en', 'es'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Mirrors the chosen language so a signed-out page and the first paint can use
 * it before any account is read. `I18N-02` writes it from the account's stored
 * choice; until then only a hand-set cookie selects Spanish.
 */
export const LOCALE_COOKIE = 'ss-locale'

/**
 * Whether a browser asking for Spanish gets it without choosing it. Off until
 * `I18N-03` to `I18N-05` have translated every page: a Spanish browser would
 * otherwise meet half an app in each language. Turn it on in the same change
 * that ships the last of them.
 */
export const DETECT_BROWSER_LOCALE = false

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && LOCALES.includes(value as Locale)
}

/** The first supported language in an `Accept-Language` header, by weight. */
export function localeFromAcceptLanguage(
	header: string | null | undefined,
): Locale | null {
	if (!header) return null
	const ranked = header
		.split(',')
		.map((part, index) => {
			const [tag, ...params] = part.trim().split(';')
			const q = params
				.map(param => param.trim())
				.find(param => param.startsWith('q='))
			const weight = q ? Number(q.slice(2)) : 1
			return {
				language: tag.trim().toLowerCase().split('-')[0],
				weight: Number.isFinite(weight) ? weight : 0,
				index,
			}
		})
		.filter(entry => entry.language && entry.weight > 0)
		.sort((a, b) => b.weight - a.weight || a.index - b.index)
	return (
		(ranked.find(entry => isLocale(entry.language))?.language as
			Locale | undefined) ?? null
	)
}

/**
 * The cookie wins, then (once enabled) the browser, then English. An unknown
 * cookie value is ignored rather than trusted.
 */
export function resolveLocale({
	cookie,
	acceptLanguage,
	detectBrowser = DETECT_BROWSER_LOCALE,
}: {
	cookie?: string | null
	acceptLanguage?: string | null
	detectBrowser?: boolean
}): Locale {
	if (isLocale(cookie)) return cookie
	if (detectBrowser) {
		const fromBrowser = localeFromAcceptLanguage(acceptLanguage)
		if (fromBrowser) return fromBrowser
	}
	return DEFAULT_LOCALE
}
