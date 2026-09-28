import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import {
	config,
	localePrefixOf,
	middleware,
	PROTECTED_PREFIXES,
} from './middleware'

/**
 * TD-45 and I18N-01. The matcher used to list every protected prefix by hand,
 * and a prefix left out of it was silently unguarded -- four times. Since the
 * middleware also rewrites every page into its language, the matcher is one
 * pattern for every page address; these tests hold it to reaching every
 * protected prefix and to skipping everything that is not a page.
 */
// Next reads the matcher as a path-to-regexp pattern; this one is a plain
// regular expression inside it, so it can be tested as one.
const pattern = new RegExp(`^${(config.matcher as string[])[0]}$`)
const runs = (path: string) => pattern.test(path)

const request = (path: string, cookies: Record<string, string> = {}) => {
	const req = new NextRequest(new URL(path, 'https://sunnsteel.test'))
	for (const [name, value] of Object.entries(cookies))
		req.cookies.set(name, value)
	return req
}

describe('the middleware matcher', () => {
	it('runs for each protected prefix and its sub-pages', () => {
		const missing = PROTECTED_PREFIXES.filter(
			prefix => !runs(prefix) || !runs(`${prefix}/some/page`),
		)
		expect(missing).toEqual([])
	})

	it('runs for the auth pages, the public pages and the root', () => {
		for (const path of [
			'/',
			'/login',
			'/signup',
			'/offline',
			'/members/some_user-1',
			'/shared/sessions/AbC-123_xyz',
		])
			expect({ path, runs: runs(path) }).toEqual({ path, runs: true })
	})

	it('skips route handlers, Next files and static files', () => {
		for (const path of [
			'/api/session',
			'/_next/static/chunk.js',
			'/favicon.ico',
			'/sw.js',
			'/site.webmanifest',
			'/icon-192.png',
		])
			expect({ path, runs: runs(path) }).toEqual({ path, runs: false })
	})
})

describe('the middleware', () => {
	it('rewrites a page into its language build, English by default', () => {
		const res = middleware(request('/login?x=1'))
		return res.then(r =>
			expect(r.headers.get('x-middleware-rewrite')).toBe(
				'https://sunnsteel.test/en/login?x=1',
			),
		)
	})

	it('follows the language cookie', async () => {
		const res = await middleware(request('/login', { 'ss-locale': 'es' }))
		expect(res.headers.get('x-middleware-rewrite')).toBe(
			'https://sunnsteel.test/es/login',
		)
	})

	it('sends the root to the dashboard or to Login by the session marker', async () => {
		const out = await middleware(request('/'))
		expect(out.headers.get('location')).toBe('https://sunnsteel.test/login')
		const signedIn = await middleware(request('/', { ss_session: '1' }))
		expect(signedIn.headers.get('location')).toBe(
			'https://sunnsteel.test/dashboard',
		)
	})

	it('still guards a protected page before choosing a language', async () => {
		const res = await middleware(request('/progress/load?range=30'))
		expect(res.headers.get('location')).toBe(
			'https://sunnsteel.test/login?redirectTo=%2Fprogress%2Fload%3Frange%3D30',
		)
		const signedIn = await middleware(
			request('/progress/load', { ss_session: '1', 'ss-locale': 'es' }),
		)
		expect(signedIn.headers.get('x-middleware-rewrite')).toBe(
			'https://sunnsteel.test/es/progress/load',
		)
	})

	it('sends a signed-in visitor from the auth pages to the dashboard', async () => {
		const res = await middleware(request('/login', { ss_session: '1' }))
		expect(res.headers.get('location')).toBe('https://sunnsteel.test/dashboard')
	})

	it('drops a language typed into the address', async () => {
		expect(localePrefixOf('/es/dashboard')).toBe('es')
		expect(localePrefixOf('/esquema')).toBeNull()
		const res = await middleware(request('/es/dashboard?a=1'))
		expect(res.headers.get('location')).toBe(
			'https://sunnsteel.test/dashboard?a=1',
		)
		const root = await middleware(request('/en'))
		expect(root.headers.get('location')).toBe('https://sunnsteel.test/')
	})
})
