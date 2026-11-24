'use client'

import { IntlErrorCode, NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import type { ClientMessages, RootMessages, SiteMessages } from '@/messages'

/**
 * I18N-01: the client half of the translations. Every page here is a client
 * component, so this is where `useTranslations` reads from.
 *
 * No `timeZone` is set on purpose: dates in this app are the device's local
 * calendar, which the server cannot know, so formatting uses the browser's own
 * zone and the environment-fallback warning is expected rather than a fault.
 * The messages are passed from the server layout for the one language in use,
 * never imported here, so the client bundle does not carry every language;
 * `messages.test.ts` is what keeps a key from going missing. Since SITE-01
 * the root gives `core` only and each route group nests its own provider
 * with the areas it reads (`AppMessages`, the site's layout).
 */
export function IntlProvider({
	locale,
	messages,
	children,
}: {
	locale: Locale
	messages: ClientMessages | RootMessages | SiteMessages
	children: ReactNode
}) {
	return (
		<NextIntlClientProvider
			locale={locale}
			messages={messages}
			onError={error => {
				if (error.code === IntlErrorCode.ENVIRONMENT_FALLBACK) return
				if (process.env.NODE_ENV !== 'production') console.error(error)
			}}
		>
			{children}
		</NextIntlClientProvider>
	)
}
