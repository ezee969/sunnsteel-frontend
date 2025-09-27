'use client'

import { useEffect, useMemo } from 'react'
import type { RoutineWizardData } from '../types'
import { getWeekdayFromIsoDate, sortNumbersAscending } from '../utils/date-helpers'

interface UseProgramStartDayParams {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
}

export const useProgramStartDay = ({
	data,
	onUpdate,
}: UseProgramStartDayParams): number | null => {
	const programStartWeekday = useMemo(
		() => getWeekdayFromIsoDate(data.programStartDate),
		[data.programStartDate],
	)

	useEffect(() => {
		if (programStartWeekday === null) {
			return
		}

		if (data.trainingDays.includes(programStartWeekday)) {
			return
		}

		const trainingDays = sortNumbersAscending([
			...data.trainingDays,
			programStartWeekday,
		])

		onUpdate({
			trainingDays,
			days: trainingDays.map((dayOfWeek) => ({
				dayOfWeek,
				exercises:
					data.days.find((day) => day.dayOfWeek === dayOfWeek)?.exercises ?? [],
			})),
		})
	}, [data.days, data.trainingDays, onUpdate, programStartWeekday])

	return programStartWeekday
}
