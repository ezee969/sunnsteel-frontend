import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSessionManagement } from '@/hooks/use-session-management'
import { calculateSessionProgress, areAllSetsCompleted } from '@/lib/utils/session-progress.utils'
import { SESSION_STATUS } from '@/lib/constants/session.constants'
import { vi } from 'vitest'

// Mock the utility functions used by the hook
vi.mock('@/lib/utils/session-progress.utils', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    calculateSessionProgress: vi.fn(),
    areAllSetsCompleted: vi.fn(),
  }
})

// Mock the API hook module; configure implementation in beforeEach
vi.mock('@/lib/api/hooks')
import { useFinishSession } from '@/lib/api/hooks'
const mockUseFinishSession = useFinishSession as unknown as vi.Mock
const mockMutate = vi.fn((payload: { status: string }, opts?: { onSuccess?: () => void; onError?: (err: any) => void }) => {
  opts?.onSuccess?.()
})

const mockCalculateSessionProgress = calculateSessionProgress as vi.MockedFunction<typeof calculateSessionProgress>
const mockAreAllSetsCompleted = areAllSetsCompleted as vi.MockedFunction<typeof areAllSetsCompleted>

// Mock data
const mockSession = {
  id: 'session-1',
  routineId: 'routine-1',
  routineDayId: 'day-1',
  status: 'IN_PROGRESS' as const,
  startedAt: '2024-01-01T10:00:00Z',
  setLogs: [
    {
      id: 'log-1',
      routineExerciseId: 'exercise-1',
      setNumber: 1,
      reps: 10,
      weight: 100,
      isCompleted: true,
    },
    {
      id: 'log-2',
      routineExerciseId: 'exercise-1',
      setNumber: 2,
      reps: 8,
      weight: 100,
      isCompleted: false,
    },
  ],
}

const mockRoutine = {
  id: 'routine-1',
  name: 'Test Routine',
  days: [
    {
      id: 'day-1',
      name: 'Day 1',
      exercises: [
        {
          id: 'exercise-1',
          exerciseId: 'ex-1',
          sets: 3,
          reps: 10,
          weight: 100,
          restTimeSec: 120,
          exercise: {
            id: 'ex-1',
            name: 'Bench Press',
          },
        },
      ],
    },
  ],
}

// mutate function is provided via mocked useFinishSession

// React Query wrapper for hook tests
function makeWrapper() {
  const queryClient = new QueryClient()
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function renderHookWithProvider<TProps>(
  callback: (props?: TProps) => any,
  options?: { initialProps?: TProps }
) {
  const wrapper = makeWrapper()
  return renderHook(callback as any, { wrapper, ...(options || {}) })
}

describe('useSessionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalculateSessionProgress.mockReturnValue({
      completedSets: 1,
      totalSets: 3,
      percentage: 33,
    })
    mockAreAllSetsCompleted.mockReturnValue(true)
    mockMutate.mockImplementation((_, opts) => {
      opts?.onSuccess?.()
    })
    mockUseFinishSession.mockReturnValue({ mutate: mockMutate, isPending: false })
  })

  it('should initialize with default state', () => {
    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    expect(result.current.isConfirmingFinish).toBe(false)
    expect(result.current.isFinishing).toBe(false)
    expect(result.current.progressData).toEqual({
      completedSets: 1,
      totalSets: 3,
      percentage: 33,
    })
  })

  it('should calculate progress data correctly', () => {
    renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    expect(mockCalculateSessionProgress).toHaveBeenCalledWith(
      mockSession.setLogs,
      mockRoutine.days[0].exercises
    )
  })

  it('should handle finish attempt when session is complete', async () => {
    mockAreAllSetsCompleted.mockReturnValue(true)

    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    await act(async () => {
      await result.current.handleFinishAttempt(SESSION_STATUS.COMPLETED)
    })

    expect(mockMutate).toHaveBeenCalledWith(
      { status: SESSION_STATUS.COMPLETED },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
    expect(result.current.isConfirmingFinish).toBe(false)
  })

  it('should show confirmation dialog when session is incomplete', async () => {
    mockAreAllSetsCompleted.mockReturnValue(false)

    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    await act(async () => {
      await result.current.handleFinishAttempt(SESSION_STATUS.COMPLETED)
    })

    expect(result.current.isConfirmingFinish).toBe(true)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('should execute finish when confirmed', async () => {
    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    // First set confirming state
    act(() => {
      mockAreAllSetsCompleted.mockReturnValue(false)
      result.current.handleFinishAttempt(SESSION_STATUS.COMPLETED)
    })

    // Then execute finish
    await act(async () => {
      await result.current.executeFinish(SESSION_STATUS.COMPLETED)
    })

    expect(result.current.isFinishing).toBe(false)
    expect(result.current.isConfirmingFinish).toBe(false)
    expect(mockMutate).toHaveBeenCalledWith(
      { status: SESSION_STATUS.COMPLETED },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('should cancel finish confirmation', () => {
    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    // Set confirming state
    act(() => {
      mockAreAllSetsCompleted.mockReturnValue(false)
      result.current.handleFinishAttempt(SESSION_STATUS.COMPLETED)
    })

    // Cancel confirmation
    act(() => {
      result.current.cancelFinish()
    })

    expect(result.current.isConfirmingFinish).toBe(false)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('should handle missing routine gracefully', () => {
    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: null,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    expect(result.current.progressData).toEqual({
      completedSets: 0,
      totalSets: 0,
      percentage: 0,
    })
  })

  it('should handle missing session gracefully', () => {
    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: undefined,
        setLogs: undefined,
      })
    )

    expect(result.current.progressData).toEqual({
      completedSets: 0,
      totalSets: 0,
      percentage: 0,
    })
  })

  it('should update progress when session or routine changes', () => {
    const { result, rerender } = renderHookWithProvider(
      ({ setLogs, routine }) =>
        useSessionManagement({
          sessionId: mockSession.id,
          routine,
          routineDayId: mockSession.routineDayId,
          setLogs,
        }),
      {
        initialProps: {
          setLogs: mockSession.setLogs,
          routine: mockRoutine,
        },
      }
    )

    // Initial call
    expect(mockCalculateSessionProgress).toHaveBeenCalledTimes(1)

    // Update session
    const updatedSetLogs = [
      ...mockSession.setLogs,
      {
        id: 'log-3',
        routineExerciseId: 'exercise-1',
        setNumber: 3,
        reps: 12,
        weight: 100,
        isCompleted: true,
      },
    ]

    rerender({
      setLogs: updatedSetLogs,
      routine: mockRoutine,
    })

    // Should recalculate progress
    expect(mockCalculateSessionProgress).toHaveBeenCalledTimes(2)
    expect(mockCalculateSessionProgress).toHaveBeenLastCalledWith(
      updatedSetLogs,
      mockRoutine.days[0].exercises
    )
  })

  it('should handle finish session errors gracefully', async () => {
    const mockError = new Error('Network error')
    mockMutate.mockImplementationOnce((_, opts) => {
      opts?.onError?.(mockError)
    })

    const { result } = renderHookWithProvider(() =>
      useSessionManagement({
        sessionId: mockSession.id,
        routine: mockRoutine,
        routineDayId: mockSession.routineDayId,
        setLogs: mockSession.setLogs,
      })
    )

    await act(async () => {
      await result.current.executeFinish(SESSION_STATUS.COMPLETED)
    })

    // Should reset finishing state even on error
    expect(result.current.isFinishing).toBe(false)
    expect(result.current.isConfirmingFinish).toBe(false)
  })
})
