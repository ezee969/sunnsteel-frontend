import type { SessionRecapRecord } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	formatRecapDurationDelta,
	formatRecapRecordValue,
	formatRecapSetsDelta,
	formatRecapWeightDelta,
} from './session-recap'

const record: SessionRecapRecord = {
	kind: 'WEIGHT',
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
	value: 100,
	previousBest: 95,
	setNumber: 1,
	achievedAt: '2026-09-09T10:00:00.000Z',
}

describe('session recap presentation', () => {
	it('formats weight records in the account preference', () => {
		expect(formatRecapRecordValue(record, 'KG')).toBe('100 kg')
		expect(formatRecapRecordValue(record, 'LB')).toBe('220.5 lb')
		expect(
			formatRecapRecordValue({ ...record, kind: 'REPS', value: 12 }, 'KG'),
		).toBe('12 reps')
	})

	it('formats signed comparison deltas without implying direction', () => {
		expect(formatRecapDurationDelta(75)).toBe('+1m 15s')
		expect(formatRecapDurationDelta(-60)).toBe('−1m')
		expect(formatRecapDurationDelta(0)).toBe('No change')
		expect(formatRecapWeightDelta(10, 'LB')).toBe('+22 lb')
		expect(formatRecapWeightDelta(-5, 'KG')).toBe('−5 kg')
		expect(formatRecapSetsDelta(1)).toBe('+1 set')
		expect(formatRecapSetsDelta(-2)).toBe('−2 sets')
		expect(formatRecapSetsDelta(0)).toBe('No change')
	})
})
