import type { EarnedPersonalRecord } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { buildPersonalRecordCelebration } from './personal-record-celebration'

const record = (
	kind: EarnedPersonalRecord['kind'],
	value: number,
): EarnedPersonalRecord => ({
	kind,
	value,
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
})

describe('personal record celebration copy', () => {
	it('does not create a notification without earned records', () => {
		expect(buildPersonalRecordCelebration([], 'KG')).toBeNull()
	})

	it('describes one rep record without a weight unit', () => {
		expect(buildPersonalRecordCelebration([record('REPS', 12)], 'LB')).toEqual({
			title: 'New rep record',
			description: 'Bench Press · Reps 12',
		})
	})

	it('groups all earned kinds and converts canonical weight values', () => {
		const records = [
			record('WEIGHT', 100),
			record('REPS', 8),
			record('VOLUME', 800),
			record('ESTIMATED_1RM', 126.7),
		]

		expect(buildPersonalRecordCelebration(records, 'LB')).toEqual({
			title: '4 new personal records',
			description:
				'Bench Press · Weight 220.46 lb · Reps 8 · Volume 1763.7 lb · Est. 1RM 279.33 lb',
		})
	})
})
