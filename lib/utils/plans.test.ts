import { FEATURE_KEYS, PLAN_LIMIT_KEYS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { currentPlan, PLAN_ROWS } from './plans'

const base = {
	features: [],
	limits: {
		ROUTINE_VERSIONS: 3,
		GOALS: 3,
		TRAINING_LOCATIONS: 1,
		MUSCLE_HISTORY_WEEKS: 4,
	},
}
const grant = (id: string, expiresAt: string | null) => ({
	id,
	planId: 'PRO' as const,
	source: 'PROMO' as const,
	startsAt: '2026-10-01T00:00:00.000Z',
	expiresAt,
	note: null,
})

describe('BILL-02 plans', () => {
	it('lists every built capability and every limit of the Pro split once', () => {
		const features = PLAN_ROWS.flatMap(row =>
			'feature' in row ? [row.feature] : [],
		)
		const limits = PLAN_ROWS.flatMap(row => ('limit' in row ? [row.limit] : []))
		// The INTEL-03/INTEL-04 drafts and reviews are not built yet, so they are
		// not offered; muscle weeks are the MUSCLE_HISTORY_LONG row.
		expect(new Set(features)).toEqual(
			new Set(
				FEATURE_KEYS.filter(
					key => key !== 'ROUTINE_DRAFTS' && key !== 'TRAINING_REVIEW',
				),
			),
		)
		expect(new Set(limits)).toEqual(
			new Set(PLAN_LIMIT_KEYS.filter(key => key !== 'MUSCLE_HISTORY_WEEKS')),
		)
	})

	it('words every row in both languages, each column where it has its own words', () => {
		for (const locale of ['en', 'es'] as const) {
			const t = translatorFor(locale, 'billing.plans.rows')
			for (const row of PLAN_ROWS) {
				expect(t(`${row.key}.name` as 'strength.name')).not.toBe('')
				if (row.worded) {
					expect(t(`${row.key}.free` as 'strength.free')).not.toBe('')
					expect(t(`${row.key}.pro` as 'strength.pro')).not.toBe('')
				}
			}
		}
	})

	it('reads Free, Pro with no end, and Pro until the longest grant ends', () => {
		expect(currentPlan({ ...base, plan: 'FREE', grants: [] })).toEqual({
			kind: 'FREE',
		})
		expect(
			currentPlan({
				...base,
				plan: 'PRO',
				grants: [grant('a', null), grant('b', '2026-12-01T00:00:00.000Z')],
			}),
		).toEqual({ kind: 'PRO', until: null })
		expect(
			currentPlan({
				...base,
				plan: 'PRO',
				grants: [grant('b', '2026-12-01T00:00:00.000Z')],
			}),
		).toEqual({ kind: 'PRO', until: '2026-12-01T00:00:00.000Z' })
	})
})
