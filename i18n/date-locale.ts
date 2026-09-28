import type { Locale as DateFnsLocale } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

import type { Locale } from './config'

/**
 * I18N-01: the one place a language becomes a `date-fns` locale. Every
 * `format(date, pattern)` that prints a word -- a weekday, a month -- passes
 * `{ locale: dateFnsLocale(locale) }`, read from `useLocale()` in a component.
 * The calls still printing English move here with their area (I18N-03 to
 * I18N-05). Numbers and plain dates use `useFormatter()` from `next-intl`.
 */
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, es }

export function dateFnsLocale(locale: Locale): DateFnsLocale {
	return DATE_FNS_LOCALES[locale]
}

/**
 * The BCP 47 tag `Intl` formats a language with. English keeps `en-US`, which
 * every existing `toLocale*` call and test already assumed, so English output
 * does not move; Spanish is `es`, with a decimal comma.
 */
const INTL_LOCALES: Record<Locale, string> = { en: 'en-US', es: 'es' }

export function intlLocale(locale: Locale): string {
	return INTL_LOCALES[locale]
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>()

/**
 * A cached `Intl.DateTimeFormat` for a language. Use it where a module used to
 * build one formatter at load time in `en-US` or `undefined` (the device's
 * language, which was never the product's).
 */
export function dateFormatter(
	locale: Locale,
	options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
	const key = `${locale}|${JSON.stringify(options)}`
	let formatter = dateFormatters.get(key)
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(intlLocale(locale), options)
		dateFormatters.set(key, formatter)
	}
	return formatter
}
