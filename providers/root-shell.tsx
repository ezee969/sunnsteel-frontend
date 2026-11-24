import type { ReactNode } from 'react'

import DevInjections from '@/components/dev-injections'
import { SHOULD_SHOW_PERFORMANCE_PANEL } from '@/lib/config/env'

import { PwaProvider } from './pwa-provider'
import { ThemeProvider } from './theme-provider'

/**
 * SITE-01: what both roots wrap every page in -- the theme, the service
 * worker and the development panel. Imported only by the two client
 * boundaries, `AppRootProviders` and `SiteRootProviders`, never by a server
 * component: Next merges the client manifests of layouts that sit at the
 * same level once route groups are stripped (`(app)/layout`,
 * `(app)/(public)/layout`, `(site)/layout`...), so a client component both
 * roots rendered directly could be mapped to the app's chunks, and the
 * landing then downloaded the app's root (Supabase with it). Each root
 * referencing a boundary of its own keeps their chunks apart.
 */
export function RootShell({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<PwaProvider />
			{children}
			<DevInjections showPerfPanel={SHOULD_SHOW_PERFORMANCE_PANEL} />
		</ThemeProvider>
	)
}
