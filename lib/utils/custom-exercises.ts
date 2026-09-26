import {
	CUSTOM_EXERCISE_PROBLEM_MESSAGES,
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
	exceptId?: string,
): CustomExerciseDraftProblem | null {
	const problem = customExerciseProblem(customExerciseInput(draft))
	if (problem) {
		return {
			field: PROBLEM_FIELDS[problem],
			message: CUSTOM_EXERCISE_PROBLEM_MESSAGES[problem],
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
			message:
				'You already have an exercise by that name, or the catalog does.',
		}
	}
	return null
}

/** The server's refusal, without its leading code. */
export function describeCustomExerciseError(message: string): string {
	for (const code of Object.values(CUSTOM_EXERCISE_REFUSALS)) {
		const prefix = `${code}: `
		const at = message.indexOf(prefix)
		if (at >= 0) {
			const rest = message.slice(at + prefix.length).trim()
			return rest.charAt(0).toUpperCase() + rest.slice(1) + '.'
		}
	}
	return message || 'The exercise was not saved. Try again in a moment.'
}

export const CUSTOM_EXERCISE_COPY = {
	createTitle: 'New exercise',
	editTitle: 'Edit exercise',
	description:
		'Only you can see and use your own exercises. Anyone you share a routine, a workout or a record with sees its name.',
	noteHint: 'Only you see the note.',
	archiveDescription:
		'Archiving takes it out of the catalog and the routine pickers. Routines that use it, and its workouts and records, keep it. You can restore it at any time.',
	deleteDescription:
		'Deleting removes it for good. It is only possible while no routine or workout uses it.',
	inUse:
		'A routine or a workout uses this exercise, so it can be archived but not deleted.',
	editNote:
		'Changes apply from now on. Past workouts keep the muscles they were logged with.',
} as const
