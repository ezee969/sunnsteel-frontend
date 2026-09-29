import type { Translator } from '@/i18n/translator'

/**
 * Formats a weekly training-day count with the correct singular or plural noun.
 */
export const formatDaysPerWeek = (
	days: number,
	t: Translator<'routines.format'>,
): string => t('daysPerWeek', { days })

/**
 * Formats a routine day's exercise count with the correct singular or plural
 * noun - "1 exercise", never "1 exercises" (TD-41).
 */
export const formatExerciseCount = (
	count: number,
	t: Translator<'routines.format'>,
): string => t('exerciseCount', { count })
