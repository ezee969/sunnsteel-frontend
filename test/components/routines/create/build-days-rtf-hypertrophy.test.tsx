import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Matcher } from '@testing-library/dom'
import { BuildDays } from '@/components/routines/create/BuildDays'
import type { RoutineWizardData } from '@/components/routines/create/types'

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

describe('BuildDays - PROGRAMMED_RTF_HYPERTROPHY flows', () => {
  const openSelectAndChoose = async (label: string, optionName: Matcher) => {
    const trigger = screen.getByLabelText(label)
    fireEvent.click(trigger)
    const option = await screen.findByRole('option', { name: optionName })
    fireEvent.click(option)
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
    programScheduleMode: 'TIMEFRAME',
    ...override,
  })

  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onUpdate = vi.fn()
  })

  it('switching to PROGRAMMED_RTF_HYPERTROPHY converts FIXED->RANGE and defaults rounding', async () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    // Expand exercise for visibility
    fireEvent.click(screen.getByRole('button', { name: /toggle sets/i }))

    await openSelectAndChoose('Progression scheme', /RtF Hypertrophy \(3 \+ 1 AMRAP\)/i)

    expect(onUpdate).toHaveBeenCalled()
    const updated = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0] as RoutineWizardData
    const ex = updated.days[0].exercises[0]

    expect(ex.programRoundingKg).toBe(2.5)
    expect(ex.sets[0]).toEqual(
      expect.objectContaining({ repType: 'RANGE', reps: null, minReps: 10, maxReps: 10 })
    )

    // Banner removed; start date handled in Basic Info
  })
})
