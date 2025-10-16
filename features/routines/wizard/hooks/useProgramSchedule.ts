'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RoutineWizardData } from '../types'
import {
	formatWizardDate,
	parseWizardDate,
	parseDateInput,
} from '../utils/date'

type ProgramScheduleMode = NonNullable<RoutineWizardData['programScheduleMode']>

interface UseProgramScheduleParams {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
}

export function useProgramSchedule({ data, onUpdate }: UseProgramScheduleParams) {
	const [isCalendarOpen, setCalendarOpen] = useState(false)

	const selectedDate = useMemo(() => parseWizardDate(data.programStartDate), [data.programStartDate])

	// Auto-populate system timezone when TIMEFRAME mode is active and no timezone is set
	useEffect(() => {
		if (data.programScheduleMode !== 'TIMEFRAME') return
		const tz = (data.programTimezone ?? '').trim()
		if (tz.length > 0) return
		
		const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (browserTz) {
			onUpdate({ programTimezone: browserTz })
		}
	}, [data.programScheduleMode, data.programTimezone, onUpdate])

	const handleModeChange = useCallback(
		(mode: ProgramScheduleMode) => {
			const next: Partial<RoutineWizardData> = {
				programScheduleMode: mode,
			}
			if (mode === 'NONE') {
				next.programStartDate = undefined
				next.programTimezone = undefined
			} else if (mode === 'TIMEFRAME') {
				// Auto-set system timezone when switching to TIMEFRAME mode
				if (!data.programTimezone?.trim()) {
					const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
					if (browserTz) {
						next.programTimezone = browserTz
					}
				}
			}
			onUpdate(next)
		},
		[onUpdate, data.programTimezone],
	)

	const handleDateSelect = useCallback(
		(date?: Date) => {
			if (!date) {
				onUpdate({ programStartDate: undefined })
				setCalendarOpen(false)
				return
			}

			onUpdate({ programStartDate: formatWizardDate(date) })
			setCalendarOpen(false)
		},
		[onUpdate],
	)

	const handleDateInputChange = useCallback(
		(value: string) => {
			const parsed = parseDateInput(value)
			onUpdate({ programStartDate: parsed ? formatWizardDate(parsed) : undefined })
		},
		[onUpdate],
	)

	return {
		selectedDate,
		isCalendarOpen,
		setCalendarOpen,
		handleModeChange,
		handleDateSelect,
		handleDateInputChange,
	}
}
