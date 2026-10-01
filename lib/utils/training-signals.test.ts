import type { TrainingSignalsResponse } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeDecline,
	describeDeclinesHeadline,
	describeEffort,
	describeEffortHeadline,
	describeNoDeclines,
	describeRepTargets,
	describeRepTargetsHeadline,
	describeSignalsIntro,
	describeSignalsIntroSummary,
	describeSignalsRule,
	describeWorkouts,
	describeWorkoutsHeadline,
	trainingSignalMarkedLabel,
	trainingSignalsTitle,
	trainingSignalTitles,
} from './training-signals'

const en = translatorFor('en', 'progress.signals')
const es = translatorFor('es', 'progress.signals')

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
		expect(describeSignalsIntro(thresholds, en)).toBe(
			'Four measures from your logged workouts, the last 14 days beside the 14 days before. They state what changed, not why.',
		)
	})

	it('keeps one line of the intro for a phone and the rest behind the toggle', () => {
		const summary = describeSignalsIntroSummary(thresholds, en)
		expect(summary).toBe(
			'Four measures from your logged workouts, the last 14 days beside the 14 days before.',
		)
		expect(summary.length).toBeLessThanOrEqual(90)
		expect(describeSignalsIntro(thresholds, en)).toContain(summary)
		expect(
			describeSignalsIntroSummary(thresholds, es).length,
		).toBeLessThanOrEqual(110)
	})

	it('leads each row with its number and its change', () => {
		expect(describeEffortHeadline(signals(), en, 'en')).toBe('8.4, up 0.6')
		expect(describeRepTargetsHeadline(signals(), en)).toBe(
			'15% short of target, up 10 points',
		)
		expect(describeDeclinesHeadline(signals(), en)).toBe('1 lift')
		expect(describeWorkoutsHeadline(signals(), en)).toBe('5 workouts, down 3')
	})

	it('has no headline for a measure with nothing to compare', () => {
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
		expect(describeEffortHeadline(empty, en, 'en')).toBeNull()
		expect(describeRepTargetsHeadline(empty, en)).toBeNull()
		expect(describeDeclinesHeadline(empty, en)).toBe('0 lifts')
	})

	it('prints every threshold that marks a signal', () => {
		expect(describeSignalsRule(thresholds, en, 'en')).toBe(
			"A measure is marked when average RPE rises 0.5 or more, the share of sets short of their rep target rises 10 points (at least 3 sets), a lift's best estimated 1RM falls in each of its last two sessions by 2.5% in total, or you trained at least 2 fewer times or ended more workouts early. Deload workouts count only as workouts.",
		)
	})

	it('states the effort comparison with sets, change and lifts counted', () => {
		expect(describeEffort(signals(), en, 'en')).toBe(
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
		expect(describeEffort(fell, en, 'en')).toContain(
			'7.0 over 1 set in the 14 days before, no change.',
		)
		expect(describeEffort(fell, en, 'en')).toContain('the 1 lift you logged')
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
				en,
				'en',
			),
		).toBe(
			'Log RPE on at least 10 sets of the same lifts in both periods to compare. So far: 4 in the last 14 days, 0 in the 14 days before.',
		)
	})

	it('states short rep-target sets in both periods and the lifts most often short', () => {
		expect(describeRepTargets(signals(), en)).toBe(
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
			en,
		)
		expect(copy).toBe(
			'No sets had a rep target in the last 14 days; 1 of 4 sets fell short in the 14 days before (25%). Comparing needs at least 10 sets with a rep target in each period.',
		)
	})

	it('states a declining lift with its three values, dates and total fall', () => {
		expect(describeDecline(lift, 'KG', shortDate, en, 'en')).toBe(
			'Best estimated 1RM 116.7, 113.8, 110.8 kg on Sep 10, Sep 14 and Sep 18, down 5.1% over its last three sessions.',
		)
		expect(describeDecline(lift, 'LB', shortDate, en, 'en')).toMatch(
			/^Best estimated 1RM 257\.3, 250\.9, 244\.3 lb/,
		)
	})

	it('distinguishes no lift to compare from no lift falling', () => {
		expect(
			describeNoDeclines(
				signals({ declines: { checkedLifts: 0, lifts: [], marked: false } }),
				en,
			),
		).toBe('No lift has three sessions in the last 28 days to compare.')
		expect(
			describeNoDeclines(
				signals({ declines: { checkedLifts: 2, lifts: [], marked: false } }),
				en,
			),
		).toBe(
			"No lift's best estimated 1RM fell in each of its last two sessions.",
		)
	})

	it('states workouts, early ends and deloads per period', () => {
		expect(describeWorkouts(signals(), en, 'en')).toBe(
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
				en,
				'en',
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
			trainingSignalsTitle(en),
			trainingSignalMarkedLabel(en),
			...Object.values(trainingSignalTitles(en)),
			describeSignalsIntro(thresholds, en),
			describeSignalsIntroSummary(thresholds, en),
			describeEffortHeadline(signals(), en, 'en') ?? '',
			describeRepTargetsHeadline(signals(), en) ?? '',
			describeDeclinesHeadline(signals(), en),
			describeWorkoutsHeadline(signals(), en),
			describeSignalsRule(thresholds, en, 'en'),
			describeEffort(signals(), en, 'en'),
			describeEffort(empty, en, 'en'),
			describeRepTargets(signals(), en),
			describeRepTargets(empty, en),
			describeDecline(lift, 'KG', shortDate, en, 'en'),
			describeNoDeclines(signals(), en),
			describeNoDeclines(empty, en),
			describeWorkouts(signals(), en, 'en'),
		].join(' ')
		expect(copy).not.toMatch(
			/fatigue|tired|recover|overtrain|overreach|sleep|stress|injur|\bshould\b|\bconsider\b|\btry\b|\btake\b|\brest\b/i,
		)
	})
})

