import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCreateTmAdjustment, useCanCreateTmAdjustment, tmAdjustmentKeys } from '@/lib/api/hooks/use-tm-adjustments'
import { TmAdjustmentService } from '@/lib/api/services/tm-adjustment.service'

// Mock the TM adjustment service
vi.mock('@/lib/api/services/tm-adjustment.service', () => ({
	TmAdjustmentService: {
		createTmAdjustment: vi.fn(),
		getTmAdjustments: vi.fn(),
		getTmAdjustmentSummary: vi.fn(),
	},
}))

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	})

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('TM Adjustment Hooks', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('tmAdjustmentKeys', () => {
		it('should generate correct query keys', () => {
			expect(tmAdjustmentKeys.all).toEqual(['tm-adjustments'])
			expect(tmAdjustmentKeys.routines()).toEqual(['tm-adjustments', 'routines'])
			expect(tmAdjustmentKeys.routine('routine-123')).toEqual(['tm-adjustments', 'routines', 'routine-123'])
			expect(tmAdjustmentKeys.adjustments('routine-123', { exerciseId: 'ex-456' })).toEqual([
				'tm-adjustments', 'routines', 'routine-123', 'adjustments', { exerciseId: 'ex-456' }
			])
			expect(tmAdjustmentKeys.summary('routine-123')).toEqual([
				'tm-adjustments', 'routines', 'routine-123', 'summary'
			])
		})
	})

	describe('useCreateTmAdjustment', () => {
		it('should create TM adjustment successfully', async () => {
			const mockAdjustment = {
				id: 'adjustment-123',
				routineId: 'routine-456',
				exerciseId: 'exercise-789',
				exerciseName: 'Bench Press',
				weekNumber: 3,
				deltaKg: 2.5,
				preTmKg: 100,
				postTmKg: 102.5,
				reason: 'Good progress',
				style: 'STANDARD' as const,
				createdAt: '2025-09-23T12:00:00.000Z'
			}

			vi.mocked(TmAdjustmentService.createTmAdjustment).mockResolvedValue(mockAdjustment)

			const { result } = renderHook(() => useCreateTmAdjustment(), {
				wrapper: createWrapper(),
			})

			const createData = {
				exerciseId: 'exercise-789',
				weekNumber: 3,
				deltaKg: 2.5,
				preTmKg: 100,
				postTmKg: 102.5,
				reason: 'Good progress'
			}

			result.current.mutate({
				routineId: 'routine-456',
				data: createData
			})

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true)
			})

			expect(TmAdjustmentService.createTmAdjustment).toHaveBeenCalledWith('routine-456', createData)
			expect(result.current.data).toEqual(mockAdjustment)
		})

		it('should handle creation errors', async () => {
			const error = new Error('Failed to create adjustment')
			vi.mocked(TmAdjustmentService.createTmAdjustment).mockRejectedValue(error)

			const { result } = renderHook(() => useCreateTmAdjustment(), {
				wrapper: createWrapper(),
			})

			result.current.mutate({
				routineId: 'routine-456',
				data: {
					exerciseId: 'exercise-789',
					weekNumber: 3,
					deltaKg: 2.5,
					preTmKg: 100,
					postTmKg: 102.5,
				}
			})

			await waitFor(() => {
				expect(result.current.isError).toBe(true)
			})

			expect(result.current.error).toEqual(error)
		})
	})

	describe('useCanCreateTmAdjustment', () => {
		it('should return true for routines with RTF exercises', () => {
			const routine = {
				days: [
					{
						exercises: [
							{ progressionScheme: 'PROGRAMMED_RTF' },
							{ progressionScheme: 'DOUBLE_PROGRESSION' }
						]
					},
					{
						exercises: [
							{ progressionScheme: 'NONE' }
						]
					}
				]
			}

			const { result } = renderHook(() => useCanCreateTmAdjustment(routine))
			expect(result.current).toBe(true)
		})

		it('should return false for routines without RTF exercises', () => {
			const routine = {
				days: [
					{
						exercises: [
							{ progressionScheme: 'DOUBLE_PROGRESSION' },
							{ progressionScheme: 'NONE' }
						]
					}
				]
			}

			const { result } = renderHook(() => useCanCreateTmAdjustment(routine))
			expect(result.current).toBe(false)
		})

		it('should return false for undefined routine', () => {
			const { result } = renderHook(() => useCanCreateTmAdjustment(undefined))
			expect(result.current).toBe(false)
		})

		it('should return false for routine with no days', () => {
			const routine = { days: [] }

			const { result } = renderHook(() => useCanCreateTmAdjustment(routine))
			expect(result.current).toBe(false)
		})
	})
})