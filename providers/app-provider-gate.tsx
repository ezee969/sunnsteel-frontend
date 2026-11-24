'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { isSitePath } from '@/lib/site/site-paths'

/**
 * SITE-01: the app's providers (TanStack Query, the Supabase session,
 * toasts, framer-motion's MotionConfig) wrap every page but the public
 * site's, which uses none of them. They load as their own chunk, so a
 * visitor to the landing never downloads or runs Supabase's client and
 * the rest (about 360 KB of script before this, Lighthouse 2026-11-24).
 * Every app page still shares the one instance across its route groups, as
 * before; a server render of an app page preloads the chunk.
 */
const AppProvider = dynamic(() =>
	import('./app-provider').then(module => module.AppProvider),
)

export function AppProviderGate({ children }: { children: ReactNode }) {
	const pathname = usePathname()
	if (isSitePath(pathname)) return <>{children}</>
	return <AppProvider>{children}</AppProvider>
}
