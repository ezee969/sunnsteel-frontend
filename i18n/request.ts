import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { MESSAGES } from '@/messages'

import { DEFAULT_LOCALE, LOCALES } from './config'

// I18N-01: the language comes from the `[locale]` segment the middleware
// rewrote to, never from cookies or headers here, so every page can still be
// built once per language and served statically.
export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale
	const locale = hasLocale(LOCALES, requested) ? requested : DEFAULT_LOCALE
	return { locale, messages: MESSAGES[locale] }
})
