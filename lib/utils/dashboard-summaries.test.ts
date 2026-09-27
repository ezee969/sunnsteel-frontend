import { describe, expect, it } from 'vitest'

import {
	personalRecordSummary,
	recentActivitySummary,
	trainingInsightsSummary,
	upcomingMilestonesSummary,
} from './dashboard-summaries'

describe('closed dashboard section summaries (UX-02)', () => {
	it('names the latest workout and when', () => {
		expect(
			recentActivitySummary(
				{ routineName: 'Upper / Lower', dayName: 'Lower A' },
				'5 days ago',
			),
		).toBe('Latest: Upper / Lower — Lower A, 5 days ago')
		expect(recentActivitySummary(undefined, undefined)).toBeNull()
	})

	it('names the latest record with its set', () => {
		expect(personalRecordSummary({ exerciseName: 'Squat' }, '95 kg × 7')).toBe(
			'Latest: Squat 95 kg × 7',
		)
		expect(personalRecordSummary({ exerciseName: 'Squat' }, undefined)).toBe(
			'Latest: Squat',
		)
		expect(personalRecordSummary(undefined, '95 kg × 7')).toBeNull()
	})

	it('counts the insights, never restating one as a conclusion', () => {
		expect(trainingInsightsSummary([{ key: 'a' }])).toBe(
			'1 fact from your recent training',
		)
		expect(
			trainingInsightsSummary([{ key: 'a' }, { key: 'b' }, { key: 'c' }]),
		).toBe('3 facts from your recent training')
		expect(trainingInsightsSummary([])).toBeNull()
	})

	it('names the next milestone and how many follow', () => {
		expect(
			upcomingMilestonesSummary([
				{ title: 'Maestro' },
				{ title: '50 Sessions' },
				{ title: '25 Records' },
			]),
		).toBe('Next: Maestro, and 2 more')
		expect(upcomingMilestonesSummary([{ title: 'Maestro' }])).toBe(
			'Next: Maestro',
		)
		expect(upcomingMilestonesSummary([])).toBeNull()
	})
})
