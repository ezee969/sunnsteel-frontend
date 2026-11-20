import {
	TRAINING_REVIEW_CANDIDATES,
	TRAINING_REVIEW_WORKOUTS_MAX,
	type TrainingReview,
	type TrainingReviewFact,
	type TrainingReviewUsage,
	type WeightUnit,
	type WorkoutSessionSummary,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import { formatWeight } from './weight-unit'

/**
 * INTEL-04: the review's pure rules -- which workouts the picker offers, how
 * a pick changes, and how each of the server's facts reads in the member's
 * unit and language. The words around the facts are the model's; every
 * number is one of these.
 */

/**
 * The member's latest completed workouts, newest first. An ended-early one is
 * left out: the history list cannot tell it from a discarded, empty one, and
 * the server would refuse an empty one.
 */
export function reviewCandidates(
	sessions: readonly WorkoutSessionSummary[],
): WorkoutSessionSummary[] {
	return sessions
		.filter(session => session.status === 'COMPLETED' && !!session.endedAt)
		.sort((a, b) => Date.parse(b.endedAt!) - Date.parse(a.endedAt!))
		.slice(0, TRAINING_REVIEW_CANDIDATES)
}

/** Picks or unpicks a workout, never past the most a review reads. */
export function toggleReviewWorkout(
	selected: readonly string[],
	sessionId: string,
): string[] {
	if (selected.includes(sessionId)) {
		return selected.filter(id => id !== sessionId)
	}
	if (selected.length >= TRAINING_REVIEW_WORKOUTS_MAX) return [...selected]
	return [...selected, sessionId]
}

/** How many reviews remain this month, never below none. */
export function reviewsLeft(usage: TrainingReviewUsage): number {
	return Math.max(0, usage.limit - usage.used)
}

export interface FactContext {
	t: Translator<'progress.review.facts'>
	locale: Locale
	weightUnit: WeightUnit
	/** A catalog name in the member's language, a member's own as typed. */
	exerciseName: (name: string) => string
}

/** A workout as a review names it: its date, in the app's language. */
export function workoutDate(endedAt: string, locale: Locale): string {
	return dateFormatter(locale, { day: 'numeric', month: 'short' }).format(
		new Date(endedAt),
	)
}

/** One fact as it reads inside a finding: the value alone. */
export function factText(
	fact: TrainingReviewFact,
	review: Pick<TrainingReview, 'workouts'>,
	{ t, locale, weightUnit, exerciseName }: FactContext,
): string {
	const value = fact.value ?? 0
	const weight = () => formatWeight(value, weightUnit, locale)
	const set = () =>
		value > 0
			? t('weightTimesReps', { weight: weight(), reps: fact.reps ?? 0 })
			: t('reps', { count: fact.reps ?? 0 })
	switch (fact.kind) {
		case 'EXERCISE':
			return exerciseName(fact.exerciseName ?? '')
		case 'WORKOUT': {
			const workout = review.workouts.find(w => w.sessionId === fact.sessionId)
			return workout ? workoutDate(workout.endedAt, locale) : ''
		}
		case 'DURATION':
			return t('minutes', { count: Math.round(value / 60) })
		case 'VOLUME':
		case 'ESTIMATED_1RM':
			return weight()
		case 'SETS':
		case 'TARGETED_SETS':
		case 'SETS_BELOW_TARGET':
			return numberFormatter(locale, { maximumFractionDigits: 0 }).format(value)
		case 'BEST_SET':
		case 'RECORD':
			return set()
		case 'AVERAGE_RPE':
			return t('rpe', {
				value: numberFormatter(locale, { maximumFractionDigits: 1 }).format(
					value,
				),
			})
	}
}

export type ReviewPart =
	| { kind: 'text'; text: string }
	| {
			kind: 'fact'
			text: string
			/** The workout it cites, which the screen links to; none for a name. */
			sessionId: string | null
	  }

/** Each finding as words and rendered facts, in reading order. */
export function reviewFindings(
	review: TrainingReview,
	context: FactContext,
): ReviewPart[][] {
	const facts = new Map(review.facts.map(fact => [fact.id, fact]))
	return review.findings.map(finding =>
		finding.segments.flatMap((segment): ReviewPart[] => {
			if ('text' in segment) return [{ kind: 'text', text: segment.text }]
			const fact = facts.get(segment.fact)
			if (!fact) return []
			return [
				{
					kind: 'fact',
					text: factText(fact, review, context),
					sessionId: fact.kind === 'EXERCISE' ? null : fact.sessionId,
				},
			]
		}),
	)
}

type ReviewStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const STORAGE_KEY = 'ss-training-review'

/**
 * A review outlives a reload of this tab, because it used one of the month's
 * reviews. Blocked storage only loses that convenience.
 */
export function keepReview(storage: ReviewStorage, review: TrainingReview) {
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(review))
	} catch {
		// The review is still on the page.
	}
}

export function readKeptReview(storage: ReviewStorage): TrainingReview | null {
	try {
		const stored = storage.getItem(STORAGE_KEY)
		if (!stored) return null
		const review = JSON.parse(stored) as TrainingReview
		return Array.isArray(review?.findings) && Array.isArray(review.facts)
			? review
			: null
	} catch {
		return null
	}
}

export function forgetReview(storage: ReviewStorage) {
	try {
		storage.removeItem(STORAGE_KEY)
	} catch {
		// Nothing more to do.
	}
}
