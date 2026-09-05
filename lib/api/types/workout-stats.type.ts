// Mirrors the backend endpoint DTO until a published contracts release includes it.
export interface WorkoutStats {
	totalCompleted: number
	completionRate: number
	weeklyWorkoutsCount: number
	activeDaysThisWeek: number
}

export interface WorkoutStatsQuery {
	weekStart: string
	weekEnd: string
	timeZone: string
}

export function getWorkoutStatsQuery(now = new Date()): WorkoutStatsQuery {
	const start = new Date(now)
	start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
	start.setHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setDate(end.getDate() + 7)
	return {
		weekStart: start.toISOString(),
		weekEnd: end.toISOString(),
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	}
}
