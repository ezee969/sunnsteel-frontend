import type { TrainingSignalsResponse } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeDecline,
	describeEffort,
	describeNoDeclines,
	describeRepTargets,
	describeSignalsIntro,
	describeSignalsRule,
	describeWorkouts,
	TRAINING_SIGNAL_MARKED_LABEL,
	TRAINING_SIGNAL_TITLES,
	TRAINING_SIGNALS_TITLE,
} from './training-signals'

const thresholds: TrainingSignalsResponse['thresholds'] = {
	periodDays: 14,
	minRpeSets: 10,
	rpeRise: 0.5,
	minTargetSets: 10,
	shortPointsRise: 10,
	minShortSets: 3,
	declineSessions: 3,
	minDecline: 0.025,
	workoutDrop: 2,
}

const lift = {
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
	declineRatio: 0.051,
	sessions: [
		{
			sessionId: 'a',
			performedAt: '2026-09-10',
			estimated1rmKg: 116.7,
			weightKg: 100,
			reps: 5,
		},
		{
			sessionId: 'b',
			performedAt: '2026-09-14',
			estimated1rmKg: 113.8,
			weightKg: 97.5,
			reps: 5,
		},
		{
			sessionId: 'c',
			performedAt: '2026-09-18',
			estimated1rmKg: 110.8,
			weightKg: 95,
			reps: 5,
		},
	],
}

const signals = (
	overrides: Partial<TrainingSignalsResponse> = {},
): TrainingSignalsResponse => ({
	asOf: '2026-09-24T12:00:00.000Z',
	periods: {
		recent: {
			from: '2026-09-10T12:00:00.000Z',
			to: '2026-09-24T12:00:00.000Z',
		},
		previous: {
			from: '2026-08-27T12:00:00.000Z',
			to: '2026-09-10T12:00:00.000Z',
		},
	},
	thresholds,
	effort: {
		comparison: {
			recent: { averageRpe: 8.4, sets: 22 },
			previous: { averageRpe: 7.8, sets: 25 },
			difference: 0.6,
			lifts: 3,
		},
		recentSets: 22,
		previousSets: 25,
		marked: true,
	},
	repTargets: {
		recent: { shortSets: 6, targetedSets: 40, shortPercent: 15 },
		previous: { shortSets: 2, targetedSets: 38, shortPercent: 5 },
		comparable: true,
		mostOften: [
			{ exerciseId: 'squat', exerciseName: 'Squat', shortSets: 3 },
			{ exerciseId: 'bench', exerciseName: 'Bench Press', shortSets: 2 },
		],
		marked: true,
	},
	declines: { checkedLifts: 4, lifts: [lift], marked: true },
	workouts: {
		recent: { workouts: 5, endedEarly: 1, deloads: 1 },
		previous: { workouts: 8, endedEarly: 0, deloads: 0 },
		marked: true,
	},
	...overrides,
})

const shortDate = (iso: string) =>
	new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(iso))

