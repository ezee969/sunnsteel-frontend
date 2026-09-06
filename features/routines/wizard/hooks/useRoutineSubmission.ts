'use client'

import { useCallback } from 'react'

import { useCreateRoutine, useUpdateRoutine } from '@/lib/api/hooks'

import type { RoutineWizardData } from '../types'
import { buildRoutineRequest } from '../utils/routine-summary'

interface UseRoutineSubmissionParams {
	data: RoutineWizardData
	routineId?: string
	isEditing: boolean
	onComplete: () => void
}

/**
 * Hook that prepares and sends a routine create or update request, and exposes submission state.
 *
 * Prepares a request payload from the provided wizard data, chooses create or update behavior
 * based on `isEditing`/`routineId`, executes the corresponding mutation, and invokes `onComplete`
 * after the mutation succeeds.
 *
 * @param data - RoutineWizardData used to build the request payload
 * @param routineId - Optional identifier of the routine to update when editing
 * @param isEditing - When true, the hook will perform an update when `routineId` is present; otherwise it will create a new routine
 * @param onComplete - Callback invoked after a successful create or update operation
 * @returns An object containing:
 *  - `submit`: a function that triggers the create or update operation and invokes `onComplete` on success
 *  - `isLoading`: `true` while the active mutation is pending, `false` otherwise
 */
export function useRoutineSubmission({
	data,
	routineId,
	isEditing,
	onComplete,
}: UseRoutineSubmissionParams) {
	const createMutation = useCreateRoutine()
	const updateMutation = useUpdateRoutine()

	const isLoading = isEditing
		? updateMutation.isPending
		: createMutation.isPending

	const submit = useCallback(async () => {
		const payload = buildRoutineRequest(data)

		if (isEditing && routineId) {
			await updateMutation.mutateAsync({ id: routineId, data: payload })
		} else {
			await createMutation.mutateAsync(payload)
		}

		onComplete()
	}, [createMutation, updateMutation, data, isEditing, onComplete, routineId])

	return {
		submit,
		isLoading,
	}
}
