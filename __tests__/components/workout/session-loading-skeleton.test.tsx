import { render, screen } from '@testing-library/react'
import { SessionLoadingSkeleton } from '@/components/workout/session-loading-skeleton'

describe('SessionLoadingSkeleton', () => {
	it('should render with default props', () => {
		render(<SessionLoadingSkeleton />)

		// Should render header skeleton by default
		expect(screen.getByTestId('header-skeleton')).toBeInTheDocument()

		// Should render action card skeleton by default
		expect(screen.getByTestId('action-card-skeleton')).toBeInTheDocument()

		// Should render default number of exercise groups (3)
		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(3)
	})

	it('should render without header when showHeader is false', () => {
		render(<SessionLoadingSkeleton showHeader={false} />)

		expect(screen.queryByTestId('header-skeleton')).not.toBeInTheDocument()
		expect(screen.getByTestId('action-card-skeleton')).toBeInTheDocument()
	})

	it('should render without action card when showActionCard is false', () => {
		render(<SessionLoadingSkeleton showActionCard={false} />)

		expect(screen.getByTestId('header-skeleton')).toBeInTheDocument()
		expect(screen.queryByTestId('action-card-skeleton')).not.toBeInTheDocument()
	})

	it('should render custom number of exercise groups', () => {
		render(<SessionLoadingSkeleton exerciseCount={5} />)

		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(5)
	})

	it('should render custom number of sets per exercise', () => {
		render(<SessionLoadingSkeleton exerciseCount={2} setsPerExercise={4} />)

		// Check first exercise has 4 sets
		const exercise1Sets = screen.getAllByTestId(/set-skeleton-0-/)
		expect(exercise1Sets).toHaveLength(4)

		// Check second exercise has 4 sets
		const exercise2Sets = screen.getAllByTestId(/set-skeleton-1-/)
		expect(exercise2Sets).toHaveLength(4)
	})

	it('should render zero exercises when exerciseCount is 0', () => {
		render(<SessionLoadingSkeleton exerciseCount={0} />)

		const exerciseSkeletons = screen.queryAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(0)
	})

	it('should render zero sets when setsPerExercise is 0', () => {
		render(<SessionLoadingSkeleton exerciseCount={2} setsPerExercise={0} />)

		const setSkeletons = screen.queryAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(0)
	})

	it('should render single exercise with single set', () => {
		render(<SessionLoadingSkeleton exerciseCount={1} setsPerExercise={1} />)

		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(1)

		const setSkeletons = screen.getAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(1)
		expect(screen.getByTestId('set-skeleton-0-0')).toBeInTheDocument()
	})

	it('should render large number of exercises and sets', () => {
		render(<SessionLoadingSkeleton exerciseCount={10} setsPerExercise={8} />)

		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(10)

		const setSkeletons = screen.getAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(80) // 10 exercises × 8 sets
	})

	it('should have proper skeleton structure for header', () => {
		render(<SessionLoadingSkeleton />)

		const headerSkeleton = screen.getByTestId('header-skeleton')
		expect(headerSkeleton).toBeInTheDocument()

		// Should have skeleton elements within the header
		const skeletonElements = headerSkeleton.querySelectorAll('.animate-pulse')
		expect(skeletonElements.length).toBeGreaterThan(0)
	})

	it('should have proper skeleton structure for action card', () => {
		render(<SessionLoadingSkeleton />)

		const actionCardSkeleton = screen.getByTestId('action-card-skeleton')
		expect(actionCardSkeleton).toBeInTheDocument()

		// Should have skeleton elements within the action card
		const skeletonElements = actionCardSkeleton.querySelectorAll('.animate-pulse')
		expect(skeletonElements.length).toBeGreaterThan(0)
	})

	it('should have proper skeleton structure for exercises', () => {
		render(<SessionLoadingSkeleton exerciseCount={1} setsPerExercise={1} />)

		const exerciseSkeleton = screen.getByTestId('exercise-skeleton-0')
		expect(exerciseSkeleton).toBeInTheDocument()

		// Should have skeleton elements within the exercise card
		const skeletonElements = exerciseSkeleton.querySelectorAll('.animate-pulse')
		expect(skeletonElements.length).toBeGreaterThan(0)
	})

	it('should have proper skeleton structure for sets', () => {
		render(<SessionLoadingSkeleton exerciseCount={1} setsPerExercise={1} />)

		const setSkeleton = screen.getByTestId('set-skeleton-0-0')
		expect(setSkeleton).toBeInTheDocument()

		// Should have skeleton elements within the set container
		const skeletonElements = setSkeleton.querySelectorAll('.animate-pulse')
		expect(skeletonElements.length).toBeGreaterThan(0)
	})

	it('should maintain consistent spacing and layout', () => {
		render(<SessionLoadingSkeleton />)

		// Check that components are properly spaced
		const container = screen.getByTestId('session-loading-skeleton')
		expect(container).toHaveClass('space-y-6')
	})

	it('should handle edge case with negative values gracefully', () => {
		// Component should handle negative values by treating them as 0
		render(<SessionLoadingSkeleton exerciseCount={-1} setsPerExercise={-1} />)

		const exerciseSkeletons = screen.queryAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(0)

		const setSkeletons = screen.queryAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(0)
	})

	it('should render all components when all props are true', () => {
		render(
			<SessionLoadingSkeleton
				showHeader={true}
				showActionCard={true}
				exerciseCount={2}
				setsPerExercise={3}
			/>
		)

		expect(screen.getByTestId('header-skeleton')).toBeInTheDocument()
		expect(screen.getByTestId('action-card-skeleton')).toBeInTheDocument()
		expect(screen.getAllByTestId(/exercise-skeleton-/)).toHaveLength(2)
		expect(screen.getAllByTestId(/set-skeleton-/)).toHaveLength(6)
	})

	it('should render minimal skeleton when all optional props are false/zero', () => {
		render(
			<SessionLoadingSkeleton
				showHeader={false}
				showActionCard={false}
				exerciseCount={0}
				setsPerExercise={0}
			/>
		)

		expect(screen.queryByTestId('header-skeleton')).not.toBeInTheDocument()
		expect(screen.queryByTestId('action-card-skeleton')).not.toBeInTheDocument()
		expect(screen.queryAllByTestId(/exercise-skeleton-/)).toHaveLength(0)
		expect(screen.queryAllByTestId(/set-skeleton-/)).toHaveLength(0)

		// Should still render the container
		expect(screen.getByTestId('session-loading-skeleton')).toBeInTheDocument()
	})

	it('should have proper accessibility attributes', () => {
		render(<SessionLoadingSkeleton />)

		const container = screen.getByTestId('session-loading-skeleton')
		expect(container).toHaveAttribute('aria-label', 'Loading session data')
		expect(container).toHaveAttribute('role', 'status')
	})

	it('should use consistent skeleton styling across components', () => {
		render(<SessionLoadingSkeleton exerciseCount={1} setsPerExercise={1} />)

		// All skeleton elements should have animate-pulse class
		const headerSkeleton = screen.getByTestId('header-skeleton')
		const actionCardSkeleton = screen.getByTestId('action-card-skeleton')
		const exerciseSkeleton = screen.getByTestId('exercise-skeleton-0')
		const setSkeleton = screen.getByTestId('set-skeleton-0-0')

		// Check that skeleton containers exist
		expect(headerSkeleton).toBeInTheDocument()
		expect(actionCardSkeleton).toBeInTheDocument()
		expect(exerciseSkeleton).toBeInTheDocument()
		expect(setSkeleton).toBeInTheDocument()

		// Check that skeleton elements within containers have animate-pulse
		const skeletonElements = screen.getAllByRole('generic', { hidden: true })
		const animatedSkeletons = skeletonElements.filter(el => 
			el.className.includes('animate-pulse')
		)
		expect(animatedSkeletons.length).toBeGreaterThan(0)
	})

	it('should render correct test ids for all elements', () => {
		render(<SessionLoadingSkeleton exerciseCount={2} setsPerExercise={2} />)

		// Check main container
		expect(screen.getByTestId('session-loading-skeleton')).toBeInTheDocument()

		// Check header and action card
		expect(screen.getByTestId('header-skeleton')).toBeInTheDocument()
		expect(screen.getByTestId('action-card-skeleton')).toBeInTheDocument()

		// Check exercises
		expect(screen.getByTestId('exercise-skeleton-0')).toBeInTheDocument()
		expect(screen.getByTestId('exercise-skeleton-1')).toBeInTheDocument()

		// Check sets
		expect(screen.getByTestId('set-skeleton-0-0')).toBeInTheDocument()
		expect(screen.getByTestId('set-skeleton-0-1')).toBeInTheDocument()
		expect(screen.getByTestId('set-skeleton-1-0')).toBeInTheDocument()
		expect(screen.getByTestId('set-skeleton-1-1')).toBeInTheDocument()
	})

	it('should handle decimal values by rounding down', () => {
		// Component should handle decimal values appropriately
		render(<SessionLoadingSkeleton exerciseCount={2.7} setsPerExercise={3.9} />)

		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(2) // Should round down 2.7 to 2

		const setSkeletons = screen.getAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(6) // 2 exercises × 3 sets (3.9 rounded down to 3)
	})

	it('should maintain performance with large numbers', () => {
		// Test that component can handle reasonably large numbers without issues
		const startTime = performance.now()
		
		render(<SessionLoadingSkeleton exerciseCount={10} setsPerExercise={5} />)
		
		const endTime = performance.now()
		const renderTime = endTime - startTime

		// Should render within reasonable time (less than 200ms for moderate components)
		expect(renderTime).toBeLessThan(200)

		// Should still render correct number of elements
		const exerciseSkeletons = screen.getAllByTestId(/exercise-skeleton-/)
		expect(exerciseSkeletons).toHaveLength(10)

		const setSkeletons = screen.getAllByTestId(/set-skeleton-/)
		expect(setSkeletons).toHaveLength(50)
	})
})
