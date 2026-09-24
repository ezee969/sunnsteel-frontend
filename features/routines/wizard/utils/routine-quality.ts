import { countsAsWork } from '@sunsteel/contracts'
import {
	EXERCISE_EQUIPMENT,
	type ExerciseEquipment,
	type MovementPattern,
	MUSCLE_GROUPS,
	type MuscleGroup,
	type TrainingLocationPreference,
} from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types'
import {
	defaultTrainingLocation,
	EQUIPMENT_LABELS,
	normalizeLocationEquipment,
} from '@/lib/utils/exercise-equipment'

import type { RoutineSet, RoutineWizardData } from '../types'
import { wizardDayTitle } from './schedule'

/**
 * ROUT-10 quality summary: what a routine asks of a week, derived only from
 * the planned sets and the EXER-09 catalog metadata. Nothing here is a
 * prescription; every flag carries the numbers it was computed from.
 */

type ExerciseLookup = Record<string, Exercise | undefined>

export interface MuscleSetCount {
	muscle: MuscleGroup
	/** Set-equivalents: primary 1.0, secondary 0.5, as on Progress. */
	sets: number
}

export interface DayDurationEstimate {
	/** The wizard slot and title of the day (ROUT-11). */
	slot: number
	label: string
	/** Rounded to five minutes; 0 when the day has no exercises. */
	seconds: number
}

export type EquipmentCheck =
	| { status: 'no-location' }
	| { status: 'nothing-listed'; locationName: string }
	| { status: 'all-listed'; locationName: string }
	| {
			status: 'missing'
			locationName: string
			missing: ExerciseEquipment[]
	  }

export type ImbalanceKind =
	'NO_LOWER_BODY' | 'NO_UPPER_BODY' | 'PUSH_PULL' | 'QUAD_HAMSTRING'

export interface RoutineImbalance {
	kind: ImbalanceKind
	title: string
	evidence: string
}

export interface RoutineQualitySummary {
	/** Set counts cover one pass through a rotation rather than a week. */
	perRotation: boolean
	muscleSets: MuscleSetCount[]
	durations: DayDurationEstimate[]
	equipment: ExerciseEquipment[]
	equipmentCheck: EquipmentCheck
	imbalances: RoutineImbalance[]
	/** Planned exercises without catalog movement data, left out of the checks. */
	unclassifiedExercises: number
}

export const SECONDS_PER_REP = 4
export const ASSUMED_REPS = 10
export const SETUP_SECONDS_PER_EXERCISE = 60
/** The larger side must reach this many weekly sets before a gap is flagged. */
export const MIN_BALANCE_SETS = 6
export const PUSH_PULL_RATIO = 1.5
export const QUAD_HAMSTRING_RATIO = 2

const PUSH_PATTERNS = new Set<MovementPattern>([
	'HORIZONTAL_PUSH',
	'VERTICAL_PUSH',
	'CHEST_FLY',
])
const PULL_PATTERNS = new Set<MovementPattern>([
	'HORIZONTAL_PULL',
	'VERTICAL_PULL',
	'SHOULDER_EXTENSION',
	'SHOULDER_HORIZONTAL_ABDUCTION',
])
const UPPER_PATTERNS = new Set<MovementPattern>([
	...PUSH_PATTERNS,
	...PULL_PATTERNS,
	'SHOULDER_ABDUCTION',
	'SHOULDER_FLEXION',
	'SCAPULAR_ELEVATION',
	'ELBOW_FLEXION',
	'ELBOW_EXTENSION',
])
const LOWER_PATTERNS = new Set<MovementPattern>([
	'SQUAT',
	'HINGE',
	'LUNGE',
	'KNEE_EXTENSION',
	'KNEE_FLEXION',
	'HIP_EXTENSION',
	'PLANTAR_FLEXION',
])

export { EQUIPMENT_LABELS }

