import { SessionLoadingSkeleton } from '@/features/workout/session-loading-skeleton'

// The page's own skeleton, so the route fallback cannot drift from the screen
// again: this file used to sketch a progress bar and an action panel that
// Phase 13 removed (TD-38).
export default function WorkoutSessionLoading() {
	return <SessionLoadingSkeleton />
}
