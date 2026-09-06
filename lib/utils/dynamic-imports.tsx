'use client'

/**
 * Route modules worth warming up on user intent (hover/focus), because the
 * user is looking at the control that navigates to them.
 *
 * Keep this list small. It used to cover every page in the app and was fired
 * eagerly on mount, which downloaded most of the bundle on cold start for
 * routes the user might never open. Only add an entry when something actually
 * calls `preloadOnHover` with it.
 */
export const preloadComponents = {
	// Active workout session - heavy real-time component
	activeWorkoutSession: () => {
		import('@/app/(protected)/workouts/sessions/[id]/page')
	},

	// Wizard entry point - heavy routine creation flow
	newRoutinePage: () => {
		import('@/app/(protected)/routines/new/page')
	},

	workoutHistoryPage: () => {
		import('@/app/(protected)/workouts/history/page')
	},
}

/**
 * Hook for preloading a route module when the user signals intent.
 * Spread the result onto the element that triggers the navigation.
 */
export const useComponentPreloading = () => {
	const preloadOnHover = (componentName: keyof typeof preloadComponents) => {
		return {
			onMouseEnter: () => {
				preloadComponents[componentName]?.()
			},
			onFocus: () => {
				preloadComponents[componentName]?.()
			},
		}
	}

	return {
		preloadOnHover,
	}
}
