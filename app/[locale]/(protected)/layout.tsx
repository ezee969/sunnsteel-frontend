import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { AppMessages } from '@/providers/app-messages'

import { ProtectedShell } from './protected-shell'

export default async function ProtectedLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<AppMessages locale={locale as Locale}>
			<ProtectedShell>{children}</ProtectedShell>
		</AppMessages>
	)
}
