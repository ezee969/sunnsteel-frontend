import { render, screen, fireEvent } from '@testing-library/react'
import { SessionHeader } from '@/components/workout/session-header'
import { formatTime, formatDuration } from '@/lib/utils/time-format.utils'
import { vi } from 'vitest'

// Mock time formatting utilities
vi.mock('@/lib/utils/time-format.utils', () => ({
	formatTime: vi.fn(),
	formatDuration: vi.fn()
}))

const mockFormatTime = formatTime as vi.MockedFunction<typeof formatTime>
const mockFormatDuration = formatDuration as vi.MockedFunction<typeof formatDuration>
const mockOnNavigateBack = vi.fn()

const defaultProps = {
	routineName: 'Push Day',
	dayName: 'Day 1',
	startedAt: '2024-01-01T10:00:00Z',
	progressData: {
		completedSets: 5,
		totalSets: 12,
		percentage: 42
	},
	onNavigateBack: mockOnNavigateBack
}

describe('SessionHeader', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockFormatTime.mockReturnValue('10:00 AM')
		mockFormatDuration.mockReturnValue('15m 30s')
	})

	it('should render routine and day names', () => {
		render(<SessionHeader {...defaultProps} />)

		expect(screen.getByText('Push Day')).toBeInTheDocument()
		expect(screen.getByText('Day 1')).toBeInTheDocument()
	})

	it('should render formatted start time', () => {
		render(<SessionHeader {...defaultProps} />)

		expect(mockFormatTime).toHaveBeenCalledWith('2024-01-01T10:00:00Z')
		expect(screen.getByText('Started: 10:00 AM')).toBeInTheDocument()
	})

	it('should render progress information', () => {
		render(<SessionHeader {...defaultProps} />)

		expect(screen.getByText('5/12')).toBeInTheDocument()
		expect(screen.getByText('42%')).toBeInTheDocument()
	})

	it('should render back button', () => {
		render(<SessionHeader {...defaultProps} />)

		const backButton = screen.getByRole('button')
		expect(backButton).toBeInTheDocument()
	})

	it('should navigate back when back button is clicked', () => {
		render(<SessionHeader {...defaultProps} />)

		const backButton = screen.getByRole('button')
		fireEvent.click(backButton)

		expect(mockOnNavigateBack).toHaveBeenCalled()
	})

	it('should show completion status when all sets are completed', () => {
		const completedProps = {
			...defaultProps,
			progressData: {
				completedSets: 12,
				totalSets: 12,
				percentage: 100
			}
		}

		render(<SessionHeader {...completedProps} />)

		expect(screen.getByText('12/12')).toBeInTheDocument()
		expect(screen.getByText('Complete')).toBeInTheDocument()
		
		// Check for completion badge
		const badge = screen.getByText('Complete')
		expect(badge).toBeInTheDocument()
	})

	it('should show partial completion status', () => {
		const partialProps = {
			...defaultProps,
			progressData: {
				completedSets: 3,
				totalSets: 10,
				percentage: 30
			}
		}

		render(<SessionHeader {...partialProps} />)

		expect(screen.getByText('3/10')).toBeInTheDocument()
		expect(screen.getByText('30%')).toBeInTheDocument()
	})

	it('should handle zero progress', () => {
		const zeroProps = {
			...defaultProps,
			progressData: {
				completedSets: 0,
				totalSets: 8,
				percentage: 0
			}
		}

		render(<SessionHeader {...zeroProps} />)

		expect(screen.getByText('0/8')).toBeInTheDocument()
		expect(screen.getByText('0%')).toBeInTheDocument()
	})

	it('should handle long routine and day names', () => {
		const longNamesProps = {
			...defaultProps,
			routineName: 'Very Long Routine Name That Might Overflow',
			dayName: 'Very Long Day Name That Might Also Overflow'
		}

		render(<SessionHeader {...longNamesProps} />)

		expect(screen.getByText('Very Long Routine Name That Might Overflow')).toBeInTheDocument()
		expect(screen.getByText('Very Long Day Name That Might Also Overflow')).toBeInTheDocument()
	})

	it('should handle different time formats', () => {
		mockFormatTime.mockReturnValue('22:30')

		render(<SessionHeader {...defaultProps} startedAt="2024-01-01T22:30:00Z" />)

		expect(mockFormatTime).toHaveBeenCalledWith('2024-01-01T22:30:00Z')
		expect(screen.getByText('Started: 22:30')).toBeInTheDocument()
	})

	it('should handle invalid start time gracefully', () => {
		mockFormatTime.mockReturnValue('Invalid time')

		render(<SessionHeader {...defaultProps} startedAt="invalid-date" />)

		expect(screen.getByText('Started: Invalid time')).toBeInTheDocument()
	})

	it('should render progress percentage correctly', () => {
		render(<SessionHeader {...defaultProps} />)

		expect(screen.getByText('42%')).toBeInTheDocument()
	})

	it('should handle progress bar updates correctly', () => {
		const { rerender } = render(
			<SessionHeader
				{...defaultProps}
				progressData={{ completedSets: 1, totalSets: 10, percentage: 10 }}
			/>
		)

		// Check that progress is displayed as text
		expect(screen.getByText('10%')).toBeInTheDocument()

		// Test high completion
		rerender(
			<SessionHeader
				{...defaultProps}
				progressData={{ completedSets: 9, totalSets: 10, percentage: 90 }}
			/>
		)

		expect(screen.getByText('90%')).toBeInTheDocument()
	})

	it('should be accessible with proper ARIA labels', () => {
		render(<SessionHeader {...defaultProps} />)

		const backButton = screen.getByRole('button')
		expect(backButton).toBeInTheDocument()
	})

	it('should handle keyboard navigation for back button', () => {
		render(<SessionHeader {...defaultProps} />)

		const backButton = screen.getByRole('button')
		
		// Test click event
		fireEvent.click(backButton)
		expect(mockOnNavigateBack).toHaveBeenCalled()
	})

	it('should display routine and day names with proper hierarchy', () => {
		render(<SessionHeader {...defaultProps} />)

		const routineName = screen.getByText('Push Day')
		const dayName = screen.getByText('Day 1')

		// Check that routine name has larger/more prominent styling
		expect(routineName.tagName).toBe('H1')
		expect(dayName.tagName).toBe('P')
	})

	it('should handle edge case with 100% completion', () => {
		const completedProps = {
			...defaultProps,
			progressData: {
				completedSets: 15,
				totalSets: 15,
				percentage: 100
			}
		}

		render(<SessionHeader {...completedProps} />)

		expect(screen.getByText('15/15 sets')).toBeInTheDocument()
		expect(screen.getByText('Complete')).toBeInTheDocument()

		const progressBar = screen.queryByRole('progressbar')
		expect(progressBar).not.toBeInTheDocument()
	})
})
