'use client'

import { useCallback, useState } from 'react'
import type { RoutineWizardData } from '../types'
import { sortNumbersAscending } from '../utils/date-helpers'

interface UseTrainingDaySelectionParams {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
	readonly programStartWeekday: number | null
}

export const useTrainingDaySelection = ({
	data,
	onUpdate,
	programStartWeekday,
}: UseTrainingDaySelectionParams) => {
	const [hasInteracted, setHasInteracted] = useState(
		data.trainingDays.length > 0,
	)

	const updateDays = useCallback(
		(nextTrainingDays: number[]) => {
			const sorted = sortNumbersAscending(nextTrainingDays)
			onUpdate({
				trainingDays: sorted,
				days: sorted.map((dayOfWeek) => ({
					dayOfWeek,
					exercises:
						data.days.find((day) => day.dayOfWeek === dayOfWeek)?.exercises ?? [],
				})),
			})
		},
		[data.days, onUpdate],
	)

	const toggleDay = useCallback(
		(dayId: number) => {
			if (programStartWeekday !== null && dayId === programStartWeekday) {
				return
			}

			setHasInteracted(true)

			const isSelected = data.trainingDays.includes(dayId)
			const next = isSelected
				? data.trainingDays.filter((id) => id !== dayId)
				: [...data.trainingDays, dayId]

			updateDays(next)
		},
		[data.trainingDays, programStartWeekday, updateDays],
	)

	const selectSplit = useCallback(
		(splitDays: number[]) => {
			setHasInteracted(true)

			const sameSelection =
				data.trainingDays.length === splitDays.length &&
				data.trainingDays.every((day) => splitDays.includes(day))

			if (sameSelection) {
				onUpdate({ trainingDays: [], days: [] })
				return
			}

			updateDays(splitDays)
		},
		[data.trainingDays, onUpdate, updateDays],
	)

	return {
		hasInteracted,
		toggleDay,
		selectSplit,
	}
}
