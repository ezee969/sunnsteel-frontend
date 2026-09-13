/**
 * Formats a weekly training-day count with the correct singular or plural noun.
 */
export const formatDaysPerWeek = (days: number): string =>
	`${days} ${days === 1 ? 'day' : 'days'}/week`

/**
 * Formats a routine day's exercise count with the correct singular or plural
 * noun - "1 exercise", never "1 exercises" (TD-41).
 */
export const formatExerciseCount = (count: number): string =>
	`${count} ${count === 1 ? 'exercise' : 'exercises'}`
