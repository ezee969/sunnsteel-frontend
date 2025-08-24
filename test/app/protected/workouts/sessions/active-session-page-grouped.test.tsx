import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// spies
const push = vi.fn()
const back = vi.fn()
const finishMutate = vi.fn()
const upsertMutate = vi.fn()
const deleteMutate = vi.fn()

// base mocks
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'sess-1' }),
  useRouter: () => ({ push, back }),
}))

vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  useSession: () => ({
    data: {
      id: 'sess-1',
      userId: 'u1',
      routineId: 'r1',
      routineDayId: 'rd1',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      setLogs: [
        {
          id: 'l1',
          sessionId: 'sess-1',
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 1,
          reps: 8,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'l2',
          sessionId: 'sess-1',
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 2,
          reps: 8,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    isLoading: false,
    error: undefined,
  }),
  useFinishSession: () => ({
    mutate: finishMutate,
    isPending: false,
  }),
  useUpsertSetLog: () => ({
    mutate: upsertMutate,
    isPending: false,
  }),
  useDeleteSetLog: () => ({
    mutate: deleteMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useRoutine: () => ({
    data: {
      id: 'r1',
      name: 'Routine',
      days: [
        {
          id: 'rd1',
          order: 1,
          exercises: [
            {
              id: 're1',
              order: 2,
              exercise: { id: 'e1', name: 'Bench Press' },
            },
          ],
        },
      ],
    },
  }),
}))

import ActiveSessionPage from '@/app/(protected)/workouts/sessions/[id]/page'

describe('ActiveSessionPage GroupedLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders exercise group title from routine metadata', () => {
    render(<ActiveSessionPage />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('adds next set via + Set and calls upsert with incremented setNumber and exercise meta', () => {
    render(<ActiveSessionPage />)

    const addBtn = screen.getByRole('button', { name: /add set for bench press/i })
    fireEvent.click(addBtn)

    expect(upsertMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        routineExerciseId: 're1',
        exerciseId: 'e1',
        setNumber: 3,
        reps: 0,
        isCompleted: false,
      })
    )
  })
})
