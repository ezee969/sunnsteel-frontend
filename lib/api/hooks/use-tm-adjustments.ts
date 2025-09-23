import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TmAdjustmentService } from '../services/tm-adjustment.service'
import {
	CreateTmEventRequest,
	TmEventResponse,
	GetTmAdjustmentsParams,
} from '../types/tm-adjustment.types'

/**
 * Query key factory for TM adjustments
 */
export const tmAdjustmentKeys = {
	all: ['tm-adjustments'] as const,
	routines: () => [...tmAdjustmentKeys.all, 'routines'] as const,
	routine: (routineId: string) => [...tmAdjustmentKeys.routines(), routineId] as const,
	adjustments: (routineId: string, params?: GetTmAdjustmentsParams) => 
		[...tmAdjustmentKeys.routine(routineId), 'adjustments', params] as const,
	summary: (routineId: string) => 
		[...tmAdjustmentKeys.routine(routineId), 'summary'] as const,
}

/**
 * Hook to get TM adjustments for a routine with optional filtering
 */
export const useGetTmAdjustments = (
	routineId: string,
	params?: GetTmAdjustmentsParams,
	options?: {
		enabled?: boolean
	}
) => {
	return useQuery({
		queryKey: tmAdjustmentKeys.adjustments(routineId, params),
		queryFn: () => TmAdjustmentService.getTmAdjustments(routineId, params),
		enabled: options?.enabled ?? !!routineId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}

/**
 * Hook to get TM adjustment summary for a routine
 */
export const useGetTmAdjustmentSummary = (
	routineId: string,
	options?: {
		enabled?: boolean
	}
) => {
	return useQuery({
		queryKey: tmAdjustmentKeys.summary(routineId),
		queryFn: () => TmAdjustmentService.getTmAdjustmentSummary(routineId),
		enabled: options?.enabled ?? !!routineId,
		staleTime: 10 * 60 * 1000, // 10 minutes - summaries change less frequently
	})
}

/**
 * Hook to create a TM adjustment
 */
export const useCreateTmAdjustment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ routineId, data }: { routineId: string; data: CreateTmEventRequest }) =>
			TmAdjustmentService.createTmAdjustment(routineId, data),
		onSuccess: (newAdjustment: TmEventResponse) => {
			const { routineId } = newAdjustment

			// Invalidate all TM adjustment queries for this routine
			queryClient.invalidateQueries({
				queryKey: tmAdjustmentKeys.routine(routineId),
			})

			// Optionally, update the cache directly for immediate feedback
			queryClient.setQueryData<TmEventResponse[]>(
				tmAdjustmentKeys.adjustments(routineId),
				(oldData) => {
					if (!oldData) return [newAdjustment]
					return [newAdjustment, ...oldData]
				}
			)
		},
		onError: (error) => {
			console.error('Failed to create TM adjustment:', error)
		},
	})
}

/**
 * Hook to check if a routine supports TM adjustments
 */
export const useCanCreateTmAdjustment = (routine?: { 
	progressionScheme?: string 
	days?: Array<{ exercises?: Array<{ progressionScheme?: string }> }> 
}) => {
	if (!routine) return false

	// Check if any exercise uses PROGRAMMED_RTF
	const hasRtfExercise = routine.days?.some(day => 
		day.exercises?.some(exercise => 
			exercise.progressionScheme === 'PROGRAMMED_RTF'
		)
	)

	return hasRtfExercise
}