const setReps = (set: RoutineSet): number => {
	const reps =
		set.repType === 'FIXED'
			? set.reps
			: set.minReps && set.maxReps
				? (set.minReps + set.maxReps) / 2
				: (set.maxReps ?? set.minReps)
	return reps && reps > 0 ? reps : ASSUMED_REPS
}

/**
 * Working time at a steady tempo, the programmed rest after every set except
 * the day's last, and a fixed setup allowance per exercise. Warm-up sets
 * (LIVE-12) take time like any other; warm-ups not written into the routine
 * are not modelled. Rounded to five minutes because the inputs are not more precise.
 */
export const estimateDaySeconds = (
	day: RoutineWizardData['days'][number],
): number => {
	const setCount = day.exercises.reduce((n, e) => n + e.sets.length, 0)
	if (day.exercises.length === 0) return 0

	let seconds = day.exercises.length * SETUP_SECONDS_PER_EXERCISE
	let remaining = setCount
	for (const exercise of day.exercises) {
		for (const set of exercise.sets) {
			seconds += setReps(set) * SECONDS_PER_REP
			remaining -= 1
			if (remaining > 0) seconds += Math.max(0, exercise.restSeconds)
		}
	}
	return Math.max(300, Math.round(seconds / 300) * 300)
}

export const computeWeeklyMuscleSets = (
	data: RoutineWizardData,
	exercises: ExerciseLookup,
): MuscleSetCount[] => {
	const totals = new Map<MuscleGroup, number>()
	for (const day of data.days) {
		for (const planned of day.exercises) {
			const meta = exercises[planned.exerciseId]
			// LIVE-12: a warm-up is not a set of work for any muscle.
			const workSets = planned.sets.filter(set => countsAsWork(set.kind)).length
			if (!meta || workSets === 0) continue
			const primary = new Set(meta.primaryMuscles)
			for (const muscle of primary) {
				totals.set(muscle, (totals.get(muscle) ?? 0) + workSets)
			}
			for (const muscle of new Set(meta.secondaryMuscles)) {
				if (primary.has(muscle)) continue
				totals.set(muscle, (totals.get(muscle) ?? 0) + workSets * 0.5)
			}
		}
	}
	return [...totals]
		.map(([muscle, sets]) => ({ muscle, sets }))
		.sort(
			(a, b) =>
				b.sets - a.sets ||
				MUSCLE_GROUPS.indexOf(a.muscle) - MUSCLE_GROUPS.indexOf(b.muscle),
		)
}

export const computeRoutineEquipment = (
	data: RoutineWizardData,
	exercises: ExerciseLookup,
): ExerciseEquipment[] => {
	const needed = new Set<ExerciseEquipment>()
	for (const day of data.days) {
		for (const planned of day.exercises) {
			for (const item of exercises[planned.exerciseId]?.equipmentRequired ??
				[]) {
				if (item !== 'bodyweight') needed.add(item)
			}
		}
	}
	return EXERCISE_EQUIPMENT.filter(item => needed.has(item))
}

export const checkEquipmentAtLocation = (
	equipment: ExerciseEquipment[],
	locations: TrainingLocationPreference[] | undefined,
): EquipmentCheck => {
	const location = defaultTrainingLocation(locations)
	if (!location) return { status: 'no-location' }
	if (location.equipment.length === 0) {
		return { status: 'nothing-listed', locationName: location.name }
	}
	const available = normalizeLocationEquipment(location.equipment)
	const missing = equipment.filter(item => !available.has(item))
	return missing.length === 0
		? { status: 'all-listed', locationName: location.name }
		: { status: 'missing', locationName: location.name, missing }
}

export const formatSetCount = (sets: number): string =>
	Number.isInteger(sets) ? String(sets) : sets.toFixed(1)

const plural = (count: number, word: string) =>
	`${formatSetCount(count)} ${word}${count === 1 ? '' : 's'}`

