import type { WorkoutSession } from '@/lib/api/types/workout.type'

export const STALE_SESSION_THRESHOLD_MS = 48 * 60 * 60 * 1000

export interface SessionRecoverySummary {
	lastActivityAt: string
	idleMs: number
	completedSets: number
	totalSets: number
}

export function getSessionRecoverySummary(
	session: WorkoutSession | null | undefined,
	nowMs = Date.now(),
): SessionRecoverySummary | null {
	if (!session || session.status !== 'IN_PROGRESS') return null

	const lastActivityAt = session.lastActivityAt ?? session.startedAt
	const lastActivityMs = Date.parse(lastActivityAt)
	if (!Number.isFinite(lastActivityMs)) return null

	const idleMs = Math.max(0, nowMs - lastActivityMs)
	if (idleMs < STALE_SESSION_THRESHOLD_MS) return null

	const plannedSetKeys = new Set(
		(session.routineDay?.exercises ?? []).flatMap(exercise =>
			exercise.sets.map(set => `${exercise.id}:${set.setNumber}`),
		),
	)
	const completedSetKeys = new Set(
		(session.setLogs ?? [])
			.filter(set => set.isCompleted)
			.map(set => `${set.routineExerciseId}:${set.setNumber}`),
	)
	const completedSets = [...plannedSetKeys].filter(key =>
		completedSetKeys.has(key),
	).length

	return {
		lastActivityAt,
		idleMs,
		completedSets,
		totalSets: plannedSetKeys.size,
	}
}
