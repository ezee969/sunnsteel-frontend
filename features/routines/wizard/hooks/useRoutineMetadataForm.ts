'use client'

import { useCallback } from 'react'
import type { RoutineWizardData } from '../types'

interface UseRoutineMetadataFormParams {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

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
