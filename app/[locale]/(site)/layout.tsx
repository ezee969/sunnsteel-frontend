import { getMessages, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { type Messages, siteMessages } from '@/messages'
import { IntlProvider } from '@/providers/intl-provider'

/**
 * SITE-01: the public site hands the browser only the messages its client
 * components read (`siteMessages`), never the app's whole vocabulary, and
 * renders without the app's providers (`AppProviderGate`).
 */
export default async function SiteLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const locale = (await params).locale as Locale
	setRequestLocale(locale)
	const messages = (await getMessages({ locale })) as Messages
	return (
		<IntlProvider locale={locale} messages={siteMessages(messages)}>
			{children}
		</IntlProvider>
	)
}
