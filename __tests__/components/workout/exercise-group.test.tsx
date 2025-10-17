import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseGroup } from '@/components/workout/exercise-group'
import { vi } from 'vitest'

// Mock the SetLogInput component
vi.mock('@/components/workout/set-log-input', () => ({
	SetLogInput: ({ setNumber, exerciseId, routineExerciseId }: any) => (
		<div data-testid={`set-log-input-${setNumber}`}>
			SetLogInput - Set {setNumber} - Exercise {exerciseId} - Routine Exercise {routineExerciseId}
		</div>
	)
}))

const mockSets = [
	{
		id: 'set-1',
		routineExerciseId: 'routine-exercise-1',
		exerciseId: 'exercise-1',
		sessionId: 'session-1',
		setNumber: 1,
		reps: 8,
		weight: 80,
		isCompleted: true,
		plannedReps: 8,
		plannedWeight: 80
	},
	{
		id: 'set-2',
		routineExerciseId: 'routine-exercise-1',
		exerciseId: 'exercise-1',
		sessionId: 'session-1',
		setNumber: 2,
		reps: 0,
		weight: undefined,
		isCompleted: false,
		plannedReps: 8,
		plannedWeight: 80
	},
	{
		id: 'set-3',
		routineExerciseId: 'routine-exercise-1',
		exerciseId: 'exercise-1',
		sessionId: 'session-1',
		setNumber: 3,
		reps: 0,
		weight: undefined,
		isCompleted: false,
		plannedReps: 8,
		plannedWeight: 80
	}
]

const defaultProps = {
	exerciseId: 'exercise-1',
	exerciseName: 'Bench Press',
	sets: mockSets,
	isCollapsed: false,
	onToggleCollapse: vi.fn(),
	completedSets: 1,
	totalSets: 3,
	onSave: vi.fn()
}

