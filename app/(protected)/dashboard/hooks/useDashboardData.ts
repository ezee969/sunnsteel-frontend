'use client'

import { useEffect, useState } from 'react'

import { useUser } from '@/lib/api/hooks/useUser'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { useTodaysWorkouts } from './useTodaysWorkouts'

/**
 * Single readiness gate for the dashboard.
 *
 * Every dashboard query is kicked off here in parallel and the page renders one
 * loader until all of them have settled (resolved or failed). Sections used to
 * own their own skeletons, which made the screen assemble itself piece by
 * piece — greeting first, then the workouts card, then the stats row.
 *
 * `isPending` is deliberate: a *disabled* query reports `isLoading === false`,
 * so gating on `isLoading` would flash empty content while auth resolves.
 */
export function useDashboardData() {
	const { session, isLoading: isAuthLoading } = useSupabaseAuth()

	const { user, isPending: isUserPending } = useUser()
	const stats = useWorkoutStats()
	const progress = useWorkoutProgress()
	const todaysWorkouts = useTodaysWorkouts()

	// No session means the protected layout / middleware is about to redirect.
	// Hold the loader rather than flashing an empty dashboard on the way out.
	const isBootstrapping = isAuthLoading || !session

	const isSettling =
		isBootstrapping ||
		isUserPending ||
		stats.isPending ||
		progress.isPending ||
		todaysWorkouts.isPending

	// The gate is first-paint only. Once the dashboard has been revealed, a later
	// refetch (or a query-key change — the stats key carries the current week)
	// must not throw the whole screen back to the loader; the sections handle
	// their own transient states from then on.
	const [hasRevealed, setHasRevealed] = useState(false)
	useEffect(() => {
		if (!isSettling) setHasRevealed(true)
	}, [isSettling])

	return {
		isLoading: isSettling && !hasRevealed,
		user,
		stats,
		progress,
		todaysWorkouts,
	}
}
