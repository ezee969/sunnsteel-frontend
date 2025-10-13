import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
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

  it('Step 2: allows Next when no RtF exercises exist yet', async () => {
    // Fix timezone to avoid auto-fill variability
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

    // Select Tuesday (matches start date)
    fireEvent.click(screen.getByRole('button', { name: /Tue/i }))

    // Next should be enabled (no RtF exercises yet, so no weekday validation)
    const nextBtn = screen.getByLabelText('Next')
    expect(nextBtn).not.toBeDisabled()
  })

  it('Step 3: allows Next when timezone is present for RtF exercises', async () => {
    // Stable timezone
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: 'America/Los_Angeles' } as any)

    const Wrapper = createQueryWrapper()
    render(<CreateRoutinePage />, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }> })

    // Step 1: name and schedule
    fireEvent.change(screen.getByLabelText(/Routine Name/i), { target: { value: 'Rtf Routine' } })

    // Switch to Timeframe (timezone auto-filled)
    fireEvent.click(screen.getByLabelText('Program schedule'))
    fireEvent.click(await screen.findByRole('option', { name: /Timeframe \(date-driven\)/i }))

    // Set start date Monday
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

    // Next should be enabled (date+timezone present)
    const nextBtn = screen.getByLabelText('Next')
    expect(nextBtn).not.toBeDisabled()
  })
})
