import type { BillingStatus } from '@sunsteel/contracts'
import { PLANS, PRO_PRICE } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	PRO_OFFER_AWAY_DAYS,
	PRO_OUTCOMES,
	readPutAwayAt,
	showsProOffer,
} from './pro-offer'

function status(
	over: Partial<BillingStatus> = {},
	checkout: Partial<BillingStatus['checkout']> = {},
): BillingStatus {
	return {
		plan: 'FREE',
		features: [],
		limits: {
			ROUTINE_VERSIONS: 3,
			GOALS: 3,
			TRAINING_LOCATIONS: 1,
			MUSCLE_HISTORY_WEEKS: 4,
			ROUTINE_DRAFTS_PER_MONTH: 0,
		},
		grants: [],
		subscription: null,
		...over,
		checkout: {
			available: true,
			trialDays: 7,
			testMode: false,
			price: PRO_PRICE,
			pending: null,
			...checkout,
		},
	}
}

const NOW = new Date('2026-11-19T12:00:00.000Z')
const daysAgo = (days: number) =>
	new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)

describe('showsProOffer (BILL-05)', () => {
	it('offers Pro to an account on Free that can buy it', () => {
		expect(showsProOffer(status(), null, NOW)).toBe(true)
	})

	it('still offers it while a checkout waits, to lead back to it', () => {
		const pending = {
			id: 'a',
			planId: 'PRO' as const,
			status: 'PENDING' as const,
			checkoutUrl: 'https://mp.test/pay',
			createdAt: NOW.toISOString(),
			expiresAt: NOW.toISOString(),
		}
		expect(showsProOffer(status({}, { pending }), null, NOW)).toBe(true)
	})

	it('never offers it to an account on Pro, however it holds it', () => {
		expect(showsProOffer(status({ plan: 'PRO' }), null, NOW)).toBe(false)
	})

	it('offers nothing when Pro cannot be bought', () => {
		expect(showsProOffer(status({}, { available: false }), null, NOW)).toBe(
			false,
		)
	})

	it(`stays away for ${PRO_OFFER_AWAY_DAYS} days once put away, then returns`, () => {
		expect(showsProOffer(status(), daysAgo(0), NOW)).toBe(false)
		expect(showsProOffer(status(), daysAgo(29.9), NOW)).toBe(false)
		expect(showsProOffer(status(), daysAgo(30), NOW)).toBe(true)
		expect(showsProOffer(status(), daysAgo(45), NOW)).toBe(true)
	})

	it('is not kept away longer by a moment after now', () => {
		expect(showsProOffer(status(), daysAgo(-3), NOW)).toBe(true)
	})
})

describe('readPutAwayAt', () => {
	it('reads a stored moment and ignores anything else', () => {
		expect(readPutAwayAt('2026-11-01T00:00:00.000Z')?.toISOString()).toBe(
			'2026-11-01T00:00:00.000Z',
		)
		expect(readPutAwayAt(null)).toBeNull()
		expect(readPutAwayAt('')).toBeNull()
		expect(readPutAwayAt('soon')).toBeNull()
	})
})

describe('PRO_OUTCOMES', () => {
	it('names only capabilities Pro has and Free does not', () => {
		for (const outcome of PRO_OUTCOMES) {
			for (const feature of outcome.features) {
				expect(PLANS.PRO.features).toContain(feature)
				expect(PLANS.FREE.features).not.toContain(feature)
			}
		}
	})
})
