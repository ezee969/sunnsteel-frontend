import type { BillingStatus } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { entitlementLimit, entitlementState } from './entitlements'

const free: BillingStatus = {
	plan: 'FREE',
	features: [],
	limits: {
		ROUTINE_VERSIONS: 3,
		GOALS: 3,
		TRAINING_LOCATIONS: 1,
		MUSCLE_HISTORY_WEEKS: 4,
	},
	grants: [],
}

describe('BILL-01 entitlements in the client', () => {
	it('knows nothing until the server answers', () => {
		expect(entitlementState(undefined, 'TRAINING_SIGNALS')).toEqual({
			allowed: null,
			plan: null,
		})
		expect(entitlementLimit(undefined, 'GOALS')).toBeUndefined()
	})

	it('reads access off the features the server answered, not the plan', () => {
		expect(entitlementState(free, 'TRAINING_SIGNALS')).toEqual({
			allowed: false,
			plan: 'FREE',
		})
		// A plan name alone never unlocks anything: only the answered features do.
		const proWithout = { ...free, plan: 'PRO' as const }
		expect(entitlementState(proWithout, 'TRAINING_SIGNALS').allowed).toBe(false)
		const pro = {
			...free,
			plan: 'PRO' as const,
			features: ['TRAINING_SIGNALS' as const],
		}
		expect(entitlementState(pro, 'TRAINING_SIGNALS')).toEqual({
			allowed: true,
			plan: 'PRO',
		})
	})

	it('answers a limit as the server sent it, null meaning none of its own', () => {
		expect(entitlementLimit(free, 'GOALS')).toBe(3)
		const pro = {
			...free,
			limits: { ...free.limits, TRAINING_LOCATIONS: null },
		}
		expect(entitlementLimit(pro, 'TRAINING_LOCATIONS')).toBeNull()
	})
})
