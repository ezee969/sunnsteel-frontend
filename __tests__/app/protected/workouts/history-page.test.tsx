import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutHistoryPage from '@/app/(protected)/workouts/history/page'
import { createQueryWrapper } from '@/__tests__/utils'

// Mock IntersectionObserver for jsdom
class MockIntersectionObserver {
  root: Element | null
  rootMargin: string
  thresholds: ReadonlyArray<number>
  constructor() {
    this.root = null
    this.rootMargin = ''
    this.thresholds = []
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

// Mocks
vi.mock('@/lib/api/hooks/useWorkoutSession', async () => {
  return {
    useSessions: vi.fn(),
  }
})

vi.mock('@/lib/api/hooks/useRoutines', async () => {
  return {
    useRoutines: vi.fn(),
  }
})

const { useSessions } = await import('@/lib/api/hooks/useWorkoutSession') as unknown as {
  useSessions: ReturnType<typeof vi.fn>
}
const { useRoutines } = await import('@/lib/api/hooks/useRoutines') as unknown as {
  useRoutines: ReturnType<typeof vi.fn>
}

describe('WorkoutHistoryPage', () => {
  beforeEach(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver as any
    useSessions.mockReset()
    useRoutines.mockReset()
  })

  it('renders loading state', () => {
    useSessions.mockReturnValue({ isLoading: true })
    useRoutines.mockReturnValue({ data: [] })

    const Wrapper = createQueryWrapper()
    render(<WorkoutHistoryPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByText(/Loading sessions/i)).toBeInTheDocument()
  })

  it('renders error state', () => {
    useSessions.mockReturnValue({ isLoading: false, isError: true, error: new Error('boom') })
    useRoutines.mockReturnValue({ data: [] })

    const Wrapper = createQueryWrapper()
    render(<WorkoutHistoryPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByRole('alert')).toHaveTextContent('boom')
  })

  it('renders empty state', () => {
    useSessions.mockReturnValue({ isLoading: false, data: { pages: [{ items: [] }] } })
    useRoutines.mockReturnValue({ data: [] })

    const Wrapper = createQueryWrapper()
    render(<WorkoutHistoryPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument()
  })

  it('renders results and supports pagination', async () => {
    const fetchNextPage = vi.fn()
    useSessions.mockReturnValue({
      isLoading: false,
      data: {
        pages: [
          {
            items: [
              {
                id: 's1',
                status: 'COMPLETED',
                startedAt: new Date('2024-03-01T10:00:00Z').toISOString(),
                endedAt: new Date('2024-03-01T10:30:00Z').toISOString(),
                durationSec: 1800,
                totalVolume: 1000,
                totalSets: 12,
                notes: 'Good day',
                routine: { id: 'r1', name: 'Push', dayName: 'Day 1' },
              },
            ],
            nextCursor: 'c2',
          },
        ],
      },
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    })
    useRoutines.mockReturnValue({ data: [{ id: 'r1', name: 'Push' }] })

    const Wrapper = createQueryWrapper()
    render(<WorkoutHistoryPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByText(/Workout History/i)).toBeInTheDocument()
    expect(screen.getByText(/Push · Day 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Duration/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Load more/i }))
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('applies filters and triggers refetch', () => {
    const refetch = vi.fn()
    useSessions.mockReturnValue({ isLoading: false, data: { pages: [{ items: [] }] }, refetch })
    useRoutines.mockReturnValue({ data: [{ id: 'r1', name: 'Push' }] })

    const Wrapper = createQueryWrapper()
    render(<WorkoutHistoryPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // set status to Completed (default is Completed already, tweak another filter)
    fireEvent.change(screen.getByLabelText(/Filter by routine/i), { target: { value: 'r1' } })
    fireEvent.change(screen.getByLabelText(/Search notes/i), { target: { value: 'PR' } })

    fireEvent.click(screen.getByRole('button', { name: /Apply filters/i }))
    expect(refetch).toHaveBeenCalled()
  })
})
