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
