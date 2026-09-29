import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	personalRecordSummary,
	recentActivitySummary,
	trainingInsightsSummary,
	upcomingMilestonesSummary,
} from './dashboard-summaries'

const en = translatorFor('en', 'planning.dashboardSummaries')
const es = translatorFor('es', 'planning.dashboardSummaries')

describe('closed dashboard section summaries (UX-02)', () => {
	it('names the latest workout and when', () => {
		expect(
			recentActivitySummary(
				{ routineName: 'Upper / Lower', dayName: 'Lower A' },
				'5 days ago',
				en,
			),
		).toBe('Latest: Upper / Lower — Lower A, 5 days ago')
		expect(recentActivitySummary(undefined, undefined, en)).toBeNull()
	})

	it('names the latest record with its set', () => {
		expect(
			personalRecordSummary({ exerciseName: 'Squat' }, '95 kg × 7', en),
		).toBe('Latest: Squat 95 kg × 7')
		expect(
			personalRecordSummary({ exerciseName: 'Squat' }, undefined, en),
		).toBe('Latest: Squat')
		expect(personalRecordSummary(undefined, '95 kg × 7', en)).toBeNull()
	})

	it('counts the insights, never restating one as a conclusion', () => {
		expect(trainingInsightsSummary([{ key: 'a' }], en)).toBe(
			'1 fact from your recent training',
		)
		expect(
			trainingInsightsSummary([{ key: 'a' }, { key: 'b' }, { key: 'c' }], en),
		).toBe('3 facts from your recent training')
		expect(trainingInsightsSummary([], en)).toBeNull()
	})

	it('names the next milestone and how many follow', () => {
		expect(
			upcomingMilestonesSummary(
				[
					{ title: 'Maestro' },
					{ title: '50 Sessions' },
					{ title: '25 Records' },
				],
				en,
			),
		).toBe('Next: Maestro, and 2 more')
		expect(upcomingMilestonesSummary([{ title: 'Maestro' }], en)).toBe(
			'Next: Maestro',
		)
		expect(upcomingMilestonesSummary([], en)).toBeNull()
	})
})

describe('the closed-section summaries in Spanish (I18N-04)', () => {
	it('agrees the count with its noun', () => {
		expect(trainingInsightsSummary([{ key: 'a' }], es)).toBe(
			'1 dato de tu entrenamiento reciente',
		)
		expect(trainingInsightsSummary([{ key: 'a' }, { key: 'b' }], es)).toBe(
			'2 datos de tu entrenamiento reciente',
		)
		expect(upcomingMilestonesSummary([{ title: 'Maestro' }], es)).toBe(
			'Próximo: Maestro',
		)
	})
})