export const findLikelyImbalances = (
	data: RoutineWizardData,
	exercises: ExerciseLookup,
	muscleSets: MuscleSetCount[],
): RoutineImbalance[] => {
	const period = data.scheduleMode === 'ROTATION' ? 'per rotation' : 'a week'
	let upper = 0
	let lower = 0
	let push = 0
	let pull = 0
	for (const day of data.days) {
		for (const planned of day.exercises) {
			const pattern = exercises[planned.exerciseId]?.movementPattern
			if (!pattern) continue
			const sets = planned.sets.filter(set => countsAsWork(set.kind)).length
			if (UPPER_PATTERNS.has(pattern)) upper += sets
			if (LOWER_PATTERNS.has(pattern)) lower += sets
			if (PUSH_PATTERNS.has(pattern)) push += sets
			if (PULL_PATTERNS.has(pattern)) pull += sets
		}
	}

	const imbalances: RoutineImbalance[] = []

	if (lower === 0 && upper >= MIN_BALANCE_SETS) {
		imbalances.push({
			kind: 'NO_LOWER_BODY',
			title: 'No lower-body exercises',
			evidence: `${plural(upper, 'upper-body set')} ${period} and none for the legs.`,
		})
	}
	if (upper === 0 && lower >= MIN_BALANCE_SETS) {
		imbalances.push({
			kind: 'NO_UPPER_BODY',
			title: 'No upper-body exercises',
			evidence: `${plural(lower, 'lower-body set')} ${period} and none for the upper body.`,
		})
	}

	const pushPullHigh = Math.max(push, pull)
	if (
		pushPullHigh >= MIN_BALANCE_SETS &&
		pushPullHigh >= Math.min(push, pull) * PUSH_PULL_RATIO
	) {
		imbalances.push({
			kind: 'PUSH_PULL',
			title:
				push > pull
					? 'More pressing than pulling'
					: 'More pulling than pressing',
			evidence: `${plural(push, 'pressing set')} and ${plural(pull, 'pulling set')} ${period}.`,
		})
	}

	const quads = muscleSets.find(m => m.muscle === 'QUADRICEPS')?.sets ?? 0
	const hamstrings = muscleSets.find(m => m.muscle === 'HAMSTRINGS')?.sets ?? 0
	const legHigh = Math.max(quads, hamstrings)
	if (
		legHigh >= MIN_BALANCE_SETS &&
		legHigh >= Math.min(quads, hamstrings) * QUAD_HAMSTRING_RATIO
	) {
		imbalances.push({
			kind: 'QUAD_HAMSTRING',
			title:
				quads > hamstrings
					? 'Quads outweigh hamstrings'
					: 'Hamstrings outweigh quads',
			evidence: `Quads ${formatSetCount(quads)} and hamstrings ${formatSetCount(hamstrings)} ${period === 'a week' ? 'weekly set-equivalents' : 'set-equivalents per rotation'}.`,
		})
	}

	return imbalances
}

export const buildRoutineQualitySummary = (
	data: RoutineWizardData,
	exercises: ExerciseLookup,
	locations: TrainingLocationPreference[] | undefined,
): RoutineQualitySummary => {
	const muscleSets = computeWeeklyMuscleSets(data, exercises)
	const equipment = computeRoutineEquipment(data, exercises)
	const unclassifiedExercises = data.days.reduce(
		(count, day) =>
			count +
			day.exercises.filter(
				planned => !exercises[planned.exerciseId]?.movementPattern,
			).length,
		0,
	)

	return {
		perRotation: data.scheduleMode === 'ROTATION',
		muscleSets,
		durations: data.days.map((day, index) => ({
			slot: day.slot,
			label: wizardDayTitle(data.scheduleMode, day, index),
			seconds: estimateDaySeconds(day),
		})),
		equipment,
		equipmentCheck: checkEquipmentAtLocation(equipment, locations),
		imbalances: findLikelyImbalances(data, exercises, muscleSets),
		unclassifiedExercises,
	}
}
