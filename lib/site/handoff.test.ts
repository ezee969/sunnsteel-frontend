import { describe, expect, it } from 'vitest'

import { chosenStart } from '@/lib/onboarding/steps'

import {
	afterOnboardingPath,
	afterSignupPath,
	handoffQuery,
	NO_HANDOFF,
	parseHandoff,
	readStoredHandoff,
	serializeHandoff,
	signedInSignupTarget,
	SITE_HANDOFF_TTL_MS,
} from './handoff'

const params = (query: string) => new URLSearchParams(query)

describe('the landing hand-off (SITE-01 §12.8, §12.10)', () => {
	it('keeps only a template the app knows and only plan=pro', () => {
		expect(parseHandoff(params('template=upper-lower&plan=pro'))).toEqual({
			template: 'upper-lower',
			pro: true,
		})
		expect(parseHandoff(params('template=../dashboard&plan=gold'))).toEqual(
			NO_HANDOFF,
		)
		expect(parseHandoff(params(''))).toEqual(NO_HANDOFF)
	})

	it('comes back from sign-up to onboarding with the choice', () => {
		expect(afterSignupPath({ template: 'push-pull-legs', pro: false })).toBe(
			'/welcome?template=push-pull-legs',
		)
		expect(afterSignupPath({ template: null, pro: true })).toBe(
			'/welcome?plan=pro',
		)
		expect(afterSignupPath(NO_HANDOFF)).toBe('/dashboard')
		expect(handoffQuery({ template: 'upper-lower', pro: true })).toBe(
			'?template=upper-lower&plan=pro',
		)
	})

	it('keeps the choice on the device for a day, re-checked', () => {
		const now = 1_000_000_000
		const stored = serializeHandoff({ template: 'upper-lower', pro: true }, now)
		expect(readStoredHandoff(stored, now + 1000)).toEqual({
			template: 'upper-lower',
			pro: true,
		})
		expect(readStoredHandoff(stored, now + SITE_HANDOFF_TTL_MS + 1)).toEqual(
			NO_HANDOFF,
		)
		expect(
			readStoredHandoff(
				JSON.stringify({ template: 'x', pro: 1, at: now }),
				now,
			),
		).toEqual(NO_HANDOFF)
		expect(readStoredHandoff('not json', now)).toEqual(NO_HANDOFF)
		expect(readStoredHandoff(null, now)).toEqual(NO_HANDOFF)
	})

	it('sends a signed-in visitor where the landing link meant', () => {
		expect(signedInSignupTarget(params('template=upper-lower'))).toBe(
			'/routines/new?template=upper-lower',
		)
		expect(signedInSignupTarget(params('plan=pro'))).toBe('/plans')
		expect(signedInSignupTarget(params('template=upper-lower&plan=pro'))).toBe(
			'/routines/new?template=upper-lower',
		)
		expect(signedInSignupTarget(params('template=unknown'))).toBe('/dashboard')
	})

	it('ends onboarding on /plans for Pro', () => {
		expect(afterOnboardingPath({ template: null, pro: true })).toBe('/plans')
		expect(afterOnboardingPath(NO_HANDOFF)).toBe('/dashboard')
	})

	it('offers the picked template with the weekdays it can take', () => {
		expect(chosenStart('upper-lower', [1, 2, 4, 5], 4, false)).toEqual({
			kind: 'template',
			slug: 'upper-lower',
			weekdays: [1, 2, 4, 5],
		})
		expect(chosenStart('upper-lower', [1, 3, 5], 4, false)).toEqual({
			kind: 'template',
			slug: 'upper-lower',
			weekdays: null,
		})
		expect(chosenStart('push-pull-legs', [1, 3], 3, true)).toEqual({
			kind: 'template',
			slug: 'push-pull-legs',
			weekdays: [1, 3],
		})
	})
})
