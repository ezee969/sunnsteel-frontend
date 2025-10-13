import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'

vi.mock('@/lib/api/services/workoutService', () => ({
	workoutService: {
		getActiveSession: vi.fn(async () => undefined),
		startSession: vi.fn(async () => { throw new Error('STATUS:400:weekday mismatch') }),
	}
}))

const pushMock = vi.fn()
vi.mock('@/components/ui/toast', async () => {
	return {
		useToast: () => ({ push: pushMock })
	}
})

const createWrapper = () => {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
	const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
		<QueryClientProvider client={qc}>{children}</QueryClientProvider>
	)
	return Wrapper
}

describe('useStartSession error handling', () => {
	beforeEach(() => {
		pushMock.mockReset()
	})

	it('maps weekday mismatch 400 to friendly message', async () => {
		const { result } = renderHook(() => useStartSession(), { wrapper: createWrapper() })
		await act(async () => {
			await expect(result.current.mutateAsync({ routineId: 'r1', routineDayId: 'd1' })).rejects.toThrow()
		})
		expect(pushMock).toHaveBeenCalled()
		const call = pushMock.mock.calls.at(-1)![0]
		expect(call.title).toBe('Cannot start session')
		expect(call.description).toMatch(/first training weekday/i)
	})

	it('maps missing program fields to friendly message', async () => {
		const { workoutService } = await import('@/lib/api/services/workoutService')
		;(workoutService.startSession as any).mockImplementationOnce(async () => {
			throw new Error('STATUS:400:missing program timezone')
		})
		const { result } = renderHook(() => useStartSession(), { wrapper: createWrapper() })
		await act(async () => {
			await expect(result.current.mutateAsync({ routineId: 'r1', routineDayId: 'd1' })).rejects.toThrow()
		})
		const call = pushMock.mock.calls.at(-1)![0]
		expect(call.description).toMatch(/add start date and timezone/i)
	})

	it('maps week out of range to friendly message', async () => {
		const { workoutService } = await import('@/lib/api/services/workoutService')
		;(workoutService.startSession as any).mockImplementationOnce(async () => {
			throw new Error('STATUS:400:week out of range')
		})
		const { result } = renderHook(() => useStartSession(), { wrapper: createWrapper() })
		await act(async () => {
			await expect(result.current.mutateAsync({ routineId: 'r1', routineDayId: 'd1' })).rejects.toThrow()
		})
		const call = pushMock.mock.calls.at(-1)![0]
		expect(call.description).toMatch(/valid range/i)
	})
})
