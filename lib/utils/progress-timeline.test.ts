import type { ProgressTimelinePersonalRecordItem } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	getRecordTimelineExplanation,
	getRecordTimelinePerformanceLabel,
} from './progress-timeline'

function item(
	reason: ProgressTimelinePersonalRecordItem['reason'],
	previous: ProgressTimelinePersonalRecordItem['previous'],
): ProgressTimelinePersonalRecordItem {
	return {
		eventId: 'event-1',
		type: 'PERSONAL_RECORD',
		occurredAt: '2026-09-13T10:00:00.000Z',
		session: {
			sessionId: 'session-1',
			routineName: 'Autumn Block',
			dayName: 'Thursday',
		},
		exerciseId: 'bench',
		exerciseName: 'Bench Press',
		current: { weightKg: 105, reps: 6, estimated1rmKg: 126 },
		previous,
		reason,
	}
}

describe('record timeline presentation', () => {
	it('keeps the first recorded frontier explicit', () => {
		expect(
			getRecordTimelineExplanation(item('FIRST_RECORDED_BEST', null), 'KG'),
		).toBe('This was the first recorded best set for this exercise.')
	})

	it('explains heavier load against the prior exact performance', () => {
		expect(
			getRecordTimelineExplanation(
				item('HEAVIER_LOAD', {
					weightKg: 100,
					reps: 5,
					estimated1rmKg: 116.7,
				}),
				'KG',
			),
		).toBe('The load moved beyond the previous best of 100 kg × 5.')
	})

	it('explains same-load rep gains and converts the displayed unit', () => {
		const record = item('MORE_REPS_AT_SAME_LOAD', {
			weightKg: 105,
			reps: 5,
			estimated1rmKg: 122.5,
		})
		expect(getRecordTimelineExplanation(record, 'LB')).toBe(
			'The same best load was completed for 1 more rep than before.',
		)
		expect(getRecordTimelinePerformanceLabel(record, 'LB')).toBe(
			'231.49 lb × 6',
		)
	})
})
