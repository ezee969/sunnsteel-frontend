import type { WorkoutStatsQuery as ContractWorkoutStatsQuery } from '@sunsteel/contracts'

export type { WorkoutStatsResponse as WorkoutStats } from '@sunsteel/contracts'
export type WorkoutStatsQuery = ContractWorkoutStatsQuery

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