describe('training signal copy', () => {
	it('states the windows and says it does not explain why', () => {
		expect(describeSignalsIntro(thresholds)).toBe(
			'Four measures from your logged workouts, the last 14 days beside the 14 days before. They state what changed, not why.',
		)
	})

	it('prints every threshold that marks a signal', () => {
		expect(describeSignalsRule(thresholds)).toBe(
			"A measure is marked when average RPE rises 0.5 or more, the share of sets short of their rep target rises 10 points (at least 3 sets), a lift's best estimated 1RM falls in each of its last two sessions by 2.5% in total, or you trained at least 2 fewer times or ended more workouts early. Deload workouts count only as workouts.",
		)
	})

	it('states the effort comparison with sets, change and lifts counted', () => {
		expect(describeEffort(signals())).toBe(
			'Average RPE 8.4 over 22 sets in the last 14 days, 7.8 over 25 sets in the 14 days before, up 0.6. Counted on the 3 lifts you logged with RPE in both.',
		)
		const fell = signals({
			effort: {
				comparison: {
					recent: { averageRpe: 7, sets: 10 },
					previous: { averageRpe: 7, sets: 1 },
					difference: 0,
					lifts: 1,
				},
				recentSets: 10,
				previousSets: 1,
				marked: false,
			},
		})
		expect(describeEffort(fell)).toContain(
			'7.0 over 1 set in the 14 days before, no change.',
		)
		expect(describeEffort(fell)).toContain('the 1 lift you logged')
	})

	it('says what effort needs when there is not enough RPE to compare', () => {
		expect(
			describeEffort(
				signals({
					effort: {
						comparison: null,
						recentSets: 4,
						previousSets: 0,
						marked: false,
					},
				}),
			),
		).toBe(
			'Log RPE on at least 10 sets of the same lifts in both periods to compare. So far: 4 in the last 14 days, 0 in the 14 days before.',
		)
	})

	it('states short rep-target sets in both periods and the lifts most often short', () => {
		expect(describeRepTargets(signals())).toBe(
			'6 of 40 sets fell short of their rep target in the last 14 days (15%); 2 of 38 in the 14 days before (5%). Most often: Squat (3), Bench Press (2).',
		)
	})

	it('says when a period has no rep targets or too few to compare', () => {
		const copy = describeRepTargets(
			signals({
				repTargets: {
					recent: { shortSets: 0, targetedSets: 0, shortPercent: 0 },
					previous: { shortSets: 1, targetedSets: 4, shortPercent: 25 },
					comparable: false,
					mostOften: [],
					marked: false,
				},
			}),
		)
		expect(copy).toBe(
			'No sets had a rep target in the last 14 days; 1 of 4 sets fell short in the 14 days before (25%). Comparing needs at least 10 sets with a rep target in each period.',
		)
	})

	it('states a declining lift with its three values, dates and total fall', () => {
		expect(describeDecline(lift, 'KG', shortDate)).toBe(
			'Best estimated 1RM 116.7, 113.8, 110.8 kg on Sep 10, Sep 14 and Sep 18, down 5.1% over its last three sessions.',
		)
		expect(describeDecline(lift, 'LB', shortDate)).toMatch(
			/^Best estimated 1RM 257\.3, 250\.9, 244\.3 lb/,
		)
	})

	it('distinguishes no lift to compare from no lift falling', () => {
		expect(
			describeNoDeclines(
				signals({ declines: { checkedLifts: 0, lifts: [], marked: false } }),
			),
		).toBe('No lift has three sessions in the last 28 days to compare.')
		expect(
			describeNoDeclines(
				signals({ declines: { checkedLifts: 2, lifts: [], marked: false } }),
			),
		).toBe(
			"No lift's best estimated 1RM fell in each of its last two sessions.",
		)
	})

	it('states workouts, early ends and deloads per period', () => {
		expect(describeWorkouts(signals())).toBe(
			'5 workouts in the last 14 days, 1 ended early, 1 on a deload; 8 in the 14 days before, none ended early.',
		)
		expect(
			describeWorkouts(
				signals({
					workouts: {
						recent: { workouts: 0, endedEarly: 0, deloads: 0 },
						previous: { workouts: 1, endedEarly: 1, deloads: 0 },
						marked: true,
					},
				}),
			),
		).toBe(
			'No workouts in the last 14 days; 1 workout in the 14 days before, 1 ended early.',
		)
	})

	it('never names a cause or tells the member what to do', () => {
		const empty = signals({
			effort: {
				comparison: null,
				recentSets: 0,
				previousSets: 0,
				marked: false,
			},
			repTargets: {
				recent: { shortSets: 0, targetedSets: 0, shortPercent: 0 },
				previous: { shortSets: 0, targetedSets: 0, shortPercent: 0 },
				comparable: false,
				mostOften: [],
				marked: false,
			},
			declines: { checkedLifts: 0, lifts: [], marked: false },
		})
		const copy = [
			TRAINING_SIGNALS_TITLE,
			TRAINING_SIGNAL_MARKED_LABEL,
			...Object.values(TRAINING_SIGNAL_TITLES),
			describeSignalsIntro(thresholds),
			describeSignalsRule(thresholds),
			describeEffort(signals()),
			describeEffort(empty),
			describeRepTargets(signals()),
			describeRepTargets(empty),
			describeDecline(lift, 'KG', shortDate),
			describeNoDeclines(signals()),
			describeNoDeclines(empty),
			describeWorkouts(signals()),
		].join(' ')
		expect(copy).not.toMatch(
			/fatigue|tired|recover|overtrain|overreach|sleep|stress|injur|\bshould\b|\bconsider\b|\btry\b|\btake\b|\brest\b/i,
		)
	})
})
