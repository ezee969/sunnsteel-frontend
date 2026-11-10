import type {
	BillingStatus,
	CheckoutAttemptSummary,
	SubscriptionSummary,
} from '@sunsteel/contracts'
import { PRO_PRICE } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	canCancelSubscription,
	checkoutOfferState,
	checkoutReturn,
	formatPlanPrice,
	proUntilIfCancelled,
	showsTestMode,
	subscriptionState,
} from './checkout'

const attempt = (over: Partial<CheckoutAttemptSummary> = {}) =>
	({
		id: 'a',
		planId: 'PRO',
		status: 'PENDING',
		checkoutUrl: 'https://mp.test/pay',
		createdAt: '2026-11-01T12:00:00.000Z',
		expiresAt: '2026-11-01T13:00:00.000Z',
		...over,
	}) satisfies CheckoutAttemptSummary

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
			trialDays: null,
			testMode: true,
			price: PRO_PRICE,
			pending: null,
			...checkout,
		},
	}
}

describe('checkoutOfferState', () => {
	it('offers nothing to a member already on Pro, however it was granted', () => {
		expect(checkoutOfferState(status({ plan: 'PRO' }))).toEqual({ kind: 'pro' })
	})

	it('says Pro cannot be bought without a provider', () => {
		expect(checkoutOfferState(status({}, { available: false }))).toEqual({
			kind: 'unavailable',
		})
	})

	it('offers the price, and sends a waiting attempt back to its page', () => {
		expect(checkoutOfferState(status())).toEqual({
			kind: 'buy',
			price: PRO_PRICE,
		})
		expect(checkoutOfferState(status({}, { pending: attempt() }))).toEqual({
			kind: 'resume',
			price: PRO_PRICE,
			checkoutUrl: 'https://mp.test/pay',
		})
	})
})

describe('checkoutReturn', () => {
	it('reads Pro as started only from a completed attempt', () => {
		expect(checkoutReturn({ status: 'COMPLETED' })).toBe('CONFIRMED')
		expect(checkoutReturn({ status: 'PENDING' })).toBe('WAITING')
		expect(checkoutReturn({ status: 'CANCELED' })).toBe('CANCELED')
		expect(checkoutReturn({ status: 'FAILED' })).toBe('CLOSED')
		expect(checkoutReturn({ status: 'EXPIRED' })).toBe('CLOSED')
	})
})

describe('showsTestMode', () => {
	it('says so wherever checkout is offered or a sandbox subscription is held', () => {
		expect(showsTestMode(status())).toBe(true)
		expect(
			showsTestMode(
				status(
					{
						subscription: {
							planId: 'PRO',
							status: 'ACTIVE',
							currentPeriodEnd: null,
							createdAt: '2026-11-01T12:00:00.000Z',
							trialEndsAt: null,
							graceEndsAt: null,
							cancelAtPeriodEnd: false,
						},
					},
					{ available: false },
				),
			),
		).toBe(true)
	})

	it('stays quiet where nothing can be bought', () => {
		expect(showsTestMode(status({}, { available: false }))).toBe(false)
		expect(showsTestMode(status({}, { testMode: false }))).toBe(false)
	})
})

describe('formatPlanPrice', () => {
	it('writes pesos without cents in each language', () => {
		expect(formatPlanPrice(PRO_PRICE, 'es')).toBe('4999 ARS')
		expect(formatPlanPrice(PRO_PRICE, 'en')).toBe('ARS 4,999')
	})
})

describe('the subscription in Settings (BILL-04)', () => {
	const sub = (
		over: Partial<SubscriptionSummary> = {},
	): SubscriptionSummary => ({
		planId: 'PRO',
		status: 'ACTIVE',
		currentPeriodEnd: '2026-12-01T12:00:00.000Z',
		createdAt: '2026-11-01T12:00:00.000Z',
		trialEndsAt: null,
		graceEndsAt: null,
		cancelAtPeriodEnd: false,
		...over,
	})

	it('says each state with the date the server gave', () => {
		expect(subscriptionState(null)).toBeNull()
		expect(
			subscriptionState(
				sub({ status: 'TRIALING', trialEndsAt: '2026-11-08T12:00:00.000Z' }),
			),
		).toEqual({ kind: 'TRIALING', until: '2026-11-08T12:00:00.000Z' })
		expect(subscriptionState(sub())).toEqual({
			kind: 'ACTIVE',
			renews: '2026-12-01T12:00:00.000Z',
		})
		expect(
			subscriptionState(
				sub({ status: 'PAST_DUE', graceEndsAt: '2026-11-15T12:00:00.000Z' }),
			),
		).toEqual({ kind: 'PAST_DUE', until: '2026-11-15T12:00:00.000Z' })
		expect(
			subscriptionState(sub({ status: 'CANCELED', cancelAtPeriodEnd: true })),
		).toEqual({ kind: 'CANCELED', until: '2026-12-01T12:00:00.000Z' })
	})

	it('offers Cancel only while something would renew', () => {
		expect(canCancelSubscription(null)).toBe(false)
		expect(canCancelSubscription(sub({ status: 'TRIALING' }))).toBe(true)
		expect(canCancelSubscription(sub())).toBe(true)
		expect(canCancelSubscription(sub({ status: 'PAST_DUE' }))).toBe(true)
		expect(
			canCancelSubscription(
				sub({ status: 'CANCELED', cancelAtPeriodEnd: true }),
			),
		).toBe(false)
	})

	it('names the last day of Pro a cancellation would keep', () => {
		expect(proUntilIfCancelled(sub())).toBe('2026-12-01T12:00:00.000Z')
		expect(
			proUntilIfCancelled(
				sub({ status: 'PAST_DUE', graceEndsAt: '2026-11-15T12:00:00.000Z' }),
			),
		).toBe('2026-11-15T12:00:00.000Z')
		expect(
			proUntilIfCancelled(
				sub({ status: 'TRIALING', trialEndsAt: '2026-11-08T12:00:00.000Z' }),
			),
		).toBe('2026-11-08T12:00:00.000Z')
	})
})
