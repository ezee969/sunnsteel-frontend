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
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: 'UTC',
		} as any)

		const Wrapper = createQueryWrapper()
		render(<CreateRoutinePage />, {
			wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }>,
		})

		// Step 1
		fireEvent.change(screen.getByLabelText(/Routine Name/i), {
			target: { value: 'Rtf Routine' },
		})

		// Next → Step 2
		fireEvent.click(screen.getByLabelText('Next'))

		// Select Tuesday (matches start date)
		fireEvent.click(screen.getByRole('button', { name: /Tue/i }))

		// Next should be enabled (no RtF exercises yet, so no weekday validation)
		const nextBtn = screen.getByLabelText('Next')
		expect(nextBtn).not.toBeDisabled()
	}, 15000)

	it('Step 3: allows Next when RtF exercises present (no timeframe)', async () => {
		// Stable timezone
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			timeZone: 'America/Los_Angeles',
		} as any)

		const Wrapper = createQueryWrapper()
		render(<CreateRoutinePage />, {
			wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }>,
		})

		// Step 1: name
		fireEvent.change(screen.getByLabelText(/Routine Name/i), {
			target: { value: 'Rtf Routine' },
		})

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
		const rtfStandard = await screen.findByRole('option', {
			name: /RtF Standard \(5 sets: 4 \+ 1 AMRAP\)/i,
		})
		fireEvent.click(rtfStandard)

		await waitFor(() => {
			expect(
				screen.queryByRole('option', {
					name: /RtF Standard \(5 sets: 4 \+ 1 AMRAP\)/i,
				}),
			).not.toBeInTheDocument()
		})

		// Next should be enabled (date+timezone present)
		const nextBtn = await screen.findByRole('button', { name: /Next/i })
		expect(nextBtn).not.toBeDisabled()
	})
})
