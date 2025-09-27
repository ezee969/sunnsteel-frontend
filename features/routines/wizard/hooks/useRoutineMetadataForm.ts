'use client'

import { useCallback } from 'react'
import type { RoutineWizardData } from '../types'

interface UseRoutineMetadataFormParams {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

/**
 * Provides current routine name and description along with stable handlers to update those fields.
 *
 * @param params - The input parameters.
 * @param params.data - Current routine wizard data.
 * @param params.onUpdate - Callback invoked with partial updates to the routine data.
 * @returns An object containing `name`, `description` (defaults to an empty string if unspecified), `handleNameChange(value)` and `handleDescriptionChange(value)` which apply partial updates via `onUpdate`.
 */
export function useRoutineMetadataForm({ data, onUpdate }: UseRoutineMetadataFormParams) {
	const handleNameChange = useCallback(
		(value: string) => {
			onUpdate({ name: value })
		},
		[onUpdate],
	)

	const handleDescriptionChange = useCallback(
		(value: string) => {
			onUpdate({ description: value })
		},
		[onUpdate],
	)

	return {
		name: data.name,
		description: data.description ?? '',
		handleNameChange,
		handleDescriptionChange,
	}
}
