import { useMemo } from 'react'
import { useSession } from '@/lib/api/hooks/useWorkoutSession'
import type { WorkoutSession } from '@/lib/api/types/workout.type'
import { buildExerciseGroups, type ExerciseGroup } from '@/lib/utils/exercise-groups'
import { buildSessionMetrics, type SessionMetrics } from '@/lib/utils/workout-metrics'

interface UseWorkoutSessionDataResult {
	session?: WorkoutSession
	exerciseGroups: ExerciseGroup[]
	metrics: SessionMetrics
	isLoading: boolean
	isError: boolean
	error: unknown
}

export function useWorkoutSessionData(sessionId: string | undefined): UseWorkoutSessionDataResult {
	const { data, isLoading, isError, error } = useSession(sessionId ?? '')

	const exerciseGroups = useMemo(() => buildExerciseGroups(data), [data])
	const metrics = useMemo(() => buildSessionMetrics(data), [data])

	return {
		session: data,
		exerciseGroups,
		metrics,
		isLoading,
		isError,
		error,
	}
}
