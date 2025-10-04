import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useRoutineSubmission } from '@/features/routines/wizard/hooks/useRoutineSubmission'
import type { RoutineWizardData } from '@/features/routines/wizard/types'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/api/hooks', () => ({
	useCreateRoutine: () => ({ mutateAsync: mockCreate, isPending: false }),
	useUpdateRoutine: () => ({ mutateAsync: mockUpdate, isPending: false }),
}))

const baseData: RoutineWizardData = {
	name: 'Test Routine',
	description: 'Desc',
	trainingDays: [1, 3],
	days: [
		{
			dayOfWeek: 1,
			exercises: [
				{
					exerciseId: 'ex-1',
					progressionScheme: 'NONE',
					minWeightIncrement: 2.5,
					sets: [
						{
							setNumber: 1,
							repType: 'FIXED',
							reps: 10,
						},
					],
					restSeconds: 120,
				},
			],
		},
	],
	programScheduleMode: 'NONE',
	programWithDeloads: false,
	programStartDate: undefined,
	programTimezone: undefined,
	programStartWeek: 1,
}

const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions

describe('useRoutineSubmission', () => {
	beforeEach(() => {
		mockCreate.mockReset()
		mockUpdate.mockReset()
	})

	afterEach(() => {
		Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions
	})

	it('submits create mutation when not editing', async () => {
		const timezone = 'UTC'
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: timezone,
		} as Intl.ResolvedDateTimeFormatOptions)

		const onComplete = vi.fn()
		const { result } = renderHook(() =>
			useRoutineSubmission({ data: baseData, routineId: undefined, isEditing: false, onComplete }),
		)

		expect(result.current.isLoading).toBe(false)

		await act(async () => {
			await result.current.submit()
		})

		expect(mockCreate).toHaveBeenCalledTimes(1)
		expect(mockUpdate).not.toHaveBeenCalled()
		expect(onComplete).toHaveBeenCalled()
		const payload = mockCreate.mock.calls[0][0]
		expect(payload.name).toBe('Test Routine')
	})

	it('submits update mutation when editing', async () => {
		const onComplete = vi.fn()
		const { result } = renderHook(() =>
			useRoutineSubmission({ data: baseData, routineId: 'routine-1', isEditing: true, onComplete }),
		)

		await act(async () => {
			await result.current.submit()
		})

		expect(mockUpdate).toHaveBeenCalledTimes(1)
		expect(mockCreate).not.toHaveBeenCalled()
		expect(mockUpdate.mock.calls[0][0].id).toBe('routine-1')
	})

	it('detects RtF usage when present', async () => {
		const rtfData: RoutineWizardData = {
			...baseData,
			days: [
				{
					dayOfWeek: 1,
					exercises: [
						{
							exerciseId: 'ex-2',
							progressionScheme: 'PROGRAMMED_RTF',
							minWeightIncrement: 2.5,
							programTMKg: 100,
							programRoundingKg: 2.5,
							sets: [
								{ setNumber: 1, repType: 'RANGE', minReps: 1, maxReps: 5 },
							],
							restSeconds: 180,
						},
					],
				},
			],
		}

		const onComplete = vi.fn()
		const { result } = renderHook(() =>
			useRoutineSubmission({ data: rtfData, routineId: undefined, isEditing: false, onComplete }),
		)

		await act(async () => {
			await result.current.submit()
		})

		expect(mockCreate).toHaveBeenCalledTimes(1)
		const payload = mockCreate.mock.calls[0][0]
		expect(payload.programStartDate).toBeUndefined()
	})
})
