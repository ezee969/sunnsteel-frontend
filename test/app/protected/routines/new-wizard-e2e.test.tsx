import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import CreateRoutinePage from '@/app/(protected)/routines/new/page'
import { createQueryWrapper } from '@/test/utils'

// Spies
const createSpy = vi.fn()
const pushMock = vi.fn()

vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ push: pushMock }),
  }
})

vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useCreateRoutine: () => ({ isPending: false, mutateAsync: createSpy }),
  useUpdateRoutine: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

vi.mock('@/lib/api/hooks/useExercises', () => ({
  useExercises: () => ({
    data: [
      {
        id: 'e1',
        name: 'Bench Press',
        primaryMuscles: ['PECTORAL'],
        secondaryMuscles: ['ANTERIOR_DELTOIDS', 'TRICEPS'],
        equipment: 'Barbell',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
}))

describe('CreateRoutinePage wizard E2E', () => {
  beforeEach(() => {
    createSpy.mockReset()
    pushMock.mockReset()
  })

  it('Schedule NONE disables RtF, then Timeframe enables RtF and payload includes program fields', async () => {
    // Stable timezone for assertions
    const tzSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      // @ts-expect-error partial mock
      .mockReturnValue({ timeZone: 'America/Los_Angeles' })

    const Wrapper = createQueryWrapper()
    render(<CreateRoutinePage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // Step 1: Basic Info — set name, keep schedule = NONE
    const nameInput = screen.getByLabelText(/Routine Name/i)
    fireEvent.change(nameInput, { target: { value: 'My Routine' } })

    // Next to Step 2: Training Days
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Select Monday
    fireEvent.click(screen.getByRole('button', { name: /Mon/i }))

    // Next to Step 3: Build Days
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Add exercise
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Bench Press/i }))

    // Inline hint (time-based progressions disabled on NONE schedule)
    expect(
      screen.getByText(/Time-based progressions are disabled/i)
    ).toBeInTheDocument()

    // Go back to Step 1: use Previous twice
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))

    // Switch schedule to Timeframe and set start date
    const scheduleSelect = screen.getByLabelText('Program schedule')
    fireEvent.click(scheduleSelect)
    fireEvent.click(await screen.findByRole('option', { name: /Timeframe \(date-driven\)/i }))

    const startDate = screen.getByLabelText('Program start date')
    fireEvent.change(startDate, { target: { value: '2025-09-08' } })

    // Next -> Training Days, Next -> Build Days
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Now RtF should be enabled; open select
    const progSelect2 = screen.getByLabelText('Progression scheme')
    fireEvent.click(progSelect2)
    const enabledRtf = await screen.findByRole('option', { name: /RtF Standard \(5 sets: 4 \+ 1 AMRAP\)/i })
    expect(enabledRtf).not.toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(enabledRtf)

    // Advance to Review
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create Routine/i }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    const payload = createSpy.mock.calls[0][0]

    expect(payload).toEqual(
      expect.objectContaining({
        name: 'My Routine',
        programStartDate: '2025-09-08',
        programTimezone: 'America/Los_Angeles',
      })
    )

    const ex = payload.days[0].exercises[0]
    expect(ex.progressionScheme).toBe('PROGRAMMED_RTF')
    // Rounding should default to 2.5 when selecting RtF
    expect(ex).toEqual(expect.objectContaining({ programRoundingKg: 2.5 }))

    tzSpy.mockRestore()
  })
})
