/**
 * Formats a weekly training-day count with the correct singular or plural noun.
 */
export const formatDaysPerWeek = (days: number): string =>
	`${days} ${days === 1 ? 'day' : 'days'}/week`
