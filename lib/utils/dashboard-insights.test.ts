import type {
	ExercisePlateau,
	PlateausResponse,
	VolumeTrendResponse,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildDashboardInsights,
	describeDashboardInsightSources,
} from './dashboard-insights'

const formatWeek = (weekStart: string) => weekStart
const formatDate = (iso: string) => iso.slice(0, 10)

const volume: VolumeTrendResponse = {
	timeZone: 'Europe/Berlin',
	weeks: 4,
	overall: [
		{
			weekStart: '2026-08-24',
			isCurrentWeek: false,
			volumeKg: 300,
			completedSets: 18,
		},
		{
			weekStart: '2026-08-31',
			isCurrentWeek: false,
			volumeKg: 400,
			completedSets: 24,
		},
		{
			weekStart: '2026-09-07',
			isCurrentWeek: true,
			volumeKg: 50,
			completedSets: 3,
		},
	],
	muscles: [],
	routines: [],
	exercises: [],
}

const plateau = (
	overrides: Partial<ExercisePlateau> & { exerciseId: string },
): ExercisePlateau => ({
	exerciseName: 'Bench Press',
	best: {
		weightKg: 100,
		reps: 5,
		estimated1rmKg: 112.5,
		achievedAt: '2026-07-06T10:00:00.000Z',
	},
	countedSince: '2026-07-06T10:00:00.000Z',
	sessionsWithoutNewBest: 5,
	closest: {
		weightKg: 95,
		reps: 5,
		estimated1rmKg: 106.9,
		performedAt: '2026-08-31T10:00:00.000Z',
	},
	closestRatio: 0.95,
	lastPerformedAt: '2026-08-31T10:00:00.000Z',
	...overrides,
})

const plateaus = (list: ExercisePlateau[]): PlateausResponse => ({
	asOf: '2026-09-07T10:00:00.000Z',
	thresholds: {
		windowDays: 84,
		minSessions: 4,
		minDaysSinceBest: 21,
		recentDays: 21,
	},
	checkedExercises: 6,
	plateaus: list,
})

const sources = {
	weightUnit: 'KG' as const,
	formatWeek,
	formatDate,
}

describe('dashboard insights (DASH-07)', () => {
	it('keeps a fixed order and never ranks the facts', () => {
		const insights = buildDashboardInsights({
			...sources,
			volume,
			plateaus: plateaus([
				plateau({ exerciseId: 'squat', exerciseName: 'Squat' }),
				plateau({
					exerciseId: 'row',
					exerciseName: 'Barbell Row',
					sessionsWithoutNewBest: 4,
					closestRatio: 0.99,
				}),
			]),
		})

		expect(insights.map(item => item.key)).toEqual([
			'WEEK_OVER_WEEK',
			'CLOSEST_TO_BEST',
			'LONGEST_PLATEAU',
		])
	})

	it('compares the last two finished weeks and ignores the partial one', () => {
		const [week] = buildDashboardInsights({ ...sources, volume })

		expect(week).toEqual({
			key: 'WEEK_OVER_WEEK',
			label: 'Week over week',
			subject: 'Last two finished weeks',
			href: '/progress',
			statement: 'Completed sets went from 18 to 24.',
			evidence: '2026-08-24: 18 sets · 300 kg → 2026-08-31: 24 sets · 400 kg',
		})
	})

	it('says a week held rather than inventing a change', () => {
		const flat = {
			...volume,
			overall: volume.overall.map(point =>
				point.isCurrentWeek ? point : { ...point, completedSets: 18 },
			),
		}

		expect(
			buildDashboardInsights({ ...sources, volume: flat })[0]?.statement,
		).toBe('Completed sets held at 18.')
	})

	it('needs two finished weeks before it compares anything', () => {
		const single = {
			...volume,
			overall: volume.overall.filter(point => point.weekStart !== '2026-08-24'),
		}

		expect(buildDashboardInsights({ ...sources, volume: single })).toEqual([])
	})

	it('states the plateau count, its start and the numbers behind it', () => {
		const [longest] = buildDashboardInsights({
			...sources,
			plateaus: plateaus([
				plateau({ exerciseId: 'squat', exerciseName: 'Squat' }),
			]),
		})

		expect(longest).toEqual({
			key: 'LONGEST_PLATEAU',
			label: 'Longest without a new best',
			subject: 'Squat',
			href: '/exercises/squat',
			statement: 'No new best in 5 sessions since your best on 2026-07-06.',
			evidence:
				'Best 100 kg × 5 · est. 1RM 112.5 kg — closest since 95 kg × 5, 95% of your best estimate',
		})
	})

	it('never gives one lift two rows', () => {
		const insights = buildDashboardInsights({
			...sources,
			plateaus: plateaus([
				plateau({ exerciseId: 'squat', exerciseName: 'Squat' }),
			]),
		})

		expect(insights).toHaveLength(1)
		expect(insights[0]?.evidence).toContain('95% of your best estimate')
	})

	it('separates the closest lift from the longest-running one', () => {
		const insights = buildDashboardInsights({
			...sources,
			plateaus: plateaus([
				plateau({ exerciseId: 'squat', exerciseName: 'Squat' }),
				plateau({
					exerciseId: 'row',
					exerciseName: 'Barbell Row',
					closestRatio: 1,
				}),
			]),
		})

		expect(insights[0]).toMatchObject({
			key: 'CLOSEST_TO_BEST',
			subject: 'Barbell Row',
			statement: 'Best set since: matched your best estimate.',
		})
		expect(insights[1]).toMatchObject({
			key: 'LONGEST_PLATEAU',
			subject: 'Squat',
		})
		expect(insights[1]?.evidence).not.toContain('your best estimate')
	})

	it('converts every load to the account unit', () => {
		const [week] = buildDashboardInsights({
			...sources,
			weightUnit: 'LB',
			volume,
		})

		expect(week?.evidence).toContain('lb')
		expect(week?.evidence).not.toContain('kg')
	})

	it('has nothing to state without either source', () => {
		expect(buildDashboardInsights(sources)).toEqual([])
		expect(
			buildDashboardInsights({ ...sources, plateaus: plateaus([]) }),
		).toEqual([])
	})
})

describe('dashboard insight sources', () => {
	it('names the scope so no row reads as a wider claim', () => {
		expect(describeDashboardInsightSources(plateaus([]))).toBe(
			'From your finished training weeks and the lifts your plateau watch follows at 4 sessions without a new best. These are your numbers, not a diagnosis.',
		)
	})
})
