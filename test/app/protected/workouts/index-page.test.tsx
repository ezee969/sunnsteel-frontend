import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkoutsIndexPage from '@/app/(protected)/workouts/page'
import { createQueryWrapper } from '@/test/utils'

// Mocks that we will control per test
const replaceMock = vi.fn()

vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ replace: replaceMock }),
  }
})

vi.mock('@/lib/api/hooks/useWorkoutSession', async () => {
  return {
    useActiveSession: vi.fn(),
  }
})

const { useActiveSession } = await import('@/lib/api/hooks/useWorkoutSession') as unknown as {
  useActiveSession: ReturnType<typeof vi.fn>
}

describe('WorkoutsIndexPage', () => {
  beforeEach(() => {
    replaceMock.mockReset()
  })

  it('shows loading state', () => {
    useActiveSession.mockReturnValue({ data: null, isLoading: true })

    const Wrapper = createQueryWrapper()
    render(<WorkoutsIndexPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByText(/Loading your workouts/i)).toBeInTheDocument()
  })

  it('redirects to active session when present', async () => {
    useActiveSession.mockReturnValue({ data: { id: 'session-123' }, isLoading: false })

    const Wrapper = createQueryWrapper()
    render(<WorkoutsIndexPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // Fallback text while redirecting
    expect(screen.getByText(/Redirecting to your active session/i)).toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/workouts/sessions/session-123')
  })

  it('renders hub when no active session', () => {
    useActiveSession.mockReturnValue({ data: null, isLoading: false })

    const Wrapper = createQueryWrapper()
    render(<WorkoutsIndexPage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    expect(screen.getByRole('heading', { name: /Workouts/i })).toBeInTheDocument()
    expect(screen.getByText(/No active workout session found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go to Routines/i })).toHaveAttribute('href', '/routines')
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
