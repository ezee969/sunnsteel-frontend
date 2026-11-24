import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { AppMessages } from '@/providers/app-messages'

import { AuthShell } from './auth-shell'

export default async function AuthLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<AppMessages locale={locale as Locale}>
			<AuthShell>{children}</AuthShell>
		</AppMessages>
	)
}
