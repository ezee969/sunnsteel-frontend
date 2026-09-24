import type {
	BlockComparisonPeriod,
	TrainingBlockComparisonResponse,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	BLOCK_COMPARISON_ACTION,
	comparisonRows,
	describeChange,
	describeComparisonScope,
	describeLift,
	describeNoLifts,
	describeWeeklyChange,
	periodName,
} from './training-block-comparison'

const period = (
	overrides: Partial<BlockComparisonPeriod> = {},
): BlockComparisonPeriod => ({
	kind: 'TRAINING_BLOCK',
	name: 'Autumn',
	seriesId: 'autumn',
	startDate: '2026-09-01',
	endDate: '2026-09-28',
	days: 28,
	plannedWorkouts: 16,
	workouts: 14,
	endedEarly: 1,
	deloads: 0,
	completedSets: 280,
	volumeKg: 42000,
	perWeek: { workouts: 3.5, completedSets: 70, volumeKg: 10500 },
	repTargets: { shortSets: 28, targetedSets: 280, shortPercent: 10 },
	...overrides,
})

const comparison = (
	overrides: Partial<TrainingBlockComparisonResponse> = {},
): TrainingBlockComparisonResponse => ({
	routineId: 'r',
	today: '2026-10-05',
	isRunning: false,
	truncated: false,
	current: period(),
	previous: period({
		name: 'Summer',
		seriesId: 'summer',
		startDate: '2026-07-01',
		endDate: '2026-08-11',
		days: 42,
		plannedWorkouts: 24,
		workouts: 18,
		endedEarly: 0,
		deloads: 1,
		completedSets: 360,
		volumeKg: 54000,
		perWeek: { workouts: 3, completedSets: 60, volumeKg: 9000 },
		repTargets: { shortSets: 54, targetedSets: 360, shortPercent: 15 },
	}),
	effort: {
		comparison: {
			recent: { averageRpe: 8.1, sets: 200 },
			previous: { averageRpe: 7.6, sets: 250 },
			difference: 0.5,
			lifts: 6,
		},
		recentSets: 200,
		previousSets: 250,
		marked: true,
	},
	lifts: [
		{
			exerciseId: 'bench',
			exerciseName: 'Bench Press',
			current: { estimated1rmKg: 122.5, weightKg: 105, reps: 5 },
			previous: { estimated1rmKg: 116.7, weightKg: 100, reps: 5 },
			changeKg: 5.8,
			changePercent: 5,
		},
	],
	...overrides,
})

describe('training-block comparison copy', () => {
	it('names the two periods and says they are side by side, not ranked', () => {
		expect(describeComparisonScope(comparison())).toBe(
			"Autumn (28 days) beside Summer (42 days). Only this routine's workouts count. The numbers are side by side, not ranked.",
		)
		expect(
			describeComparisonScope(
				comparison({
					isRunning: true,
					truncated: true,
					current: period({ days: 10 }),
					previous: period({ kind: 'BEFORE_BLOCK', name: null, days: 10 }),
				}),
			),
		).toBe(
			"Autumn so far (10 days) beside the same number of days of the routine before it. Only this routine's workouts count. The numbers are side by side, not ranked. A period longer than a year is compared on its latest 365 days.",
		)
		expect(periodName(period({ name: null, days: 21 }))).toBe(
			'The 21 days before',
		)
	})

	it('states changes as numbers with a direction, never a verdict', () => {
		expect(describeChange(0.5)).toBe('up 0.5')
		expect(describeChange(-2)).toBe('down 2')
		expect(describeChange(0.04)).toBe('no change')
		expect(describeChange(4.25, '%')).toBe('up 4.3%')
		expect(describeWeeklyChange(0.5)).toBe('up 0.5 a week')
		expect(describeWeeklyChange(0)).toBe('no change')
	})

	it('lays out every measure for both periods, per week where lengths differ', () => {
		const rows = comparisonRows(comparison(), 'KG')
		expect(rows.map(row => row.label)).toEqual([
			'Workouts',
			'Completed sets',
			'External load',
			'Average RPE',
			'Sets short of their rep target',
		])
		expect(rows[0]).toEqual({
			label: 'Workouts',
			previous: '18 of 24 planned (1 on a deload)',
			current: '14 of 16 planned (1 ended early)',
			change: 'up 0.5 a week',
		})
		expect(rows[1].change).toBe('up 10 a week')
		expect(rows[2].current).toMatch(/^42,?000 kg \(10,?500 kg a week\)$/)
		expect(rows[2].change).toMatch(/^up 1,?500 kg a week$/)
		expect(rows[3]).toEqual({
			label: 'Average RPE',
			previous: '7.6 over 250 sets',
			current: '8.1 over 200 sets',
			change: 'up 0.5, on the 6 lifts rated in both',
		})
		expect(rows[4].change).toBe('down 5 points')
	})

	it('says what is missing rather than inventing a number', () => {
		const rows = comparisonRows(
			comparison({
				current: period({
					plannedWorkouts: null,
					repTargets: { shortSets: 0, targetedSets: 0, shortPercent: 0 },
				}),
				effort: {
					comparison: null,
					recentSets: 3,
					previousSets: 0,
					marked: false,
				},
			}),
			'KG',
		)
		expect(rows[0].current).toBe('14 workouts (1 ended early)')
		expect(rows[3].change).toBe(
			'Comparing needs at least 10 RPE sets of the same lifts in each period.',
		)
		expect(rows[4].current).toBe('No sets with a rep target')
		expect(rows[4].change).toBeNull()
		expect(describeNoLifts()).toBe(
			'No lift with a loaded set was trained in both periods.',
		)
	})

	it('states a lift in the viewer unit', () => {
		const [lift] = comparison().lifts
		expect(describeLift(lift, 'KG')).toBe(
			'Best estimated 1RM 116.7 kg → 122.5 kg, up 5%',
		)
		expect(describeLift(lift, 'LB')).toMatch(/^Best estimated 1RM 257\.3 lb →/)
	})

	it('never ranks the periods or names a cause', () => {
		const copy = [
			BLOCK_COMPARISON_ACTION,
			describeComparisonScope(comparison()),
			...comparisonRows(comparison(), 'KG').flatMap(row => [
				row.label,
				row.previous,
				row.current,
				row.change ?? '',
			]),
			describeLift(comparison().lifts[0], 'KG'),
			describeNoLifts(),
		].join(' ')
		expect(copy).not.toMatch(
			/better|worse|improv|declin|fatigue|recover|overtrain|should|\bneed\b|because|best block|winner/i,
		)
	})
})
