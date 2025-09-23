import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { BuildDays } from '@/components/routines/create/BuildDays'
import type { RoutineWizardData } from '@/components/routines/create/types'

// Mock exercises catalog for display
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

describe('BuildDays - Program Schedule mode NONE', () => {
  const openSelect = (label: string) => {
    const trigger = screen.getByLabelText(label)
    fireEvent.click(trigger)
  }

  const Wrapper: React.FC<{ initial: RoutineWizardData; onUpdate: (d: RoutineWizardData) => void }>
    = ({ initial, onUpdate }) => {
    const [data, setData] = React.useState<RoutineWizardData>(initial)
    const handleUpdate = (updates: Partial<RoutineWizardData>) => {
      const next = { ...data, ...updates }
      setData(next)
      onUpdate(next)
    }
    return <BuildDays data={data} onUpdate={handleUpdate} />
  }

  const makeData = (override?: Partial<RoutineWizardData>): RoutineWizardData => ({
    name: 'Routine',
    description: '',
    trainingDays: [1], // Monday
    days: [
      {
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'e1',
            progressionScheme: 'NONE',
            minWeightIncrement: 2.5,
            restSeconds: 120,
            sets: [
              { setNumber: 1, repType: 'FIXED', reps: 10, minReps: null, maxReps: null, weight: 50 },
            ],
          },
        ],
      },
    ],
    programScheduleMode: 'NONE',
    ...override,
  })

  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onUpdate = vi.fn()
  })

  it('auto-reverts time-based progression to NONE when schedule mode is NONE', () => {
    const data = makeData({
      days: [
        {
          dayOfWeek: 1,
          exercises: [
            {
              exerciseId: 'e1',
              progressionScheme: 'PROGRAMMED_RTF',
              minWeightIncrement: 2.5,
              restSeconds: 120,
              sets: [
                { setNumber: 1, repType: 'RANGE', reps: null, minReps: 8, maxReps: 12, weight: 50 },
              ],
            },
          ],
        },
      ],
    })

    render(<Wrapper initial={data} onUpdate={onUpdate} />)

    // Expect state update normalizing progression to NONE
    const updated = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]?.[0] as RoutineWizardData
    expect(updated.days[0].exercises[0].progressionScheme).toBe('NONE')
  })

  it('disables RtF option in progression select when schedule mode is NONE', async () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    // Expand exercise to show config
    fireEvent.click(screen.getByRole('button', { name: /toggle exercise sets/i }))

    // Open progression select
    openSelect('Progression scheme')

    // RtF options should be disabled
    const rtfOption = await screen.findByRole('option', { name: /RtF \(4 fixed \+ 1 AMRAP\)/i })
    expect(rtfOption).toHaveAttribute('aria-disabled', 'true')
  })
})
