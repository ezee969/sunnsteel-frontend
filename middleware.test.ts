import { describe, expect, it } from 'vitest'

import { config, PROTECTED_PREFIXES } from './middleware'

/**
 * TD-45. `PROTECTED_PREFIXES` decides what the middleware guards; `config.matcher`
 * decides whether Next.js runs the middleware at all. They are edited
 * independently and nothing compared them, so a prefix could be added to the
 * first and forgotten in the second — which happened four times before this
 * test existed: `/schedule` and `/notifications` originally, `/activity` with
 * `SOC-03`, and `/moderation` with `TRUST-04`.
 *
 * The failure is quiet, which is why it kept happening. Nothing errors; the
 * route simply stops being guarded, the signed-out visitor renders the empty
 * protected shell, and the client redirect that follows carries no
 * `redirectTo`, so they land on the dashboard instead of the page they asked
 * for.
 */
describe('the middleware matcher covers every protected prefix', () => {
	const matcher = config.matcher as string[]

	it('runs the middleware for each protected prefix', () => {
		const missing = PROTECTED_PREFIXES.filter(
			prefix => !matcher.includes(`${prefix}/:path*`),
		)
		expect(missing).toEqual([])
	})

	it('names the auth pages, which the middleware redirects away from', () => {
		expect(matcher).toContain('/login')
		expect(matcher).toContain('/signup')
	})

	it('adds no protected matcher entry without a prefix behind it', () => {
		// The other direction: a matcher entry for a route nothing protects pays
		// a middleware invocation to fall through, which is what TD-16 removed
		// for `/auth/:path*`.
		const orphans = matcher
			.filter(entry => entry.endsWith('/:path*'))
			.map(entry => entry.slice(0, -'/:path*'.length))
			.filter(prefix => !PROTECTED_PREFIXES.includes(prefix as never))
		expect(orphans).toEqual([])
	})
})
