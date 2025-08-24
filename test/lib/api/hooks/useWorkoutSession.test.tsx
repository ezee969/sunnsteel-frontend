import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { createQueryWrapper } from '@/test/utils'
import { useDeleteSetLog, useUpsertSetLog } from '@/lib/api/hooks/useWorkoutSession'
import type { WorkoutSession, SetLog } from '@/lib/api/types/workout.type'

vi.mock('@/lib/api/services/workoutService', () => {
  return {
    workoutService: {
      upsertSetLog: vi.fn(),
      deleteSetLog: vi.fn(),
    },
  }
})

import { workoutService } from '@/lib/api/services/workoutService'

const sessionKey = (id: string) => ['workout', 'session', id] as const

const TestComponent: React.FC<{
  onReady: (api: { upsert: ReturnType<typeof useUpsertSetLog>; del: ReturnType<typeof useDeleteSetLog> }) => void
  mode: 'upsert' | 'delete'
  id: string
}> = ({ onReady, mode, id }) => {
  const upsert = useUpsertSetLog(id)
  const del = useDeleteSetLog(id)
  React.useEffect(() => {
    onReady({ upsert, del })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsert.mutateAsync, del.mutateAsync])
  return null
}

describe('useWorkoutSession hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useDeleteSetLog performs optimistic removal and rolls back on error', async () => {
    const id = 'sess-1'
    const initial: WorkoutSession = {
      id,
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
          sessionId: id,
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 1,
          reps: 10,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'l2',
          sessionId: id,
          routineExerciseId: 're1',
          exerciseId: 'e1',
          setNumber: 2,
          reps: 8,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(sessionKey(id), initial)

    const wrapper = createQueryWrapper(client)

    let api: { del: ReturnType<typeof useDeleteSetLog> } | undefined
    render(<TestComponent id={id} mode="delete" onReady={(a) => (api = a)} />, { wrapper })

    // Make delete fail
    vi.mocked(workoutService.deleteSetLog).mockRejectedValueOnce(new Error('network'))

    // Call delete and expect failure
    await expect(
      api!.del.mutateAsync({ routineExerciseId: 're1', setNumber: 1 })
    ).rejects.toThrow()

    // After onError rollback, original two logs should be present
    const after = client.getQueryData<WorkoutSession>(sessionKey(id))
    expect(after?.setLogs?.map((l) => l.id)).toEqual(['l1', 'l2'])
  })

  it('useDeleteSetLog keeps optimistic removal when success (until invalidation refetch)', async () => {
    const id = 'sess-2'
    const log: SetLog = {
      id: 'l1',
      sessionId: id,
      routineExerciseId: 're1',
      exerciseId: 'e1',
      setNumber: 1,
      reps: 10,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const initial: WorkoutSession = {
      id,
      userId: 'u1',
      routineId: 'r1',
      routineDayId: 'rd1',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      setLogs: [log],
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(sessionKey(id), initial)
    const wrapper = createQueryWrapper(client)

    let api: { del?: ReturnType<typeof useDeleteSetLog> } = {}
    render(<TestComponent id={id} mode="delete" onReady={(a) => (api = a)} />, { wrapper })

    vi.mocked(workoutService.deleteSetLog).mockResolvedValueOnce({ id: 'l1' })

    await api!.del.mutateAsync({ routineExerciseId: 're1', setNumber: 1 })

    // Optimistic state should have removed it
    const after = client.getQueryData<WorkoutSession>(sessionKey(id))
    expect(after?.setLogs?.length).toBe(0)
  })

  it('useUpsertSetLog invalidates the session query on success', async () => {
    const id = 'sess-3'
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = vi.spyOn(client, 'invalidateQueries')
    const wrapper = createQueryWrapper(client)

    let api: { upsert: ReturnType<typeof useUpsertSetLog> } | undefined
    render(<TestComponent id={id} mode="upsert" onReady={(a) => (api = a)} />, { wrapper })

    vi.mocked(workoutService.upsertSetLog).mockResolvedValueOnce({
      id: 'nl1',
      sessionId: id,
      routineExerciseId: 're2',
      exerciseId: 'e2',
      setNumber: 1,
      reps: 5,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await api!.upsert.mutateAsync({ routineExerciseId: 're2', exerciseId: 'e2', setNumber: 1, reps: 5 })

    expect(spy).toHaveBeenCalledWith({ queryKey: sessionKey(id) })
  })
})
