import type { SetKind, WeightUnit } from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import { formatRestTime } from './rest-timer.utils'
import { isExerciseDone } from './session-progress.utils'
import { areCanonicalWeightsEqual, formatWeight } from './weight-unit'

/**
 * LIVE-22 (design system §27): what the workout screen states once per
 * exercise instead of on every set row, and when the workout may be finished.
 */

/** The parts of a set this module reads. */
export interface PlannedSet {
	setNumber: number
	kind: SetKind
	isExtra?: boolean
	isCompleted: boolean
	plannedReps?: number | null
	plannedMinReps?: number | null
	plannedMaxReps?: number | null
	plannedWeight?: number | null
	plannedRir?: number | null
}

export interface RepTarget {
	min: number
	max: number
}

/**
 * The prescription an exercise's working sets share. Each field is set only
 * when every working set agrees on it, so the line never states a target one
 * of the sets does not have.
 */
export interface SharedPrescription {
	count: number
	reps: RepTarget | null
	weightKg: number | null
	rir: number | null
}

export const repTargetOf = (set: PlannedSet): RepTarget | null => {
	if (set.plannedMinReps != null && set.plannedMaxReps != null)
		return { min: set.plannedMinReps, max: set.plannedMaxReps }
	if (set.plannedReps != null && set.plannedReps > 0)
		return { min: set.plannedReps, max: set.plannedReps }
	return null
}

const sameReps = (a: RepTarget | null, b: RepTarget | null) =>
	a !== null && b !== null && a.min === b.min && a.max === b.max

const shared = <T>(values: T[], equal: (a: T, b: T) => boolean): T | null =>
	values.length > 0 && values.every(value => equal(value, values[0]))
		? values[0]
		: null

const isWorking = (set: PlannedSet) => !set.isExtra && set.kind === 'WORKING'

/** The working sets' shared prescription, or null with no working set. */
export function sharedPrescription(
	sets: readonly PlannedSet[],
): SharedPrescription | null {
	const working = sets.filter(isWorking)
	if (working.length === 0) return null
	const reps = shared(working.map(repTargetOf), sameReps)
	const weights = working.map(set => set.plannedWeight ?? null)
	const weightKg = weights.every(weight => weight != null && weight > 0)
		? shared(weights, (a, b) => areCanonicalWeightsEqual(a, b))
		: null
	const rirs = working.map(set => set.plannedRir ?? null)
	const rir = rirs.every(value => value != null)
		? shared(rirs, (a, b) => a === b)
		: null
	return { count: working.length, reps, weightKg, rir }
}

/**
 * Whether a set's own targets are the line's, so its row need not repeat
 * them. A set that is not a working set, or an extra one, always shows its
 * own (it has a different job, or none).
 */
export function matchesPrescription(
	set: PlannedSet,
	prescription: SharedPrescription | null,
): { reps: boolean; weight: boolean } {
	if (!prescription || !isWorking(set)) return { reps: false, weight: false }
	return {
		reps:
			prescription.reps !== null &&
			sameReps(repTargetOf(set), prescription.reps),
		weight:
			prescription.weightKg !== null &&
			areCanonicalWeightsEqual(
				set.plannedWeight ?? null,
				prescription.weightKg,
			),
	}
}

/**
 * The exercise's prescription in one line: "3 × 6–8 · 57.5 kg · RIR 2 ·
 * rest 2:00". Parts the working sets do not share are left out rather than
 * guessed; with no shared reps it says how many sets there are.
 */
export function prescriptionLine(
	prescription: SharedPrescription | null,
	restSeconds: number | null | undefined,
	unit: WeightUnit,
	locale: Locale,
	t: Translator<'workout.prescriptionLine'>,
): string | null {
	if (!prescription) return null
	const { count, reps, weightKg, rir } = prescription
	const parts = [
		reps
			? t('setsReps', {
					count,
					reps:
						reps.min === reps.max
							? String(reps.min)
							: t('range', { min: reps.min, max: reps.max }),
				})
			: t('setsOnly', { count }),
	]
	if (weightKg !== null) parts.push(formatWeight(weightKg, unit, locale))
	if (rir !== null) parts.push(t('rir', { value: rir }))
	if (restSeconds && restSeconds > 0)
		parts.push(t('rest', { time: formatRestTime(restSeconds) }))
	return parts.join(' · ')
}

/**
 * The workout's required sets are all done: every exercise is done by the
 * LIVE-12 rule, so warm-ups and optional sets never hold Finish back.
 */
export const allRequiredDone = (
	groups: readonly { sets: readonly PlannedSet[] }[],
): boolean =>
	groups.length > 0 && groups.every(group => isExerciseDone([...group.sets]))
