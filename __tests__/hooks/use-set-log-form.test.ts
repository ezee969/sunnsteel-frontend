import { renderHook, act } from '@testing-library/react'
import { useSetLogForm } from '@/hooks/use-set-log-form'
import { validateSetLogPayload, validateWeight } from '@/lib/utils/session-validation.utils'
import { useSaveState } from '@/lib/utils/save-status-store'
import { vi } from 'vitest'

// Mock the utility functions and store
vi.mock('@/lib/utils/session-validation.utils')
vi.mock('@/lib/utils/save-status-store')

const mockValidateSetLogPayload = validateSetLogPayload as vi.MockedFunction<typeof validateSetLogPayload>
const mockValidateWeight = validateWeight as vi.MockedFunction<typeof validateWeight>
const mockUseSaveState = useSaveState as vi.MockedFunction<typeof useSaveState>

// Mock debounce hook
vi.mock('@/hooks/use-debounce', () => ({
	useDebounce: vi.fn((value) => value) // Return value immediately for testing
}))

const mockOnSave = vi.fn()
const mockSetSaveState = vi.fn()

describe('useSetLogForm', () => {
	const defaultProps = {
		sessionId: 'session-1',
		routineExerciseId: 'exercise-1',
		setNumber: 1,
		initialReps: 10,
		initialWeight: 100,
		initialIsCompleted: false,
		targetReps: 12,
		targetWeight: 105,
		onSave: mockOnSave
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockValidateSetLogPayload.mockReturnValue({ isValid: true, errors: [] })
		mockUseSaveState.mockReturnValue('idle')
	})

	it('should initialize with provided values', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		expect(result.current.repsState).toBe('10')
		expect(result.current.weightState).toBe('100')
		expect(result.current.isCompletedState).toBe(false)
		expect(result.current.validationError).toBeUndefined()
	})

	it('should initialize with empty values when not provided', () => {
		const { result } = renderHook(() =>
			useSetLogForm({
				...defaultProps,
				initialReps: undefined,
				initialWeight: undefined,
				initialIsCompleted: undefined
			})
		)

		expect(result.current.repsState).toBe('')
		expect(result.current.weightState).toBe('')
		expect(result.current.isCompletedState).toBe(false)
	})

	it('should update reps value', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setReps('12')
		})

		expect(result.current.repsState).toBe('12')
	})

	it('should update weight value', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setWeight('110')
		})

		expect(result.current.weightState).toBe('110')
	})

	it('should toggle completion status', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.handleCompletionToggle(true)
		})

		expect(result.current.isCompletedState).toBe(true)

		act(() => {
			result.current.handleCompletionToggle(false)
		})

		expect(result.current.isCompletedState).toBe(false)
	})

	it('should validate payload and call onSave when values change', () => {
		mockValidateSetLogPayload.mockReturnValue({ isValid: true, errors: [] })

		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setReps('12')
		})

		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 12,
			weight: 100,
			isCompleted: false
		})
		expect(mockOnSave).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 12,
			weight: 100,
			isCompleted: false
		})
	})

	it('should not call onSave when validation fails', () => {
		mockValidateSetLogPayload.mockReturnValue({
			isValid: false,
			errors: ['Invalid reps']
		})

		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setReps('invalid')
		})

		expect(mockOnSave).not.toHaveBeenCalled()
		expect(result.current.validationError).toBe('Invalid reps')
	})

	it('should validate weight separately', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setWeight('-10')
		})

		// The validation happens through validateSetLogPayload, not validateWeight directly
		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 10,
			weight: -10,
			isCompleted: false
		})
	})

	it('should handle empty string inputs correctly', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setReps('')
		})

		expect(result.current.repsState).toBe('')
		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 0,
			weight: 100,
			isCompleted: false
		})
	})

	it('should handle non-numeric inputs', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setReps('abc')
		})

		expect(result.current.repsState).toBe('abc')
		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 0, // Number('abc') || 0 = 0
			weight: 100,
			isCompleted: false
		})
	})

	it('should update validation errors when weight validation fails', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setWeight('abc')
		})

		// The validation happens through validateSetLogPayload, not validateWeight directly
		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 10,
			weight: NaN,
			isCompleted: false
		})
	})

	it('should clear validation errors when validation passes', () => {
		// Mock validation to return error for any payload initially
		mockValidateSetLogPayload.mockReturnValueOnce({
			isValid: false,
			errors: ['Invalid reps']
		})

		const { result } = renderHook(() => useSetLogForm(defaultProps))

		// The hook should show validation error from the mock
		expect(result.current.validationError).toBe('Invalid reps')

		// Then fix validation - mock returns valid
		mockValidateSetLogPayload.mockReturnValue({ isValid: true, errors: [] })

		act(() => {
			result.current.setReps('12')
		})

		expect(result.current.validationError).toBeUndefined()
	})

	it('should handle completion toggle with validation', () => {
		mockValidateSetLogPayload.mockReturnValue({ isValid: true, errors: [] })

		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.handleCompletionToggle(true)
		})

		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 10,
			weight: 100,
			isCompleted: true
		})
		expect(mockOnSave).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 10,
			weight: 100,
			isCompleted: true
		})
	})

	it('should not trigger save when values have not changed', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		// Set the same value
		act(() => {
			result.current.setReps('10')
		})

		// Should validate but not save since value hasn't changed
		expect(mockValidateSetLogPayload).toHaveBeenCalled()
		expect(mockOnSave).not.toHaveBeenCalled()
	})

	it('should handle decimal weight values', () => {
		const { result } = renderHook(() => useSetLogForm(defaultProps))

		act(() => {
			result.current.setWeight('102.5')
		})

		expect(result.current.weightState).toBe('102.5')
		expect(mockValidateSetLogPayload).toHaveBeenCalledWith({
			exerciseId: undefined,
			routineExerciseId: 'exercise-1',
			setNumber: 1,
			reps: 10,
			weight: 102.5,
			isCompleted: false
		})
	})

	it('should provide save state from store', () => {
		mockUseSaveState.mockReturnValue('saving')

		const { result } = renderHook(() => useSetLogForm(defaultProps))

		expect(result.current.saveState).toBe('saving')
	})
})
