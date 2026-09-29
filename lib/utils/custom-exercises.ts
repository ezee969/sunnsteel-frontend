import {
	CUSTOM_EXERCISE_NAME_MAX,
	CUSTOM_EXERCISE_NOTE_MAX,
	CUSTOM_EXERCISE_REFUSALS,
	type CustomExerciseInput,
	type CustomExerciseProblem,
	customExerciseProblem,
	type ExerciseEquipment,
	type ExerciseMechanic,
	exerciseNameKey,
	type MovementPattern,
	type MuscleGroup,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'
import type { Exercise } from '@/lib/api/types/exercise.type'

/**
 * EXER-06: exercises a member creates for themselves. The draft a dialog
 * edits, the checks the server makes again, and the copy for what it refuses.
 * Pure, so it runs in the Node test environment.
 */

export interface CustomExerciseDraft {
	name: string
	primaryMuscles: MuscleGroup[]
	secondaryMuscles: MuscleGroup[]
	equipmentRequired: ExerciseEquipment[]
	movementPattern: MovementPattern | null
	mechanic: ExerciseMechanic | null
	note: string
}

export const isCustomExercise = (exercise: Pick<Exercise, 'isCustom'>) =>
	exercise.isCustom === true

export const isArchivedExercise = (exercise: Pick<Exercise, 'archivedAt'>) =>
	Boolean(exercise.archivedAt)

/**
 * What a picker offers: everything but archived custom exercises, which keep
 * their history and stay in the cache so a routine can still name them.
 */
export const pickableExercises = <T extends Pick<Exercise, 'archivedAt'>>(
	exercises: readonly T[],
): T[] => exercises.filter(exercise => !isArchivedExercise(exercise))

/** Public training-identity favorites stay catalog only. */
export const catalogExercises = <T extends Pick<Exercise, 'isCustom'>>(
	exercises: readonly T[],
): T[] => exercises.filter(exercise => !isCustomExercise(exercise))

export const emptyCustomExerciseDraft = (name = ''): CustomExerciseDraft => ({
	name,
	primaryMuscles: [],
	secondaryMuscles: [],
	equipmentRequired: [],
	movementPattern: null,
	mechanic: null,
	note: '',
})

export const draftFromExercise = (exercise: Exercise): CustomExerciseDraft => ({
	name: exercise.name,
	primaryMuscles: [...exercise.primaryMuscles],
	secondaryMuscles: [...exercise.secondaryMuscles],
	equipmentRequired: [...exercise.equipmentRequired],
	movementPattern: exercise.movementPattern,
	mechanic: exercise.mechanic,
	note: exercise.note ?? '',
})

export const customExerciseInput = (
	draft: CustomExerciseDraft,
): CustomExerciseInput => ({
	...draft,
	note: draft.note.trim() ? draft.note : null,
})

/** Toggle a value in a list, keeping the list's order. */
export function toggleIn<T>(list: readonly T[], value: T): T[] {
	return list.includes(value)
		? list.filter(item => item !== value)
		: [...list, value]
}

/**
 * A muscle chosen as primary leaves the secondary list, and the other way
 * round, so the two can never hold the same muscle.
 */
export function toggleMuscle(
	draft: CustomExerciseDraft,
	role: 'primary' | 'secondary',
	muscle: MuscleGroup,
): CustomExerciseDraft {
	if (role === 'primary') {
		return {
			...draft,
			primaryMuscles: toggleIn(draft.primaryMuscles, muscle),
			secondaryMuscles: draft.secondaryMuscles.filter(m => m !== muscle),
		}
	}
	return {
		...draft,
		secondaryMuscles: toggleIn(draft.secondaryMuscles, muscle),
		primaryMuscles: draft.primaryMuscles.filter(m => m !== muscle),
	}
}

export type CustomExerciseField =
	'name' | 'primaryMuscles' | 'secondaryMuscles' | 'equipmentRequired' | 'note'

const PROBLEM_FIELDS: Record<CustomExerciseProblem, CustomExerciseField> = {
	NAME_REQUIRED: 'name',
	NAME_TOO_LONG: 'name',
	PRIMARY_MUSCLE_REQUIRED: 'primaryMuscles',
	MUSCLE_LISTED_TWICE: 'secondaryMuscles',
	EQUIPMENT_REQUIRED: 'equipmentRequired',
	NOTE_TOO_LONG: 'note',
}

type T = Translator<'routines.customExercise'>

function problemMessage(problem: CustomExerciseProblem, t: T): string {
	switch (problem) {
		case 'NAME_REQUIRED':
			return t('nameRequired')
		case 'NAME_TOO_LONG':
			return t('nameTooLong', { max: CUSTOM_EXERCISE_NAME_MAX })
		case 'PRIMARY_MUSCLE_REQUIRED':
			return t('primaryMuscleRequired')
		case 'MUSCLE_LISTED_TWICE':
			return t('muscleListedTwice')
		case 'EQUIPMENT_REQUIRED':
			return t('equipmentRequired')
		default:
			return t('noteTooLong', { max: CUSTOM_EXERCISE_NOTE_MAX })
	}
}

export interface CustomExerciseDraftProblem {
	field: CustomExerciseField
	message: string
}

/**
 * The first thing stopping the draft from being saved, worded, and the field
 * it belongs to, or null. The name is checked against every exercise the
 * member can see -- the catalog and their own -- as the server does;
 * `exceptId` is the exercise being edited.
 */
export function customExerciseDraftProblem(
	draft: CustomExerciseDraft,
	exercises: readonly Pick<Exercise, 'id' | 'name'>[],
	t: T,
	exceptId?: string,
): CustomExerciseDraftProblem | null {
	const problem = customExerciseProblem(customExerciseInput(draft))
	if (problem) {
		return {
			field: PROBLEM_FIELDS[problem],
			message: problemMessage(problem, t),
		}
	}
	const key = exerciseNameKey(draft.name)
	if (
		exercises.some(
			exercise =>
				exercise.id !== exceptId && exerciseNameKey(exercise.name) === key,
		)
	) {
		return {
			field: 'name',
			message: t('nameTaken'),
		}
	}
	return null
}

/** The server's refusal, without its leading code. */
export function describeCustomExerciseError(message: string, t: T): string {
	for (const code of Object.values(CUSTOM_EXERCISE_REFUSALS)) {
		const prefix = `${code}: `
		const at = message.indexOf(prefix)
		if (at >= 0) {
			const rest = message.slice(at + prefix.length).trim()
			return rest.charAt(0).toUpperCase() + rest.slice(1) + '.'
		}
	}
	return message || t('saveFailed')
}

export const customExerciseCopy = (t: T) =>
	({
		createTitle: t('createTitle'),
		editTitle: t('editTitle'),
		description: t('description'),
		noteHint: t('noteHint'),
		archiveDescription: t('archiveDescription'),
		deleteDescription: t('deleteDescription'),
		inUse: t('inUse'),
		editNote: t('editNote'),
	}) as const
