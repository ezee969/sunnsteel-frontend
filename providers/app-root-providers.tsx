'use client'

import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import type { RootMessages } from '@/messages'

import { AppProvider } from './app-provider'
import { IntlProvider } from './intl-provider'
import { RootShell } from './root-shell'

/**
 * The app root's one client boundary (see root-shell.tsx for why it is its
 * own module): the shared shell, the `core` messages each route group adds
 * to, and the app's providers.
 */
export function AppRootProviders({
	locale,
	messages,
	children,
}: {
	locale: Locale
	messages: RootMessages
	children: ReactNode
}) {
	return (
		<RootShell>
			<IntlProvider locale={locale} messages={messages}>
				<AppProvider>{children}</AppProvider>
			</IntlProvider>
		</RootShell>
	)
}
