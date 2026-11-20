import type {
	TrainingReview,
	TrainingReviewFact,
	WorkoutSessionSummary,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	factText,
	forgetReview,
	keepReview,
	latestWorkouts,
	quickPicks,
	readKeptReview,
	reviewCandidates,
	reviewFindings,
	reviewsLeft,
	toggleReviewWorkout,
} from './training-review'

const session = (
	id: string,
	endedAt: string | null,
	status: WorkoutSessionSummary['status'] = 'COMPLETED',
	totalSets = 9,
): WorkoutSessionSummary => ({
	id,
	status,
	startedAt: '2026-11-01T10:00:00.000Z',
	endedAt,
	totalSets,
	routine: { id: 'r', name: 'Upper / Lower', dayName: 'Upper' },
})

const fact = (
	kind: TrainingReviewFact['kind'],
	value: number | null,
	extra: Partial<TrainingReviewFact> = {},
): TrainingReviewFact => ({
	id: 'F1',
	kind,
	sessionId: 'w2',
	exerciseId: null,
	exerciseName: null,
	value,
	reps: null,
	...extra,
})

const REVIEW: TrainingReview = {
	question: 'PROGRESS',
	workouts: [
		{
			sessionId: 'w1',
			routineName: 'Upper / Lower',
			dayName: 'Upper',
			endedAt: '2026-11-03T19:00:00.000Z',
		},
		{
			sessionId: 'w2',
			routineName: 'Upper / Lower',
			dayName: 'Upper',
			endedAt: '2026-11-10T19:00:00.000Z',
		},
	],
	findings: [
		{
			segments: [
				{ fact: 'F1' },
				{ text: ' rose from ' },
				{ fact: 'F2' },
				{ text: ' to ' },
				{ fact: 'F3' },
				{ text: '.' },
			],
		},
	],
	facts: [
		fact('EXERCISE', null, {
			id: 'F1',
			sessionId: null,
			exerciseId: 'bench',
			exerciseName: 'Bench Press',
		}),
		fact('BEST_SET', 75, { id: 'F2', sessionId: 'w1', reps: 8 }),
		fact('BEST_SET', 80, { id: 'F3', sessionId: 'w2', reps: 8 }),
	],
}

const context = (locale: 'en' | 'es', weightUnit: 'KG' | 'LB' = 'KG') => ({
	t: translatorFor(locale, 'progress.review.facts'),
	locale,
	weightUnit,
	exerciseName: (name: string) =>
		locale === 'es' && name === 'Bench Press' ? 'Press de banca' : name,
})

describe('INTEL-04 training review', () => {
	it('offers completed workouts only, newest first, at most twenty', () => {
		const offered = reviewCandidates([
			session('old', '2026-11-01T19:00:00.000Z'),
			session('new', '2026-11-10T19:00:00.000Z'),
			session('early', '2026-11-05T19:00:00.000Z', 'ABORTED'),
			session('running', null, 'IN_PROGRESS'),
			session('empty', '2026-11-06T19:00:00.000Z', 'ABORTED', 0),
		])
		expect(offered.map(s => s.id)).toEqual(['new', 'old'])
		const many = Array.from({ length: 25 }, (_, i) =>
			session(`s${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
		)
		expect(reviewCandidates(many)).toHaveLength(20)
	})

	it('picks and unpicks, and never more than the twelve a review reads', () => {
		expect(toggleReviewWorkout([], 'a')).toEqual(['a'])
		expect(toggleReviewWorkout(['a', 'b'], 'a')).toEqual(['b'])
		const full = Array.from({ length: 12 }, (_, i) => `w${i}`)
		expect(toggleReviewWorkout(full, 'x')).toEqual(full)
		expect(toggleReviewWorkout(full, 'w3')).toHaveLength(11)
	})

	it('offers the latest four, eight or twelve, as far as there are', () => {
		expect(quickPicks(3)).toEqual([])
		expect(quickPicks(9)).toEqual([4, 8])
		expect(quickPicks(20)).toEqual([4, 8, 12])
		const offered = Array.from({ length: 20 }, (_, i) =>
			session(`s${i}`, `2026-11-${String(20 - i).padStart(2, '0')}T10:00:00Z`),
		)
		expect(latestWorkouts(offered, 4)).toEqual(['s0', 's1', 's2', 's3'])
		expect(latestWorkouts(offered, 30)).toHaveLength(12)
	})

	it('says what is left, never below none', () => {
		const usage = { state: 'READY' as const, limit: 20, resetsAt: '' }
		expect(reviewsLeft({ ...usage, used: 3 })).toBe(17)
		expect(reviewsLeft({ ...usage, used: 25 })).toBe(0)
	})

	it('renders each fact as its value, in the unit and the language', () => {
		const en = context('en')
		const es = context('es')
		expect(factText(fact('BEST_SET', 80, { reps: 8 }), REVIEW, en)).toBe(
			'80 kg × 8',
		)
		expect(factText(fact('BEST_SET', 0, { reps: 12 }), REVIEW, es)).toBe(
			'12 repeticiones',
		)
		expect(
			factText(fact('ESTIMATED_1RM', 101.3), REVIEW, context('es', 'LB')),
		).toBe('223,33 lb')
		expect(factText(fact('DURATION', 3540), REVIEW, en)).toBe('59 min')
		expect(factText(fact('AVERAGE_RPE', 8.5), REVIEW, es)).toBe('RPE 8,5')
		expect(factText(fact('SETS_BELOW_TARGET', 1), REVIEW, en)).toBe('1')
		expect(factText(fact('WORKOUT', null), REVIEW, es)).toMatch(/10 nov/)
		expect(
			factText(
				fact('EXERCISE', null, {
					exerciseName: 'Bench Press',
					sessionId: null,
				}),
				REVIEW,
				es,
			),
		).toBe('Press de banca')
	})

	it('reads a finding as words and facts, each value citing its workout', () => {
		const [parts] = reviewFindings(REVIEW, context('en'))
		expect(parts.map(part => part.text).join('')).toBe(
			'Bench Press rose from 75 kg × 8 to 80 kg × 8.',
		)
		expect(
			parts.filter(part => part.kind === 'fact').map(part => part.sessionId),
		).toEqual([null, 'w1', 'w2'])
	})

	it('drops a segment whose fact never arrived rather than inventing it', () => {
		const broken = {
			...REVIEW,
			findings: [{ segments: [{ text: 'Rose to ' }, { fact: 'F99' }] }],
		}
		expect(reviewFindings(broken, context('en'))[0]).toEqual([
			{ kind: 'text', text: 'Rose to ' },
		])
	})

	it('keeps a review for a reload, forgets it, and survives blocked storage', () => {
		const store = new Map<string, string>()
		const storage = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => void store.set(key, value),
			removeItem: (key: string) => void store.delete(key),
		}
		keepReview(storage, REVIEW)
		expect(readKeptReview(storage)).toEqual(REVIEW)
		forgetReview(storage)
		expect(readKeptReview(storage)).toBeNull()
		const blocked = {
			getItem: () => {
				throw new Error('blocked')
			},
			setItem: () => {
				throw new Error('blocked')
			},
			removeItem: () => {
				throw new Error('blocked')
			},
		}
		expect(() => keepReview(blocked, REVIEW)).not.toThrow()
		expect(readKeptReview(blocked)).toBeNull()
		expect(() => forgetReview(blocked)).not.toThrow()
	})
})
