import type { SessionRecapRecord } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	formatRecapDurationDelta,
	formatRecapRecordValue,
	formatRecapSetsDelta,
	formatRecapWeightDelta,
	recapRecordLabel,
} from './session-recap'

const en = translatorFor('en', 'workout.recap')
const es = translatorFor('es', 'workout.recap')

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
		expect(formatRecapRecordValue(record, 'KG', en)).toBe('100 kg')
		expect(formatRecapRecordValue(record, 'LB', en)).toBe('220.5 lb')
		expect(
			formatRecapRecordValue({ ...record, kind: 'REPS', value: 12 }, 'KG', en),
		).toBe('12 reps')
	})

	it('formats signed comparison deltas without implying direction', () => {
		expect(formatRecapDurationDelta(75, en)).toBe('+1m 15s')
		expect(formatRecapDurationDelta(-60, en)).toBe('−1m')
		expect(formatRecapDurationDelta(0, en)).toBe('No change')
		expect(formatRecapWeightDelta(10, 'LB', en)).toBe('+22 lb')
		expect(formatRecapWeightDelta(-5, 'KG', en)).toBe('−5 kg')
		expect(formatRecapSetsDelta(1, en)).toBe('+1 set')
		expect(formatRecapSetsDelta(-2, en)).toBe('−2 sets')
		expect(formatRecapSetsDelta(0, en)).toBe('No change')
	})

	it('says the same in Spanish, singular and plural (I18N-04)', () => {
		expect(formatRecapRecordValue({ ...record, kind: 'REPS' }, 'KG', es)).toBe(
			'100 repeticiones',
		)
		expect(
			formatRecapRecordValue({ ...record, kind: 'REPS', value: 1 }, 'KG', es),
		).toBe('1 repetición')
		expect(formatRecapDurationDelta(0, es)).toBe('Sin cambios')
		expect(formatRecapSetsDelta(1, es)).toBe('+1 serie')
		expect(formatRecapSetsDelta(-2, es)).toBe('−2 series')
		expect(recapRecordLabel('WEIGHT', es)).toBe('Récord de peso')
	})
})
