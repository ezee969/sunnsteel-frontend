import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useSession } from '@/lib/api/hooks/useWorkoutSession'
import type { WorkoutSession } from '@/lib/api/types/workout.type'
import {
	buildExerciseGroups,
	type ExerciseGroup,
} from '@/lib/utils/exercise-groups'
import {
	buildSessionMetrics,
	type SessionMetrics,
} from '@/lib/utils/workout-metrics'

interface UseWorkoutSessionDataResult {
	session?: WorkoutSession
	exerciseGroups: ExerciseGroup[]
	metrics: SessionMetrics
	isLoading: boolean
	isError: boolean
	error: unknown
	refetch: () => void
}

export function useWorkoutSessionData(
	sessionId: string | undefined,
): UseWorkoutSessionDataResult {
	const { data, isLoading, isError, error, refetch } = useSession(
		sessionId ?? '',
	)
	const weightUnit = useWeightUnit()
	const t = useTranslations('workout.metrics')
	const locale = useLocale()

	const exerciseGroups = useMemo(() => buildExerciseGroups(data), [data])
	const metrics = useMemo(
		() => buildSessionMetrics(data, weightUnit, t, locale),
		[data, weightUnit, t, locale],
	)

	return {
		session: data,
		exerciseGroups,
		metrics,
		isLoading,
		isError,
		error,
		refetch: () => void refetch(),
	}
}
