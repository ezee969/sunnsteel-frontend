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

/**
 * Manage program schedule state and provide handlers used by the routine wizard.
 *
 * This hook derives the currently selected start date from `data.programStartDate`, tracks calendar visibility, and exposes handlers to change the schedule mode, select or parse a start date, and toggle the calendar. When the schedule mode is `TIMEFRAME` and `programTimezone` is empty, it will populate `programTimezone` with the browser time zone.
 *
 * @param data - Routine wizard data containing schedule-related fields
 * @param onUpdate - Callback to apply partial updates to the wizard data
 * @returns An object with:
 *  - `selectedDate`: the parsed start `Date` or `undefined` if not set
 *  - `isCalendarOpen`: whether the calendar UI is open
 *  - `setCalendarOpen`: setter to open or close the calendar
 *  - `handleModeChange`: updates `programScheduleMode` (clears `programStartDate` when set to `'NONE'`)
 *  - `handleDateSelect`: sets `programStartDate` to the chosen date (formatted) or clears it when no date is provided, and closes the calendar
 *  - `handleDateInputChange`: parses a date string and updates `programStartDate` with a formatted date or clears it if parsing fails
 */
export function useProgramSchedule({ data, onUpdate }: UseProgramScheduleParams) {
	const [isCalendarOpen, setCalendarOpen] = useState(false)

	const selectedDate = useMemo(() => parseWizardDate(data.programStartDate), [data.programStartDate])

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
			}
			onUpdate(next)
		},
		[onUpdate],
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
