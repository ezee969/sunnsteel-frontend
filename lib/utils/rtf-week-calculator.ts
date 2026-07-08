/**
 * RtF Week Calculator Utility
 * 
 * Calculates the current program week for RtF routines based on program start date
 * and timezone. This matches the backend logic in workouts.service.ts.
 */

/**
 * Calculate the difference in days between two dates in a specific timezone
 */
function diffLocalDays(today: Date, startDate: Date, timeZone: string): number {
	// Convert both dates to the target timezone and get their local date parts
	const todayLocal = new Intl.DateTimeFormat('en-CA', { 
		timeZone, 
		year: 'numeric', 
		month: '2-digit', 
		day: '2-digit' 
	}).format(today)
	
	const startLocal = new Intl.DateTimeFormat('en-CA', { 
		timeZone, 
		year: 'numeric', 
		month: '2-digit', 
		day: '2-digit' 
	}).format(startDate)
	
	// Parse the formatted dates back to Date objects (in UTC)
	const todayUTC = new Date(`${todayLocal}T00:00:00.000Z`)
	const startUTC = new Date(`${startLocal}T00:00:00.000Z`)
	
	// Calculate difference in milliseconds and convert to days
	const diffMs = todayUTC.getTime() - startUTC.getTime()
	return Math.floor(diffMs / (24 * 60 * 60 * 1000))
}

/**
 * Calculate the current program week for an RtF routine
 * 
 * @param programStartDate - The program start date (Date object or ISO string)
 * @param programDurationWeeks - Total duration of the program in weeks
 * @param timeZone - IANA timezone string (e.g., 'America/New_York')
 * @param today - Current date (defaults to new Date())
 * @returns Current program week (1-based, clamped to program duration)
 */
export function getCurrentProgramWeek(
	programStartDate: Date | string,
	programDurationWeeks: number,
	timeZone: string,
	today: Date = new Date()
): number {
	const startDate = typeof programStartDate === 'string' 
		? new Date(programStartDate) 
		: programStartDate
	
	const diffDays = diffLocalDays(today, startDate, timeZone)
	const week = Math.floor(diffDays / 7) + 1
	
	// Clamp to valid range
	if (week < 1) return 1
	if (week > programDurationWeeks) return programDurationWeeks
	
	return week
}

/**
 * Check if a given week is a deload week in RtF programs
 * 
 * @param week - The week number (1-based)
 * @param withDeloads - Whether the program includes deload weeks
 * @returns True if the week is a deload week
 */
export function isDeloadWeek(week: number, withDeloads: boolean): boolean {
	if (!withDeloads) return false
	
	// Deload weeks are 7, 14, and 21 in programs with deloads
	return week === 7 || week === 14 || week === 21
}

/**
 * Canonical RtF progression scheme identifiers. This is the single source of
 * truth for the underlying string comparisons — other modules (e.g. the
 * routine wizard's progression helpers) delegate to the functions below
 * rather than re-declaring these literals.
 */
export const RTF_STANDARD_SCHEME = 'PROGRAMMED_RTF'
export const RTF_HYPERTROPHY_SCHEME = 'PROGRAMMED_RTF_HYPERTROPHY'

/**
 * Check if a progression scheme is the standard RtF variant
 */
export function isRtfStandardScheme(progressionScheme: string): boolean {
	return progressionScheme === RTF_STANDARD_SCHEME
}

/**
 * Check if a progression scheme is the hypertrophy RtF variant
 */
export function isRtfHypertrophyScheme(progressionScheme: string): boolean {
	return progressionScheme === RTF_HYPERTROPHY_SCHEME
}

/**
 * Get RtF variant from progression scheme
 *
 * @param progressionScheme - The progression scheme string
 * @returns RtF variant ('STANDARD' | 'HYPERTROPHY') or null if not RtF
 */
export function getRtfVariant(progressionScheme: string): 'STANDARD' | 'HYPERTROPHY' | null {
	if (isRtfStandardScheme(progressionScheme)) return 'STANDARD'
	if (isRtfHypertrophyScheme(progressionScheme)) return 'HYPERTROPHY'
	return null
}

/**
 * Check if a progression scheme is RtF-based (either variant)
 *
 * @param progressionScheme - The progression scheme string
 * @returns True if the scheme is RtF-based
 */
export function isRtfProgressionScheme(progressionScheme: string): boolean {
	return isRtfStandardScheme(progressionScheme) || isRtfHypertrophyScheme(progressionScheme)
}