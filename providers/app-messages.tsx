import { getMessages, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { clientMessages, type Messages } from '@/messages'

import { IntlProvider } from './intl-provider'

/**
 * SITE-01: the app's messages, every area but the public pages', for one
 * route group (`(auth)`, `(public)`, `(protected)`). The root layout hands
 * the browser only `core`, so the public site's payload no longer carries
 * the app's whole vocabulary; each app group puts it back here, under the
 * root's provider, which this one replaces for everything inside it.
 */
export async function AppMessages({
	locale,
	children,
}: {
	locale: Locale
	children: ReactNode
}) {
	setRequestLocale(locale)
	const messages = (await getMessages({ locale })) as Messages
	return (
		<IntlProvider locale={locale} messages={clientMessages(messages)}>
			{children}
		</IntlProvider>
	)
}
