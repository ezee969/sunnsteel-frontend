import { LOCALES } from '@/i18n/config'

/**
 * SITE-01: the addresses the public site answers. They render without the
 * app's providers (Supabase, TanStack Query, framer-motion) and with only the
 * site's own messages: carried on every visit, those were most of the
 * landing's script and payload (Lighthouse, 2026-11-24). `/` is the landing
 * whenever it renders at all, because the middleware sends a signed-in
 * visitor to the dashboard and, before launch, everyone else to Login.
 *
 * The path may carry the language segment: a page prerendered at build time
 * sees `/en/features`, the browser `/features`, and both must agree.
 */
const SITE_SECTIONS = ['/features', '/use-cases', '/pricing'] as const

export function isSitePath(pathname: string | null | undefined): boolean {
	if (!pathname) return false
	const segments = pathname.split('/')
	const path = (LOCALES as readonly string[]).includes(segments[1] ?? '')
		? `/${segments.slice(2).join('/')}`
		: pathname
	const bare = path.length > 1 ? path.replace(/\/+$/, '') : path
	if (bare === '/' || bare === '') return true
	return SITE_SECTIONS.some(
		section => bare === section || bare.startsWith(`${section}/`),
	)
}
