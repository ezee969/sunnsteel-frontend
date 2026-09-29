import type { Translator } from '@/i18n/translator'

import type { UpsertSetLogPayload } from './workout-session.types'

type Translated = Translator<'core.setLogValidation'>

/** Which field a validation problem belongs to, for marking the right input. */
export type SetLogValidationField =
	| 'routineExerciseId'
	| 'exerciseId'
	| 'setNumber'
	| 'reps'
	| 'weight'
	| 'rpe'

export interface SetLogValidationError {
	field: SetLogValidationField
	message: string
}

/**
 * Validates a set log payload before submission
 * @param payload - The set log payload to validate
 * @param t - `core.setLogValidation` translator
 * @returns Object with isValid boolean and errors array
 */
export const validateSetLogPayload = (
	payload: UpsertSetLogPayload,
	t: Translated,
): { isValid: boolean; errors: SetLogValidationError[] } => {
	const errors: SetLogValidationError[] = []

	if (!payload.routineExerciseId) {
		errors.push({
			field: 'routineExerciseId',
			message: t('routineExerciseIdRequired'),
		})
	}

	if (!payload.exerciseId) {
		errors.push({ field: 'exerciseId', message: t('exerciseIdRequired') })
	}

	if (payload.setNumber < 1) {
		errors.push({ field: 'setNumber', message: t('setNumberPositive') })
	}

	if (payload.reps < 0) {
		errors.push({ field: 'reps', message: t('repsNonNegative') })
	}

	if (payload.weight !== undefined && payload.weight < 0) {
		errors.push({ field: 'weight', message: t('weightNonNegative') })
	}

	// RPE is optional. History renders it as `n/10`, so anything outside that
	// scale would be displayed as a fraction of a bound it does not share.
	if (
		payload.rpe !== undefined &&
		(payload.rpe < 0 || payload.rpe > 10 || Number.isNaN(payload.rpe))
	) {
		errors.push({ field: 'rpe', message: t('rpeRange') })
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

/**
 * Checks if a set is considered complete based on reps
 * @param reps - Number of reps performed
 * @param isCompleted - Explicit completion flag
 * @returns True if the set should be considered complete
 */
export const isSetComplete = (reps: number, isCompleted?: boolean): boolean => {
	// If explicitly marked as completed/incomplete, respect that
	if (isCompleted !== undefined) {
		return isCompleted
	}

	// Otherwise, consider complete if reps > 0
	return reps > 0
}

/**
 * Validates session finish requirements
 * @param completedSets - Number of completed sets
 * @param totalSets - Total number of sets
 * @param t - `core.setLogValidation` translator
 * @returns Object with validation results
 */
export const validateSessionFinish = (
	completedSets: number,
	totalSets: number,
	t: Translated,
): { isValid: boolean; canFinish: boolean; warnings: string[] } => {
	const warnings: string[] = []

	// Validate input parameters
	if (completedSets < 0 || totalSets < 0) {
		return {
			isValid: false,
			canFinish: false,
			warnings: [t('invalidSessionData')],
		}
	}

	if (completedSets > totalSets) {
		return {
			isValid: false,
			canFinish: false,
			warnings: [t('invalidSessionData')],
		}
	}

	// Handle edge case: no sets at all
	if (totalSets === 0) {
		return {
			isValid: true,
			canFinish: true,
			warnings: [],
		}
	}

	// Add warning for incomplete sets
	const incompleteSets = totalSets - completedSets
	if (incompleteSets > 0) {
		warnings.push(
			t('incompleteSets', { incomplete: incompleteSets, total: totalSets }),
		)
	}

	return {
		isValid: true,
		canFinish: true,
		warnings,
	}
}

/**
 * Validates weight input for exercises
 * @param weight - Weight value to validate
 * @param allowZero - Whether zero weight is allowed
 * @param t - `core.setLogValidation` translator
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateWeightDetailed = (
	weight: number | undefined | null,
	allowZero: boolean = true,
	t?: Translated,
): { isValid: boolean; error?: string } => {
	if (weight === undefined || weight === null) {
		return { isValid: true } // Weight is optional
	}

	if (isNaN(weight)) {
		return { isValid: false, error: t?.('weightMustBeNumber') }
	}

	if (!isFinite(weight)) {
		return { isValid: false, error: t?.('weightMustBeFinite') }
	}

	if (weight < 0) {
		return { isValid: false, error: t?.('weightCannotBeNegative') }
	}

	if (!allowZero && weight === 0) {
		return { isValid: false, error: t?.('weightMustBeGreaterThanZero') }
	}

	return { isValid: true }
}

/**
 * Simple weight validation that returns boolean
 * @param weight - Weight value to validate
 * @param allowZero - Whether zero weight is allowed
 * @returns True if weight is valid, false otherwise
 */
export const validateWeight = (
	weight: number | undefined | null,
	allowZero: boolean = true,
): boolean => {
	return validateWeightDetailed(weight, allowZero).isValid
}
