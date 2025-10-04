import { render } from '@testing-library/react'
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
  },
  isFinishing: false,
  onFinishAttempt: vi.fn(),
  onNavigateBack: vi.fn(),
}

describe('SessionActionCard - Minimal Test', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<SessionActionCard {...defaultProps} />)
    }).not.toThrow()
  })
})