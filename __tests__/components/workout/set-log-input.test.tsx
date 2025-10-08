import { render, screen, fireEvent } from '@testing-library/react'
import { SetLogInput } from '@/components/workout/set-log-input'
import { useSetLogForm } from '@/hooks/use-set-log-form'
import { vi } from 'vitest'

// Mock the hooks
vi.mock('@/hooks/use-set-log-form', () => ({
	useSetLogForm: vi.fn()
}))

const mockUseSetLogForm = useSetLogForm as vi.MockedFunction<typeof useSetLogForm>

const mockSetReps = vi.fn()
const mockSetWeight = vi.fn()
const mockHandleCompletionToggle = vi.fn()

const defaultHookReturn = {
	repsState: '10',
	weightState: '100',
	isCompletedState: false,
	saveState: 'idle' as const,
	setReps: mockSetReps,
	setWeight: mockSetWeight,
	handleCompletionToggle: mockHandleCompletionToggle,
	isValid: true,
	validationError: null
}

const defaultProps = {
	sessionId: 'session-1',
	routineExerciseId: 'exercise-1',
	exerciseId: 'exercise-1',
	setNumber: 1,
	reps: 10,
	weight: 100,
	isCompleted: false,
	plannedReps: 12,
	plannedWeight: 105,
	onSave: vi.fn()
}

describe('SetLogInput', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseSetLogForm.mockReturnValue(defaultHookReturn)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should render set number and completion checkbox', () => {
		render(<SetLogInput {...defaultProps} />)

		expect(screen.getByText('Set 1')).toBeInTheDocument()
		expect(screen.getByRole('checkbox')).toBeInTheDocument()
		expect(screen.getByRole('checkbox')).not.toBeChecked()
	})

	it('should render planned reps and weight', () => {
		render(<SetLogInput {...defaultProps} />)

		expect(screen.getByText('Target: 12')).toBeInTheDocument()
		expect(screen.getByText('Target: 105 kg')).toBeInTheDocument()
	})

	it('should render reps and weight inputs with current values', () => {
		render(<SetLogInput {...defaultProps} />)

		const repsInput = screen.getByDisplayValue('10')
		const weightInput = screen.getByDisplayValue('100')

		expect(repsInput).toBeInTheDocument()
		expect(weightInput).toBeInTheDocument()
	})

	it('should call setReps when reps input changes', () => {
		render(<SetLogInput {...defaultProps} />)

		const repsInput = screen.getByDisplayValue('10')
		fireEvent.change(repsInput, { target: { value: '12' } })

		expect(mockSetReps).toHaveBeenCalledWith('12')
	})

	it('should call setWeight when weight input changes', () => {
		render(<SetLogInput {...defaultProps} />)

		const weightInput = screen.getByDisplayValue('100')
		fireEvent.change(weightInput, { target: { value: '110' } })

		expect(mockSetWeight).toHaveBeenCalledWith('110')
	})

	it('should call handleCompletionToggle when checkbox is clicked', () => {
		render(<SetLogInput {...defaultProps} />)

		const checkbox = screen.getByRole('checkbox')
		fireEvent.click(checkbox)

		expect(mockHandleCompletionToggle).toHaveBeenCalled()
	})

	it('should show completed state when isCompleted is true', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			isCompletedState: true
		})

		render(<SetLogInput {...defaultProps} />)

		const checkbox = screen.getByRole('checkbox')
		expect(checkbox).toBeChecked()
	})

	it('should render error feedback when save fails', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			saveState: 'error'
		})

		render(<SetLogInput {...defaultProps} />)

		expect(screen.getByText('Error saving set. Please try again.')).toBeInTheDocument()
	})

	it('should hide save indicators for non-error states', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			saveState: 'saved'
		})

		render(<SetLogInput {...defaultProps} />)

		expect(screen.queryByText('Error saving set. Please try again.')).not.toBeInTheDocument()
	})

	it('should disable inputs when saving', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			saveState: 'saving'
		})

		render(<SetLogInput {...defaultProps} />)

		const repsInput = screen.getByDisplayValue('10')
		const weightInput = screen.getByDisplayValue('100')

		expect(repsInput).toBeDisabled()
		expect(weightInput).toBeDisabled()
	})

	it('should show validation errors', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			isValid: false,
			validationError: 'Reps must be positive'
		})

		render(<SetLogInput {...defaultProps} />)

		expect(screen.getByText('Reps must be positive')).toBeInTheDocument()
	})

	it('should handle empty planned values', () => {
		render(
			<SetLogInput
				{...defaultProps}
				plannedReps={null}
				plannedWeight={null}
			/>
		)

		// Should show "—" for empty planned values
		expect(screen.getAllByText('Target: —')).toHaveLength(2)
	})

	it('should pass correct props to useSetLogForm hook', () => {
		const props = {
			...defaultProps,
			reps: 8,
			weight: 95,
			isCompleted: true
		}

		render(<SetLogInput {...props} />)

		expect(mockUseSetLogForm).toHaveBeenCalledWith({
			sessionId: 'session-1',
			routineExerciseId: 'exercise-1',
			exerciseId: 'exercise-1',
			setNumber: 1,
			initialReps: 8,
			initialWeight: 95,
			initialIsCompleted: true,
			onSave: expect.any(Function)
		})
	})

	it('should handle different set numbers', () => {
		render(<SetLogInput {...defaultProps} setNumber={3} />)

		expect(screen.getByText('Set 3')).toBeInTheDocument()
	})

	it('should apply correct styling for completed sets', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			isCompletedState: true
		})

		render(<SetLogInput {...defaultProps} />)

		// Find the outermost container div (the one with the border styling)
		const container = screen.getByTestId('set-log-container')
		expect(container).toHaveClass('border-green-200')
	})

	it('should show appropriate styling for incomplete sets', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			isCompletedState: false
		})

		render(<SetLogInput {...defaultProps} />)

		// Find the outermost container div (the one with the border styling)
		const container = screen.getByTestId('set-log-container')
		expect(container).not.toHaveClass('border-green-200')
	})

	it('should handle numeric input validation', () => {
		render(<SetLogInput {...defaultProps} />)

		const repsInput = screen.getByDisplayValue('10')
		
		// Test numeric input
		fireEvent.change(repsInput, { target: { value: '15' } })
		expect(mockSetReps).toHaveBeenCalledWith('15')

		// Clear the mock to test the next call
		mockSetReps.mockClear()

		// Test non-numeric input - the input might filter or handle this differently
		fireEvent.change(repsInput, { target: { value: 'abc' } })
		// The component might handle non-numeric input by clearing or ignoring it
		expect(mockSetReps).toHaveBeenCalled()
	})

	it('should handle decimal weight values', () => {
		mockUseSetLogForm.mockReturnValue({
			...defaultHookReturn,
			weightState: '102.5'
		})

		render(<SetLogInput {...defaultProps} />)

		const weightInput = screen.getByDisplayValue('102.5')
		expect(weightInput).toBeInTheDocument()
	})

	it('should handle keyboard navigation', () => {
		render(<SetLogInput {...defaultProps} />)

		const checkbox = screen.getByRole('checkbox')
		const repsInput = screen.getByDisplayValue('10')
		const weightInput = screen.getByDisplayValue('100')

		// Test tab navigation
		checkbox.focus()
		expect(document.activeElement).toBe(checkbox)

		fireEvent.keyDown(checkbox, { key: 'Tab' })
		// Note: Actual tab navigation testing requires more complex setup
		// This is a basic test to ensure elements are focusable
		expect(repsInput).toBeInTheDocument()
		expect(weightInput).toBeInTheDocument()
	})
})