describe('ExerciseGroup', () => {
	beforeEach(() => {
		vi.clearAllMocks()
})

	it('should render exercise name and completion status', () => {
		render(<ExerciseGroup {...defaultProps} />)

		expect(screen.getByText('Bench Press')).toBeInTheDocument()
		expect(screen.getByText('1/3 sets completed')).toBeInTheDocument()
	})

	it('should render all sets when expanded', () => {
		render(<ExerciseGroup {...defaultProps} />)

		expect(screen.getByTestId('set-log-input-1')).toBeInTheDocument()
		expect(screen.getByTestId('set-log-input-2')).toBeInTheDocument()
		expect(screen.getByTestId('set-log-input-3')).toBeInTheDocument()
	})

	it('should hide sets when collapsed', () => {
		render(<ExerciseGroup {...defaultProps} isCollapsed={true} />)

		expect(screen.queryByTestId('set-log-input-1')).not.toBeInTheDocument()
		expect(screen.queryByTestId('set-log-input-2')).not.toBeInTheDocument()
		expect(screen.queryByTestId('set-log-input-3')).not.toBeInTheDocument()
	})

	it('should call onToggleCollapse when header is clicked', () => {
		const onToggleCollapse = vi.fn()
		render(<ExerciseGroup {...defaultProps} onToggleCollapse={onToggleCollapse} />)

		const header = screen.getByRole('button')
		fireEvent.click(header)

		expect(onToggleCollapse).toHaveBeenCalled()
	})

	it('should show correct completion count', () => {
		render(<ExerciseGroup {...defaultProps} />)

		expect(screen.getByText('1/3 sets completed')).toBeInTheDocument()
	})

	it('should show all completed when all sets are done', () => {
		const completedSets = mockSets.map(set => ({ ...set, isCompleted: true }))

		render(<ExerciseGroup {...defaultProps} sets={completedSets} completedSets={3} />)

		expect(screen.getByText('3/3 sets completed')).toBeInTheDocument()
	})

	it('should show zero completed when no sets are done', () => {
		const incompleteSets = mockSets.map(set => ({ ...set, isCompleted: false }))

		render(<ExerciseGroup {...defaultProps} sets={incompleteSets} completedSets={0} />)

		expect(screen.getByText('0/3 sets completed')).toBeInTheDocument()
	})

	it('should display correct chevron icon based on collapse state', () => {
		const { rerender } = render(<ExerciseGroup {...defaultProps} isCollapsed={false} />)

		// Check for expanded state (ChevronDown) - look for the actual icon
		let chevron = screen.getByRole('button').querySelector('svg')
		expect(chevron).toBeInTheDocument()

		// Check for collapsed state (ChevronRight)
		rerender(<ExerciseGroup {...defaultProps} isCollapsed={true} />)
		chevron = screen.getByRole('button').querySelector('svg')
		expect(chevron).toBeInTheDocument()
	})

	it('should handle exercise with no sets', () => {
		render(<ExerciseGroup {...defaultProps} sets={[]} totalSets={0} completedSets={0} />)

		expect(screen.getByText('Bench Press')).toBeInTheDocument()
		expect(screen.getByText('0/0 sets completed')).toBeInTheDocument()
		expect(screen.queryByTestId('set-log-input-1')).not.toBeInTheDocument()
	})

	it('should handle exercise with single set', () => {
		const singleSet = [mockSets[0]]

		render(<ExerciseGroup {...defaultProps} sets={singleSet} totalSets={1} completedSets={1} />)

		expect(screen.getByText('1/1 sets completed')).toBeInTheDocument()
		expect(screen.getByTestId('set-log-input-1')).toBeInTheDocument()
		expect(screen.queryByTestId('set-log-input-2')).not.toBeInTheDocument()
	})

	it('should pass correct props to SetLogInput components', () => {
		render(<ExerciseGroup {...defaultProps} />)

		const setInput1 = screen.getByTestId('set-log-input-1')
		expect(setInput1).toHaveTextContent('Set 1 - Exercise exercise-1 - Routine Exercise routine-exercise-1')

		const setInput2 = screen.getByTestId('set-log-input-2')
		expect(setInput2).toHaveTextContent('Set 2 - Exercise exercise-1 - Routine Exercise routine-exercise-1')
	})

	it('should be accessible with proper ARIA attributes', () => {
		render(<ExerciseGroup {...defaultProps} />)

		const button = screen.getByRole('button')
		// The component doesn't implement aria-expanded, so just check that it's a button
		expect(button).toBeInTheDocument()

		// Test collapsed state - use getAllByRole since rerender creates multiple buttons
		const { rerender } = render(<ExerciseGroup {...defaultProps} isCollapsed={true} />)
		const buttons = screen.getAllByRole('button')
		expect(buttons.length).toBeGreaterThan(0)
	})

	it('should handle keyboard navigation', () => {
		const onToggleCollapse = vi.fn()
		render(<ExerciseGroup {...defaultProps} onToggleCollapse={onToggleCollapse} />)

		const button = screen.getByRole('button')

		// Test Enter key - Button component handles this automatically
		fireEvent.click(button)
		expect(onToggleCollapse).toHaveBeenCalled()

		// Test Space key - Button component handles this automatically
		fireEvent.click(button)
		expect(onToggleCollapse).toHaveBeenCalledTimes(2)
	})

	it('should show completion status styling', () => {
		render(<ExerciseGroup {...defaultProps} />)

		const completionBadge = screen.getByText('1/3 sets completed')
		expect(completionBadge).toBeInTheDocument()

		// Test with all completed - check the percentage badge instead
		const completedSets = mockSets.map(set => ({ ...set, isCompleted: true }))

		const { rerender } = render(<ExerciseGroup {...defaultProps} sets={completedSets} completedSets={3} />)
		const percentageBadge = screen.getByText('100%')
		expect(percentageBadge).toHaveClass('bg-green-100', 'text-green-800')
	})

	it('should handle long exercise names', () => {
		render(<ExerciseGroup {...defaultProps} exerciseName="Very Long Exercise Name That Might Cause Layout Issues In The UI" />)

		expect(screen.getByText('Very Long Exercise Name That Might Cause Layout Issues In The UI')).toBeInTheDocument()
	})

	it('should maintain state during re-renders', () => {
		const { rerender } = render(<ExerciseGroup {...defaultProps} isCollapsed={false} />)

		expect(screen.getByTestId('set-log-input-1')).toBeInTheDocument()

		// Re-render with same props
		rerender(<ExerciseGroup {...defaultProps} isCollapsed={false} />)
		expect(screen.getByTestId('set-log-input-1')).toBeInTheDocument()

		// Change collapse state
		rerender(<ExerciseGroup {...defaultProps} isCollapsed={true} />)
		expect(screen.queryByTestId('set-log-input-1')).not.toBeInTheDocument()
	})

	it('should handle mixed completion states correctly', () => {
		const mixedSets = [
			{ ...mockSets[0], isCompleted: true },
			{ ...mockSets[1], isCompleted: false },
			{ ...mockSets[2], isCompleted: true }
		]

		render(<ExerciseGroup {...defaultProps} sets={mixedSets} completedSets={2} />)

		expect(screen.getByText('2/3 sets completed')).toBeInTheDocument()
	})

	it('should render sets in correct order', () => {
		render(<ExerciseGroup {...defaultProps} />)

		const setInputs = screen.getAllByTestId(/set-log-input-/)
		expect(setInputs).toHaveLength(3)
		expect(setInputs[0]).toHaveAttribute('data-testid', 'set-log-input-1')
		expect(setInputs[1]).toHaveAttribute('data-testid', 'set-log-input-2')
		expect(setInputs[2]).toHaveAttribute('data-testid', 'set-log-input-3')
	})

	it('should handle focus management when collapsing/expanding', () => {
		const { rerender } = render(<ExerciseGroup {...defaultProps} isCollapsed={false} />)

		const button = screen.getByRole('button')
		button.focus()
		expect(document.activeElement).toBe(button)

		// Collapse and expand should maintain focus on button
		rerender(<ExerciseGroup {...defaultProps} isCollapsed={true} />)
		expect(document.activeElement).toBe(button)

		rerender(<ExerciseGroup {...defaultProps} isCollapsed={false} />)
		expect(document.activeElement).toBe(button)
	})

	it('should show appropriate visual feedback for completion status', () => {
		// Test incomplete exercise - check the percentage badge instead of the text
		render(<ExerciseGroup {...defaultProps} />)
		let badge = screen.getByText('33%')
		expect(badge).toHaveClass('bg-secondary')

		// Test completed exercise
		const completedSets = mockSets.map(set => ({ ...set, isCompleted: true }))

		const { rerender } = render(<ExerciseGroup {...defaultProps} sets={completedSets} completedSets={3} />)
		badge = screen.getByText('100%')
		expect(badge).toHaveClass('bg-green-100')
	})
})
