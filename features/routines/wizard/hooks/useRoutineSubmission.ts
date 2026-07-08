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
