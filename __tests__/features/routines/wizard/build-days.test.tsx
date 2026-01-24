import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BuildDays } from '@/features/routines/wizard/BuildDays'
import type { RoutineWizardData } from '@/features/routines/wizard/types'

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

describe('BuildDays - repType flows', () => {
	const openSelectAndChoose = async (
		label: string,
		optionName: string | RegExp,
	) => {
		const triggers = screen.getAllByLabelText(label)
		const trigger = triggers[0]

		// For Radix UI Select, we need to:
		// 1. Open the select by clicking the trigger
		fireEvent.click(trigger)

		// 2. Find and click the option
		const option = await screen.findByRole('option', { name: optionName })

		// 3. Use both pointerDown and pointerUp to simulate a full pointer interaction
		fireEvent.pointerDown(option)
		fireEvent.pointerUp(option)
		fireEvent.click(option)
	}

	const Wrapper: React.FC<{
		initial: RoutineWizardData
		onUpdate: (d: RoutineWizardData) => void
	}> = ({ initial, onUpdate }) => {
		const [data, setData] = React.useState<RoutineWizardData>(initial)
		const handleUpdate = (updates: Partial<RoutineWizardData>) => {
			const next = { ...data, ...updates }
			setData(next)
			onUpdate(next)
		}
		return <BuildDays data={data} onUpdate={handleUpdate} />
	}

	const makeData = (
		override?: Partial<RoutineWizardData>,
	): RoutineWizardData => ({
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
							{
								setNumber: 1,
								repType: 'FIXED',
								reps: 10,
								minReps: null,
								maxReps: null,
								weight: 50,
							},
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

	it('adds a set copying last set repType and values', async () => {
		render(<Wrapper initial={makeData()} onUpdate={onUpdate} />)

		// Ensure FIXED with reps 10 initially; change to 15 for clearer assertion
		const repsInput = screen.getAllByLabelText('Reps')[0] as HTMLInputElement
		fireEvent.change(repsInput, { target: { value: '15' } })

		onUpdate.mockClear()

		// First ensure the exercise card is expanded to make the Add Set button visible
		const headerToggle = screen.getAllByLabelText('Toggle exercise sets')[0]
		const isExpanded = headerToggle.getAttribute('aria-expanded') === 'true'
		if (!isExpanded) {
			fireEvent.click(headerToggle)
		}

		// Click the Add Set button via test id for stability
		const addSetBtns = screen.getAllByTestId('add-set-btn-0-0')
		const addSetBtn = addSetBtns[0]
		fireEvent.click(addSetBtn)

		// Verify the new set was appended: we should now have 2 reps inputs
		const repsInputs = (await screen.findAllByLabelText(
			'Reps',
		)) as HTMLInputElement[]
		expect(repsInputs.length).toBeGreaterThanOrEqual(2)
		// Last reps input should be 15
		expect(repsInputs[repsInputs.length - 1].value).toBe('15')
	})
})
