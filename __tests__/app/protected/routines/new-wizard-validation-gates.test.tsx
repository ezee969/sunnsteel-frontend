import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../utils'
import CreateRoutinePage from '../../../../app/(protected)/routines/new/page'
import { createQueryWrapper } from '../../../utils'

// Mocks
vi.mock('@/lib/api/hooks/useRoutines', () => ({
  useCreateRoutine: () => ({ isPending: false, mutateAsync: vi.fn() }),
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

describe('CreateRoutinePage wizard validation gates', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('Step 2: blocks Next when start date weekday does not match earliest training day', async () => {
    // Fix timezone to avoid auto-fill variability (still auto filled, but irrelevant here)
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: 'UTC' } as any)

    const Wrapper = createQueryWrapper()
    render(<CreateRoutinePage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // Step 1
    fireEvent.change(screen.getByLabelText(/Routine Name/i), { target: { value: 'Rtf Routine' } })

    // Switch to Timeframe and set a Tuesday date (2025-09-02)
    const scheduleSelect = screen.getByLabelText('Program schedule')
    fireEvent.click(scheduleSelect)
    fireEvent.click(await screen.findByRole('option', { name: /Timeframe \(date-driven\)/i }))
    fireEvent.change(screen.getByLabelText('Program start date'), { target: { value: '2025-09-02' } })

    // Next → Step 2
    fireEvent.click(screen.getByLabelText('Next'))

    // Select Monday only (earliest = Monday)
    fireEvent.click(screen.getByRole('button', { name: /Mon/i }))

    // Next should be disabled due to weekday mismatch
    const nextBtn = screen.getByLabelText('Next')
    expect(nextBtn).toBeDisabled()

    // Make earliest match the date weekday: add Tuesday, then remove Monday
    fireEvent.click(screen.getByRole('button', { name: /Tue/i }))
    fireEvent.click(screen.getByRole('button', { name: /Mon/i }))

    // Now earliest (and only) is Tuesday; Next should be enabled
    expect(nextBtn).not.toBeDisabled()
  })

  it('Step 3: blocks Next when RtF present but timezone cleared; enabled after fixing timezone', async () => {
    // Stable timezone
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: 'America/Los_Angeles' } as any)

    const Wrapper = createQueryWrapper()
    render(<CreateRoutinePage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // Step 1: name
    fireEvent.change(screen.getByLabelText(/Routine Name/i), { target: { value: 'Rtf Routine' } })

    // Switch to Timeframe
    fireEvent.click(screen.getByLabelText('Program schedule'))
    fireEvent.click(await screen.findByRole('option', { name: /Timeframe \(date-driven\)/i }))

    // Auto-filled timezone → clear it
    const tzInput = screen.getByLabelText('Timezone')
    fireEvent.change(tzInput, { target: { value: '' } })

    // Set start date Monday (matches Monday later)
    fireEvent.change(screen.getByLabelText('Program start date'), { target: { value: '2025-09-01' } })

    // Next → Step 2
    fireEvent.click(screen.getByLabelText('Next'))

    // Select Monday
    fireEvent.click(screen.getByRole('button', { name: /Mon/i }))

    // Next → Step 3
    fireEvent.click(screen.getByLabelText('Next'))

    // Add one exercise and choose RtF Standard progression
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Bench Press/i }))
    const progSelect = screen.getByLabelText('Progression scheme')
    fireEvent.click(progSelect)
    const rtfStandard = await screen.findByRole('option', { name: /RtF Standard \(5 sets: 4 \+ 1 AMRAP\)/i })
    fireEvent.click(rtfStandard)

    // Attempt to advance to Review → should be blocked (timezone missing)
    const nextBtn = screen.getByLabelText('Next')
    expect(nextBtn).toBeDisabled()

    // Go back to Step 1 and restore timezone, then proceed again
    fireEvent.click(screen.getByLabelText('Previous'))
    fireEvent.click(screen.getByLabelText('Previous'))
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'America/Los_Angeles' } })

    // Next to Step 2
    fireEvent.click(screen.getByLabelText('Next'))
    // Keep Monday
    // Next to Step 3
    fireEvent.click(screen.getByLabelText('Next'))

    // Now Next should be enabled (date+timezone satisfied)
    expect(nextBtn).not.toBeDisabled()
  })
})
