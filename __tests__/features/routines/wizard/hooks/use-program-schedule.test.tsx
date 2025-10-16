import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { useProgramSchedule } from '@/features/routines/wizard/hooks/useProgramSchedule'
import type { RoutineWizardData } from '@/features/routines/wizard/types'
import { formatWizardDate } from '@/features/routines/wizard/utils/date'

describe('useProgramSchedule', () => {
	const baseData: RoutineWizardData = {
		name: 'Test routine',
		description: 'desc',
		trainingDays: [],
		days: [],
		programScheduleMode: 'NONE',
		programStartDate: undefined,
		programTimezone: undefined,
		programStartWeek: 1,
		programWithDeloads: false,
	}

	it('auto-detects timezone when switching to timeframe without timezone', async () => {
		const onUpdate = vi.fn()
		const timezone = 'America/New_York'
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: timezone,
		} as Intl.ResolvedDateTimeFormatOptions)

		renderHook(() =>
			useProgramSchedule({
				data: { ...baseData, programScheduleMode: 'TIMEFRAME', programTimezone: undefined },
				onUpdate,
			}),
		)

		await waitFor(() => {
			expect(onUpdate).toHaveBeenCalledWith({ programTimezone: timezone })
		})
	})

	it('auto-sets system timezone when switching to TIMEFRAME mode', () => {
		const onUpdate = vi.fn()
		const timezone = 'America/Los_Angeles'
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: timezone,
		} as Intl.ResolvedDateTimeFormatOptions)

		const { result } = renderHook(() =>
			useProgramSchedule({
				data: { ...baseData, programScheduleMode: 'NONE' },
				onUpdate,
			}),
		)

		act(() => {
			result.current.handleModeChange('TIMEFRAME')
		})

		expect(onUpdate).toHaveBeenCalledWith({
			programScheduleMode: 'TIMEFRAME',
			programTimezone: timezone,
		})
	})

	it('clears start date and timezone when switching to NONE', () => {
		const onUpdate = vi.fn()
		const { result } = renderHook(() =>
			useProgramSchedule({
				data: { 
					...baseData, 
					programScheduleMode: 'TIMEFRAME', 
					programStartDate: '2025-10-01',
					programTimezone: 'America/New_York',
				},
				onUpdate,
			}),
		)

		act(() => {
			result.current.handleModeChange('NONE')
		})

		expect(onUpdate).toHaveBeenCalledWith({
			programScheduleMode: 'NONE',
			programStartDate: undefined,
			programTimezone: undefined,
		})
	})

	it('preserves existing timezone when switching to TIMEFRAME', () => {
		const onUpdate = vi.fn()
		const existingTimezone = 'Europe/London'
		const { result } = renderHook(() =>
			useProgramSchedule({
				data: { 
					...baseData, 
					programScheduleMode: 'NONE',
					programTimezone: existingTimezone,
				},
				onUpdate,
			}),
		)

		act(() => {
			result.current.handleModeChange('TIMEFRAME')
		})

		expect(onUpdate).toHaveBeenCalledWith({
			programScheduleMode: 'TIMEFRAME',
			// Should NOT include programTimezone since it already exists
		})
		expect(onUpdate).not.toHaveBeenCalledWith(
			expect.objectContaining({ programTimezone: expect.anything() })
		)
	})

	it('formats selected date via handleDateSelect', () => {
		const onUpdate = vi.fn()
		const { result } = renderHook(() =>
			useProgramSchedule({ data: baseData, onUpdate }),
		)
		const date = new Date('2025-12-24')

		act(() => {
			result.current.handleDateSelect(date)
		})

		expect(onUpdate).toHaveBeenLastCalledWith({
			programStartDate: formatWizardDate(date),
		})
		expect(result.current.isCalendarOpen).toBe(false)
	})

	it('handles manual date input change', () => {
		const onUpdate = vi.fn()
		const { result } = renderHook(() =>
			useProgramSchedule({ data: baseData, onUpdate }),
		)

		act(() => {
			result.current.handleDateInputChange('2025-09-30')
		})

		expect(onUpdate).toHaveBeenCalledWith({ programStartDate: '2025-09-30' })
	})

	it('clears date when handleDateSelect receives undefined', () => {
		const onUpdate = vi.fn()
		const { result } = renderHook(() =>
			useProgramSchedule({ data: baseData, onUpdate }),
		)

		act(() => {
			result.current.handleDateSelect(undefined)
		})

		expect(onUpdate).toHaveBeenCalledWith({ programStartDate: undefined })
		expect(result.current.isCalendarOpen).toBe(false)
	})
})
