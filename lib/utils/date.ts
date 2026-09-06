export const getTodayDow = (): number => {
	// Local device weekday (0=Sun..6=Sat)
	return new Date().getDay()
}

export const weekdayName = (
	dayOfWeek: number,
	style: 'short' | 'long' = 'short',
): string => {
	const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
	const long = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	] as const
	const src = style === 'long' ? long : short
	return src[dayOfWeek] ?? `Day ${dayOfWeek}`
}

export const isTodayDow = (dayOfWeek: number): boolean =>
	dayOfWeek === getTodayDow()

/**
 * Validates if a workout can be started today based on routine's scheduled days
 * @param routineDays - Array of routine days with dayOfWeek property
 * @param todayDow - Today's day of week (0=Sun..6=Sat), defaults to current day
 * @returns Object with validation result and message
 */
export const validateWorkoutDate = (
	routineDays: Array<{ dayOfWeek: number }> | undefined,
	todayDow: number = getTodayDow(),
): { isValid: boolean; message?: string; availableDays?: string[] } => {
	if (!routineDays || routineDays.length === 0) {
		return {
			isValid: false,
			message: 'No training days configured for this routine',
		}
	}

	const scheduledDays = routineDays.map(day => day.dayOfWeek)
	const isScheduledToday = scheduledDays.includes(todayDow)

	if (isScheduledToday) {
		return { isValid: true }
	}

	const availableDayNames = scheduledDays
		.sort()
		.map(dow => weekdayName(dow, 'long'))

	return {
		isValid: false,
		message: `Today is ${weekdayName(todayDow, 'long')}, but this routine is scheduled for ${availableDayNames.join(', ')}`,
		availableDays: availableDayNames,
	}
}

/**
 * Checks if a specific routine day can be started today
 * @param routineDay - The specific routine day to validate
 * @param todayDow - Today's day of week (0=Sun..6=Sat), defaults to current day
 * @returns Object with validation result and message
 */
export const validateRoutineDayDate = (
	routineDay: { dayOfWeek: number } | undefined,
	todayDow: number = getTodayDow(),
): { isValid: boolean; message?: string } => {
	if (!routineDay) {
		return {
			isValid: false,
			message: 'Invalid routine day',
		}
	}

	if (routineDay.dayOfWeek === todayDow) {
		return { isValid: true }
	}

	return {
		isValid: false,
		message: `Today is ${weekdayName(todayDow, 'long')}, but this workout is scheduled for ${weekdayName(routineDay.dayOfWeek, 'long')}`,
	}
}

/**
 * Compact relative time ("3 days ago") for activity and record lists.
 *
 * Uses `Intl.RelativeTimeFormat` so it follows the viewer's locale rather than
 * hand-rolled English strings.
 */
export const formatTimeAgo = (
	value: string | Date,
	now: Date = new Date(),
): string => {
	const date = typeof value === 'string' ? new Date(value) : value
	if (Number.isNaN(date.getTime())) return ''

	const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31_536_000],
		['month', 2_592_000],
		['week', 604_800],
		['day', 86_400],
		['hour', 3_600],
		['minute', 60],
	]

	const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
	for (const [unit, secondsPerUnit] of units) {
		if (Math.abs(seconds) >= secondsPerUnit) {
			return formatter.format(Math.round(seconds / secondsPerUnit), unit)
		}
	}
	return formatter.format(0, 'minute')
}

/**
 * Soonest upcoming occurrence of a routine's scheduled days.
 *
 * Returns the matching `dayOfWeek` and how many days away it is (`0` when the
 * routine trains today), or `null` when the routine has no days configured.
 */
export const nextScheduledDay = (
	routineDays: Array<{ dayOfWeek: number }> | undefined,
	todayDow: number = getTodayDow(),
): { dayOfWeek: number; daysAway: number } | null => {
	if (!routineDays || routineDays.length === 0) return null

	let best: { dayOfWeek: number; daysAway: number } | null = null
	for (const day of routineDays) {
		const daysAway = (((day.dayOfWeek - todayDow) % 7) + 7) % 7
		if (!best || daysAway < best.daysAway) {
			best = { dayOfWeek: day.dayOfWeek, daysAway }
		}
	}
	return best
}

/**
 * Human label for a `nextScheduledDay` result: "Today", "Tomorrow" or the
 * weekday name.
 */
export const describeDaysAway = (
	dayOfWeek: number,
	daysAway: number,
): string => {
	if (daysAway === 0) return 'Today'
	if (daysAway === 1) return 'Tomorrow'
	return weekdayName(dayOfWeek, 'long')
}