describe('the same signals in Spanish (I18N-04)', () => {
	it('agrees every count with its noun and keeps the numbers', () => {
		expect(describeSignalsIntro(thresholds, es)).toContain(
			'los últimos 14 días',
		)
		expect(describeWorkouts(signals(), es, 'es')).toBe(
			'5 entrenamientos en los últimos 14 días, 1 terminaron antes de tiempo, 1 en descarga; 8 en los 14 días anteriores, ninguno terminó antes de tiempo.',
		)
		expect(describeNoDeclines(signals(), es)).toContain('dos sesiones')
		expect(describeEffortHeadline(signals(), es, 'es')).toBe('8,4; sube 0,6')
		expect(describeRepTargetsHeadline(signals(), es)).toBe(
			'15% por debajo del objetivo; sube 10 puntos',
		)
		expect(describeWorkoutsHeadline(signals(), es)).toBe(
			'5 entrenamientos; baja 3',
		)
	})

	it('names no cause and gives no advice in Spanish either', () => {
		const copy = [
			trainingSignalsTitle(es),
			trainingSignalMarkedLabel(es),
			...Object.values(trainingSignalTitles(es)),
			describeSignalsIntro(thresholds, es),
			describeSignalsIntroSummary(thresholds, es),
			describeEffortHeadline(signals(), es, 'es') ?? '',
			describeRepTargetsHeadline(signals(), es) ?? '',
			describeDeclinesHeadline(signals(), es),
			describeWorkoutsHeadline(signals(), es),
			describeSignalsRule(thresholds, es, 'es'),
			describeEffort(signals(), es, 'es'),
			describeRepTargets(signals(), es),
			describeDecline(lift, 'KG', shortDate, es, 'es'),
			describeNoDeclines(signals(), es),
			describeWorkouts(signals(), es, 'es'),
		].join(' ')
		expect(copy).not.toMatch(
			/fatiga|cansad|recuper|sobreentren|sue[ñn]o|estr[ée]s|lesi[óo]n|deber[ií]as|deb[ée]s|intenta|prueba |descansa/i,
		)
	})
})
