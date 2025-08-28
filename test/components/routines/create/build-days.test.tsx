import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuildDays } from '@/components/routines/create/BuildDays'
import type { RoutineWizardData } from '@/components/routines/create/types'

// Mock exercises catalog for display
vi.mock('@/lib/api/hooks/useExercises', () => ({
  useExercises: () => ({
    data: [
      {
        id: 'e1',
        name: 'Bench Press',
        primaryMuscle: 'Chest',
        equipment: 'Barbell',
      },
    ],
    isLoading: false,
  }),
}))

describe('BuildDays - repType flows', () => {
  const Wrapper: React.FC<{ initial: RoutineWizardData; onUpdate: (d: RoutineWizardData) => void }> = ({ initial, onUpdate }) => {
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
            restSeconds: 120,
            sets: [
              { setNumber: 1, repType: 'FIXED', reps: 10, minReps: null, maxReps: null, weight: 50 },
            ],
          },
        ],
      },
    ],
    ...override,
  })

  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onUpdate = vi.fn()
  })

  it('switches from FIXED to RANGE and initializes min/max based on fallback', () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    const select = screen.getByLabelText('Rep type') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'RANGE' } })

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            exercises: expect.arrayContaining([
              expect.objectContaining({
                sets: expect.arrayContaining([
                  expect.objectContaining({ setNumber: 1, repType: 'RANGE', reps: null, minReps: 8, maxReps: 12, weight: 50 }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    )
  })

  it('enforces min/max consistency when editing RANGE values', async () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    // Switch to RANGE
    const select = screen.getByLabelText('Rep type') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'RANGE' } })

    onUpdate.mockClear()

    // Use aria-label for deterministic selection and increase min above current max
    const minInput = (await screen.findByLabelText('Min reps')) as HTMLInputElement
    fireEvent.change(minInput, { target: { value: '15' } })

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            exercises: expect.arrayContaining([
              expect.objectContaining({
                sets: expect.arrayContaining([
                  expect.objectContaining({ repType: 'RANGE', minReps: 15, maxReps: 15 }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    )
  })

  it('switches back to FIXED and collapses min/max into reps', async () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    // To RANGE first
    const select = screen.getByLabelText('Rep type') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'RANGE' } })

    // Increase min to 15 to have a deterministic fallback
    const minInput = (await screen.findByLabelText('Min reps')) as HTMLInputElement
    fireEvent.change(minInput, { target: { value: '15' } })

    onUpdate.mockClear()

    // Back to FIXED: reps should adopt minReps (15) and min/max become null
    fireEvent.change(select, { target: { value: 'FIXED' } })

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            exercises: expect.arrayContaining([
              expect.objectContaining({
                sets: expect.arrayContaining([
                  expect.objectContaining({ repType: 'FIXED', reps: 15, minReps: null, maxReps: null }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    )
  })

  it('adds a set copying last set repType and values', () => {
    render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

    // Ensure FIXED with reps 10 initially; change to 15 for clearer assertion
    const repsInput = screen.getByLabelText('Reps') as HTMLInputElement
    fireEvent.change(repsInput, { target: { value: '15' } })

    onUpdate.mockClear()

    // Click Add Set
    fireEvent.click(screen.getByRole('button', { name: /add set/i }))

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            exercises: expect.arrayContaining([
              expect.objectContaining({
                sets: expect.arrayContaining([
                  expect.objectContaining({ setNumber: 2, repType: 'FIXED', reps: 15, minReps: null, maxReps: null, weight: 50 }),
                ]),
              }),
            ]),
          }),
        ]),
      })
    )
  })
})
