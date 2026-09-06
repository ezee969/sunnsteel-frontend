/**
 * Shapes for `GET /workouts/progress`.
 *
 * Declared locally rather than re-exported from `@sunsteel/contracts` because
 * that package ships from the npm registry, so a shared type would need a
 * published release first. Mirror of `workout-progress.types.ts` on the
 * backend — move both into contracts on the next version bump.
 */

export interface PersonalRecordEntry {
	exerciseId: string
	exerciseName: string
	weight: number
	reps: number
	estimated1rm: number
	achievedAt: string
}

export interface RecentActivityEntry {
	sessionId: string
	routineId: string
	routineName: string
	dayName: string
	startedAt: string
	endedAt: string | null
	durationSec: number | null
	totalVolumeKg: number
	completedSets: number
}

export interface WorkoutProgress {
	totalVolumeKg: number
	currentStreakDays: number
	bestStreakDays: number
	personalRecords: PersonalRecordEntry[]
	recentActivity: RecentActivityEntry[]
}

export interface WorkoutProgressQuery {
	timeZone: string
}

export function getWorkoutProgressQuery(): WorkoutProgressQuery {
	return { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
}
