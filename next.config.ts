import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

// Content-Security-Policy is intentionally not set here: the app relies on a
// service worker (generated into public/sw.js), a PWA manifest, Supabase (fetch + realtime
// websocket), and Google OAuth redirects, so a CSP needs to be authored
// against the exact set of origins and verified in a real browser before it
// can safely ship. The headers below are low-risk and don't require that.
const securityHeaders = [
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=()',
	},
	{
		key: 'Strict-Transport-Security',
		value: 'max-age=63072000; includeSubDomains; preload',
	},
]

const nextConfig: NextConfig = {
	// Client-side Router Cache lifetimes, in seconds. Next 15 defaults `dynamic`
	// to 0, so the five `ƒ` routes (/routines/[id], /routines/edit/[id],
	// /workouts/history/[id], /workouts/sessions/[id], /profile/[[...userId]])
	// refetch their RSC payload on every navigation. Those pages are 100%
	// 'use client', so the payload is a small shell — but it is still a round
	// trip, and it is the only navigation cost attributable to the framework.
	// Data freshness is unaffected: it comes from TanStack Query, not the RSC
	// payload. See TD-19.
	experimental: {
		staleTimes: {
			dynamic: 30,
			static: 180,
		},
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: securityHeaders,
			},
		]
	},
}

/**
 * TD-44: the service worker is built from worker/sw.ts with a precache
 * manifest generated from this build's own output, so there is no hand-kept
 * cache version. Registration stays ours (providers/pwa-provider.tsx) because
 * an update must wait out an active workout; the plugin neither registers nor
 * skips waiting. Beyond the build output, only what a home-screen launch needs
 * is precached, each revisioned by its own content; the backgrounds and the
 * 512px icons are not worth downloading on install.
 */
const fileRevision = (path: string) =>
	createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16)

const withSerwist = withSerwistInit({
	swSrc: 'worker/sw.ts',
	swDest: 'public/sw.js',
	register: false,
	reloadOnOnline: false,
	cacheOnNavigation: false,
	additionalPrecacheEntries: [
		{
			url: '/site.webmanifest',
			revision: fileRevision('public/site.webmanifest'),
		},
		{ url: '/icon-192.png', revision: fileRevision('public/icon-192.png') },
		// Served by the app router from app/favicon.ico, not from public/.
		{ url: '/favicon.ico', revision: fileRevision('app/favicon.ico') },
		{
			url: '/offline',
			// One revision per deployment, so each deploy refreshes the page.
			revision: process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID(),
		},
	],
})

// Development runs on Turbopack and never registers a worker (the provider
// clears one instead), so the webpack plugin is only applied to builds.
export default function config(phase: string): NextConfig {
	return phase === PHASE_DEVELOPMENT_SERVER
		? nextConfig
		: withSerwist(nextConfig)
}
