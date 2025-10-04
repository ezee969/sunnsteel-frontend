import type { UpsertSetLogPayload } from './workout-session.types';

/**
 * Validates a set log payload before submission
 * @param payload - The set log payload to validate
 * @returns Object with isValid boolean and errors array
 */
export const validateSetLogPayload = (
  payload: UpsertSetLogPayload
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!payload.routineExerciseId) {
    errors.push('Routine exercise ID is required');
  }

  if (!payload.exerciseId) {
    errors.push('Exercise ID is required');
  }

  if (payload.setNumber < 1) {
    errors.push('Set number must be greater than 0');
  }

  if (payload.reps < 0) {
    errors.push('Reps must be 0 or greater');
  }

  if (payload.weight !== undefined && payload.weight < 0) {
    errors.push('Weight must be 0 or greater');
  }

  return { 
    isValid: errors.length === 0,
    errors 
  };
};

/**
 * Checks if a set is considered complete based on reps
 * @param reps - Number of reps performed
 * @param isCompleted - Explicit completion flag
 * @returns True if the set should be considered complete
 */
export const isSetComplete = (reps: number, isCompleted?: boolean): boolean => {
  // If explicitly marked as completed/incomplete, respect that
  if (isCompleted !== undefined) {
    return isCompleted;
  }
  
  // Otherwise, consider complete if reps > 0
  return reps > 0;
};

/**
 * Validates session finish requirements
 * @param completedSets - Number of completed sets
 * @param totalSets - Total number of sets
 * @returns Object with validation results
 */
export const validateSessionFinish = (
  completedSets: number,
  totalSets: number
): { isValid: boolean; canFinish: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  // Validate input parameters
  if (completedSets < 0 || totalSets < 0) {
    return {
      isValid: false,
      canFinish: false,
      warnings: ['Invalid session data'],
    };
  }

  if (completedSets > totalSets) {
    return {
      isValid: false,
      canFinish: false,
      warnings: ['Invalid session data'],
    };
  }

  // Handle edge case: no sets at all
  if (totalSets === 0) {
    return {
      isValid: true,
      canFinish: true,
      warnings: [],
    };
  }

  // Add warning for incomplete sets
  const incompleteSets = totalSets - completedSets;
  if (incompleteSets > 0) {
    warnings.push(`${incompleteSets} out of ${totalSets} sets are incomplete`);
  }

  return {
    isValid: true,
    canFinish: true,
    warnings,
  };
};

/**
 * Validates weight input for exercises
 * @param weight - Weight value to validate
 * @param allowZero - Whether zero weight is allowed
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateWeightDetailed = (
  weight: number | undefined | null,
  allowZero: boolean = true
): { isValid: boolean; error?: string } => {
  if (weight === undefined || weight === null) {
    return { isValid: true }; // Weight is optional
  }

  if (isNaN(weight)) {
    return { isValid: false, error: 'Weight must be a valid number' };
  }

  if (!isFinite(weight)) {
    return { isValid: false, error: 'Weight must be a finite number' };
  }

  if (weight < 0) {
    return { isValid: false, error: 'Weight cannot be negative' };
  }

  if (!allowZero && weight === 0) {
    return { isValid: false, error: 'Weight must be greater than zero' };
  }

  return { isValid: true };
};

/**
 * Simple weight validation that returns boolean
 * @param weight - Weight value to validate
 * @param allowZero - Whether zero weight is allowed
 * @returns True if weight is valid, false otherwise
 */
export const validateWeight = (
  weight: number | undefined | null,
  allowZero: boolean = true
): boolean => {
  return validateWeightDetailed(weight, allowZero).isValid;
};