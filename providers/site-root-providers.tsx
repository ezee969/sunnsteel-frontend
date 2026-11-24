'use client'

import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import type { SiteMessages } from '@/messages'

import { IntlProvider } from './intl-provider'
import { RootShell } from './root-shell'

/**
 * SITE-01: the public site root's one client boundary (see root-shell.tsx
 * for why it is its own module): the shared shell and the site's messages,
 * and none of the app's providers.
 */
export function SiteRootProviders({
	locale,
	messages,
	children,
}: {
	locale: Locale
	messages: SiteMessages
	children: ReactNode
}) {
	return (
		<RootShell>
			<IntlProvider locale={locale} messages={messages}>
				{children}
			</IntlProvider>
		</RootShell>
	)
}
