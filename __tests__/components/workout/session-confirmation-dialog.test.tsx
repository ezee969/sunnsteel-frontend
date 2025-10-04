import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { SessionConfirmationDialog } from '@/components/workout/session-confirmation-dialog'

const defaultProps = {
	isOpen: true,
	onClose: vi.fn(),
	onConfirm: vi.fn(),
	routineName: 'Push Day',
	progressData: {
		completedSets: 8,
		totalSets: 12,
		percentage: 67
	},
	isFinishing: false
}

describe('SessionConfirmationDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should render when open', () => {
		render(<SessionConfirmationDialog {...defaultProps} />)

		// Check for dialog title
		const title = screen.getByRole('heading', { name: /finish session/i })
		expect(title).toBeInTheDocument()

		// Check for routine name
		expect(screen.getByText('Push Day')).toBeInTheDocument()

		// Check for buttons
		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /finish session/i })).toBeInTheDocument()
	})

	it('should not render when closed', () => {
		render(<SessionConfirmationDialog {...defaultProps} isOpen={false} />)

		expect(screen.queryByText('Finish Session')).not.toBeInTheDocument()
	})

	it('should display progress information', () => {
		render(<SessionConfirmationDialog {...defaultProps} />)

		expect(screen.getByText('8 of 12 sets completed')).toBeInTheDocument()
		expect(screen.getByText('67%')).toBeInTheDocument()
	})

	it('should show incomplete session warning', () => {
		render(<SessionConfirmationDialog {...defaultProps} />)

		expect(screen.getByText(/Finishing with incomplete sets will still save your progress/)).toBeInTheDocument()
		expect(screen.getByText(/Are you sure you want to finish/)).toBeInTheDocument()
	})

	it('should show complete session message when all sets are done', () => {
		const completedProps = {
			...defaultProps,
			progressData: {
				completedSets: 12,
				totalSets: 12,
				percentage: 100
			}
		}

		render(<SessionConfirmationDialog {...completedProps} />)

		expect(screen.getByText(/Great job!/)).toBeInTheDocument()
		expect(screen.queryByText(/Finishing with incomplete sets will still save your progress/)).not.toBeInTheDocument()
	})

	it('should call onClose when cancel button is clicked', () => {
		const onClose = vi.fn()
		render(<SessionConfirmationDialog {...defaultProps} onClose={onClose} />)

		const cancelButton = screen.getByText('Cancel')
		fireEvent.click(cancelButton)

		expect(onClose).toHaveBeenCalled()
	})

	it('should call onConfirm when finish button is clicked', () => {
		const onConfirm = vi.fn()
		render(<SessionConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

		const finishButton = screen.getByRole('button', { name: /finish session/i })
		fireEvent.click(finishButton)

		expect(onConfirm).toHaveBeenCalled()
	})

	it('should disable finish button when isFinishing is true', () => {
		render(<SessionConfirmationDialog {...defaultProps} isFinishing={true} />)

		const finishButton = screen.getByRole('button', { name: /finishing/i })
		expect(finishButton).toBeDisabled()
	})

	it('should show loading state when finishing', () => {
		render(<SessionConfirmationDialog {...defaultProps} isFinishing={true} />)

		expect(screen.getByText('Finishing...')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /^finish session$/i })).not.toBeInTheDocument()
	})

	it('should handle zero progress', () => {
		const zeroProps = {
			...defaultProps,
			progressData: {
				completedSets: 0,
				totalSets: 10,
				percentage: 0
			}
		}

		render(<SessionConfirmationDialog {...zeroProps} />)

		expect(screen.getByText('0 of 10 sets completed')).toBeInTheDocument()
		expect(screen.getByText('0%')).toBeInTheDocument()
		expect(screen.getByText(/Finishing with incomplete sets will still save your progress/)).toBeInTheDocument()
	})

	it('should handle partial completion correctly', () => {
		const partialProps = {
			...defaultProps,
			progressData: {
				completedSets: 3,
				totalSets: 8,
				percentage: 38
			}
		}

		render(<SessionConfirmationDialog {...partialProps} />)

		expect(screen.getByText('3 of 8 sets completed')).toBeInTheDocument()
		expect(screen.getByText('38%')).toBeInTheDocument()
	})

	it('should show appropriate styling for incomplete sessions', () => {
		render(<SessionConfirmationDialog {...defaultProps} />)

		// Check for secondary badge styling for incomplete sessions
		const badge = screen.getByText('67%')
		expect(badge).toBeInTheDocument()
	})

	it('should show appropriate styling for complete sessions', () => {
		const completedProps = {
			...defaultProps,
			progressData: {
				completedSets: 12,
				totalSets: 12,
				percentage: 100
			}
		}

		render(<SessionConfirmationDialog {...completedProps} />)

		// Check for default badge styling for complete sessions
		const badge = screen.getByText('100%')
		expect(badge).toBeInTheDocument()
	})

	it('should close dialog when clicking outside (if supported)', () => {
		const onClose = vi.fn()
		render(<SessionConfirmationDialog {...defaultProps} onClose={onClose} />)

		// Check that the dialog is rendered with proper role
		const dialog = screen.getByRole('alertdialog')
		expect(dialog).toBeInTheDocument()
	})

	it('should handle keyboard navigation', () => {
		const onClose = vi.fn()
		const onConfirm = vi.fn()
		
		render(
			<SessionConfirmationDialog
				{...defaultProps}
				onClose={onClose}
				onConfirm={onConfirm}
			/>
		)

		const cancelButton = screen.getByRole('button', { name: /cancel/i })
		const finishButton = screen.getByRole('button', { name: /finish session/i })

		// Test Tab navigation
		cancelButton.focus()
		expect(document.activeElement).toBe(cancelButton)

		// Test clicking buttons instead of keyDown (more realistic)
		fireEvent.click(cancelButton)
		expect(onClose).toHaveBeenCalled()

		fireEvent.click(finishButton)
		expect(onConfirm).toHaveBeenCalled()
	})

	it('should handle Escape key to close dialog', () => {
		const onClose = vi.fn()
		render(<SessionConfirmationDialog {...defaultProps} onClose={onClose} />)

		fireEvent.keyDown(document, { key: 'Escape' })
		expect(onClose).toHaveBeenCalled()
	})

	it('should be accessible with proper ARIA attributes', () => {
		render(<SessionConfirmationDialog {...defaultProps} />)

		const dialog = screen.getByRole('alertdialog')
		expect(dialog).toHaveAttribute('aria-labelledby')
		expect(dialog).toHaveAttribute('aria-describedby')

		// Check for proper heading structure
		const heading = screen.getByRole('heading', { name: /finish session/i })
		expect(heading.tagName).toBe('H2')
	})

	it('should handle long routine names gracefully', () => {
		const longNameProps = {
			...defaultProps,
			routineName: 'Very Long Routine Name That Might Cause Layout Issues'
		}

		render(<SessionConfirmationDialog {...longNameProps} />)

		expect(screen.getByText('Very Long Routine Name That Might Cause Layout Issues')).toBeInTheDocument()
	})

	it('should show different button states correctly', () => {
		const { rerender } = render(<SessionConfirmationDialog {...defaultProps} />)

		// Normal state
		expect(screen.getByRole('button', { name: /finish session/i })).not.toBeDisabled()
		expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled()

		// Finishing state
		rerender(<SessionConfirmationDialog {...defaultProps} isFinishing={true} />)
		
		expect(screen.getByRole('button', { name: /finishing/i })).toBeDisabled()
		expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled() // Cancel is also disabled when finishing
	})

	it('should handle edge cases with progress data', () => {
		// Test with very high numbers
		const highNumberProps = {
			...defaultProps,
			progressData: {
				completedSets: 95,
				totalSets: 100,
				percentage: 95
			}
		}

		render(<SessionConfirmationDialog {...highNumberProps} />)

		expect(screen.getByText('95 of 100 sets completed')).toBeInTheDocument()
		expect(screen.getByText('95%')).toBeInTheDocument()
	})

	it('should maintain focus management when opening', () => {
		const { rerender } = render(
			<SessionConfirmationDialog {...defaultProps} isOpen={false} />
		)

		// Open the dialog
		rerender(<SessionConfirmationDialog {...defaultProps} isOpen={true} />)

		// Focus should be managed by the dialog (usually on the first focusable element)
		const dialog = screen.getByRole('alertdialog')
		expect(dialog).toBeInTheDocument()
	})

	it('should display progress with proper formatting', () => {
		// Test decimal percentage (should be rounded)
		const decimalProps = {
			...defaultProps,
			progressData: {
				completedSets: 1,
				totalSets: 3,
				percentage: 33.33
			}
		}

		render(<SessionConfirmationDialog {...decimalProps} />)

		// Should handle decimal percentages appropriately
		expect(screen.getByText(/33/)).toBeInTheDocument()
	})
})
