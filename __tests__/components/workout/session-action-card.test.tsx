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

  it('renders progress summary and action button', () => {
    render(<SessionActionCard {...defaultProps} />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Finish Session')).toBeInTheDocument()
  })

  it('displays progress percentage and bar', () => {
    render(<SessionActionCard {...defaultProps} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should call onFinishAttempt when finish button is clicked', () => {
    const onFinishAttempt = vi.fn()
    render(<SessionActionCard {...defaultProps} onFinishAttempt={onFinishAttempt} />)

    const finishButton = screen.getByText('Finish Session')
    fireEvent.click(finishButton)

    expect(onFinishAttempt).toHaveBeenCalled()
  })

  it('should display progress bar', () => {
    render(<SessionActionCard {...defaultProps} />)

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows zero percent progress', () => {
    const zeroProgressProps = {
      ...defaultProps,
      progressData: {
        completedSets: 0,
        totalSets: 10,
        percentage: 0
      }
    }

    render(<SessionActionCard {...zeroProgressProps} />)
    expect(screen.getByText('0%')).toBeInTheDocument()

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows 100% when complete', () => {
    const completeProgressProps = {
      ...defaultProps,
      progressData: {
        completedSets: 10,
        totalSets: 10,
        percentage: 100
      }
    }

    render(<SessionActionCard {...completeProgressProps} />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toBeInTheDocument()
  })

  it('renders without routine header info (handled by header component)', () => {
    render(<SessionActionCard {...defaultProps} />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('invokes finish handler on click', () => {
    const onFinishAttempt = vi.fn()
    render(<SessionActionCard {...defaultProps} onFinishAttempt={onFinishAttempt} />)
    const finishButton = screen.getByText('Finish Session')
    fireEvent.click(finishButton)
    expect(onFinishAttempt).toHaveBeenCalled()
  })

  it('shows correct button states', () => {
    const { rerender } = render(<SessionActionCard {...defaultProps} />)

    // Normal state
    expect(screen.getByText('Finish Session')).not.toBeDisabled()

    // Finishing state
    rerender(<SessionActionCard {...defaultProps} isFinishing={true} />)

    expect(screen.getByText('Finishing...')).toBeDisabled()
  })

  it('displays progress bar correctly', () => {
    render(<SessionActionCard {...defaultProps} />)

    // Check that the progress component is rendered
    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toBeInTheDocument()
  })
})
