import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import { MESSAGES } from '@/messages'

import { LOCALE_COOKIE, resolveLocale } from './config'

// I18N-01: `next-intl` without locale routing. Every request resolves its
// language from the cookie (and, once enabled, the browser), which is why the
// root layout renders per request rather than at build time.
export default getRequestConfig(async () => {
	const locale = resolveLocale({
		cookie: (await cookies()).get(LOCALE_COOKIE)?.value,
		acceptLanguage: (await headers()).get('accept-language'),
	})
	return { locale, messages: MESSAGES[locale] }
})
