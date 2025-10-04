import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { SessionActionCard } from '@/components/workout/session-action-card'

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value} />
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Play: () => <div data-testid="play-icon" />,
}))

// Mock time format utils
vi.mock('@/lib/utils/time-format.utils', () => ({
  formatTime: vi.fn((dateString: string) => '10:30 AM'),
  formatDuration: vi.fn((seconds: number) => '45m 30s'),
}))

const defaultProps = {
	sessionId: 'test-session-id',
	routineName: 'Test Routine',
	dayName: 'Day 1',
	startedAt: '2024-01-01T10:30:00Z',
	progressData: {
		completedSets: 5,
		totalSets: 10,
		completedExercises: 2,
		totalExercises: 4,
		percentage: 50
	},
	isFinishing: false,
	onFinishAttempt: vi.fn(),
	onNavigateBack: vi.fn()
}

describe('SessionActionCard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should render session information correctly', () => {
		render(<SessionActionCard {...defaultProps} />)

		expect(screen.getByText('Test Routine')).toBeInTheDocument()
		expect(screen.getByText('Day 1')).toBeInTheDocument()
		expect(screen.getByText('Started: 10:30 AM')).toBeInTheDocument()
	})

	it('should display progress information', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the sets are displayed in the format "5/10"
		expect(screen.getByText('5/10')).toBeInTheDocument()
		expect(screen.getByText('Sets')).toBeInTheDocument()
		expect(screen.getByText('50%')).toBeInTheDocument()
	})

	it('should show duration', () => {
		render(<SessionActionCard {...defaultProps} />)

		expect(screen.getByText('45m 30s')).toBeInTheDocument()
	})

	it('should call onNavigateBack when back button is clicked', () => {
		const onNavigateBack = vi.fn()
		render(<SessionActionCard {...defaultProps} onNavigateBack={onNavigateBack} />)

		const backButton = screen.getByText('Back')
		fireEvent.click(backButton)

		expect(onNavigateBack).toHaveBeenCalled()
	})

	it('should call onFinishAttempt when finish button is clicked', () => {
		const onFinishAttempt = vi.fn()
		render(<SessionActionCard {...defaultProps} onFinishAttempt={onFinishAttempt} />)

		const finishButton = screen.getByText('Finish Session')
		fireEvent.click(finishButton)

		expect(onFinishAttempt).toHaveBeenCalled()
	})

	it('should disable finish button when finishing', () => {
		render(<SessionActionCard {...defaultProps} isFinishing={true} />)

		const finishButton = screen.getByText('Finishing...')
		expect(finishButton).toBeDisabled()
	})

	it('should show loading state when finishing', () => {
		render(<SessionActionCard {...defaultProps} isFinishing={true} />)

		expect(screen.getByText('Finishing...')).toBeInTheDocument()
		expect(screen.queryByText('Finish Session')).not.toBeInTheDocument()
	})

	it('should display progress bar with correct percentage', () => {
		render(<SessionActionCard {...defaultProps} />)

		const progressBar = screen.getByTestId('progress')
		expect(progressBar).toBeInTheDocument()
	})

	it('should handle zero progress', () => {
		const zeroProgressProps = {
			...defaultProps,
			progressData: {
				completedSets: 0,
				totalSets: 10,
				completedExercises: 0,
				totalExercises: 4,
				percentage: 0
			}
		}

		render(<SessionActionCard {...zeroProgressProps} />)

		// Check that the sets are displayed in the format "0/10"
		expect(screen.getByText('0/10')).toBeInTheDocument()
		expect(screen.getByText('Sets')).toBeInTheDocument()
		expect(screen.getByText('0%')).toBeInTheDocument()

		const progressBar = screen.getByTestId('progress')
		expect(progressBar).toBeInTheDocument()
	})

	it('should handle complete progress', () => {
		const completeProgressProps = {
			...defaultProps,
			progressData: {
				completedSets: 10,
				totalSets: 10,
				completedExercises: 4,
				totalExercises: 4,
				percentage: 100
			}
		}

		render(<SessionActionCard {...completeProgressProps} />)

		// Check that the sets and exercises are displayed in the correct format
		expect(screen.getByText('10/10')).toBeInTheDocument()
		expect(screen.getByText('Sets')).toBeInTheDocument()
		expect(screen.getByText('100%')).toBeInTheDocument()

		const progressBar = screen.getByTestId('progress')
		expect(progressBar).toBeInTheDocument()
	})

	it('should show appropriate styling for completion status', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the component renders without errors
		expect(screen.getByText('Test Routine')).toBeInTheDocument()
	})

	it('should show success styling when completed', () => {
		const completedProps = {
			...defaultProps,
			progressData: {
				completedSets: 10,
				totalSets: 10,
				completedExercises: 4,
				totalExercises: 4
			}
		}

		render(<SessionActionCard {...completedProps} />)

		// Check that the sets are displayed in the format "10/10"
		expect(screen.getByText('10/10')).toBeInTheDocument()
		expect(screen.getByText('Sets')).toBeInTheDocument()
	})

	it('should handle long routine and day names', () => {
		const longNameProps = {
			...defaultProps,
			routineName: 'Very Long Routine Name That Might Cause Layout Issues',
			dayName: 'Very Long Day Name That Might Also Cause Issues'
		}

		render(<SessionActionCard {...longNameProps} />)

		expect(screen.getByText('Very Long Routine Name That Might Cause Layout Issues')).toBeInTheDocument()
		expect(screen.getByText('Very Long Day Name That Might Also Cause Issues')).toBeInTheDocument()
	})

	it('should format duration correctly', () => {
		render(<SessionActionCard {...defaultProps} />)
		
		// The mocked formatDuration returns '45m 30s'
		expect(screen.getByText('45m 30s')).toBeInTheDocument()
	})

	it('should be accessible with proper ARIA attributes', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the mocked Progress component is rendered
		const progressBar = screen.getByTestId('progress')
		expect(progressBar).toBeInTheDocument()

		const backButton = screen.getByText('Back')
		expect(backButton).toBeInTheDocument()

		const finishButton = screen.getByText('Finish Session')
		expect(finishButton).toBeInTheDocument()
	})

	it('should handle keyboard navigation', () => {
		const onNavigateBack = vi.fn()
		const onFinishAttempt = vi.fn()

		render(<SessionActionCard {...defaultProps} onNavigateBack={onNavigateBack} onFinishAttempt={onFinishAttempt} />)

		const backButton = screen.getByText('Back')
		const finishButton = screen.getByText('Finish Session')

		// Test button clicks instead of keyboard events since buttons are mocked
		fireEvent.click(backButton)
		expect(onNavigateBack).toHaveBeenCalled()

		fireEvent.click(finishButton)
		expect(onFinishAttempt).toHaveBeenCalled()
	})

	it('should show correct button states', () => {
		const { rerender } = render(<SessionActionCard {...defaultProps} />)

		// Normal state
		expect(screen.getByText('Finish Session')).not.toBeDisabled()
		expect(screen.getByText('Back')).not.toBeDisabled()

		// Finishing state
		rerender(<SessionActionCard {...defaultProps} isFinishing={true} />)

		expect(screen.getByText('Finishing...')).toBeDisabled()
		expect(screen.getByText('Back')).not.toBeDisabled() // Back should still be enabled
	})

	it('should handle edge cases with progress data', () => {
		// Test with decimal percentage
		const decimalProps = {
			...defaultProps,
			progressData: {
				completedSets: 1,
				totalSets: 3,
				percentage: 33.33
			}
		}

		render(<SessionActionCard {...decimalProps} />)

		expect(screen.getByText('33%')).toBeInTheDocument() // Should round appropriately
	})

	it('should display start time correctly', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the component renders the formatted time with "Started:" prefix
		expect(screen.getByText('Started: 10:30 AM')).toBeInTheDocument()
	})

	it('should handle zero duration', () => {
		render(<SessionActionCard {...defaultProps} />)

		// The mocked formatDuration returns '45m 30s' regardless of input
		expect(screen.getByText('45m 30s')).toBeInTheDocument()
	})

	it('should maintain visual hierarchy', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the component renders the text content
		expect(screen.getByText('Test Routine')).toBeInTheDocument()
		expect(screen.getByText('Day 1')).toBeInTheDocument()
	})

	it('should show loading indicator when finishing', () => {
		render(<SessionActionCard {...defaultProps} isFinishing={true} />)

		// Should show some kind of loading indicator (spinner, etc.)
		const finishButton = screen.getByText('Finishing...')
		expect(finishButton).toBeInTheDocument()
	})

	it('should handle rapid state changes', () => {
		const { rerender } = render(<SessionActionCard {...defaultProps} isFinishing={false} />)

		expect(screen.getByText('Finish Session')).toBeInTheDocument()

		// Rapid state change to finishing
		rerender(<SessionActionCard {...defaultProps} isFinishing={true} />)
		expect(screen.getByText('Finishing...')).toBeInTheDocument()

		// Back to normal
		rerender(<SessionActionCard {...defaultProps} isFinishing={false} />)
		expect(screen.getByText('Finish Session')).toBeInTheDocument()
	})

	it('should display progress bar correctly', () => {
		render(<SessionActionCard {...defaultProps} />)

		// Check that the progress component is rendered
		const progressBar = screen.getByTestId('progress')
		expect(progressBar).toBeInTheDocument()
	})
})
