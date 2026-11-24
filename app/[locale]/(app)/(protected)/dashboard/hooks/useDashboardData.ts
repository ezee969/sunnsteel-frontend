'use client'

import { useEffect, useState } from 'react'

import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { useUser } from '@/lib/api/hooks/useUser'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import { pendingSteps } from '@/lib/onboarding/steps'
import {
	type DashboardGrowthSignals,
	effectiveDashboardLayout,
	gettingStartedSteps,
	isGettingStarted,
} from '@/lib/utils/dashboard-growth'
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
	// Same key Today's Workouts reads, so this adds no request.
	const routines = useRoutines()

	// UX-19: whether the account is getting started is known once the profile
	// and the stats have arrived. Only then, and only for such an account, is
	// the gym read for Getting started's third step -- inside the gate, so the
	// list never arrives after the page and pushes This Week down.
	const completedWorkouts = stats.data?.totalCompleted ?? 0
	const gettingStarted =
		!!user &&
		!!stats.data &&
		isGettingStarted(user.dashboardLayout, completedWorkouts)
	const locations = useTrainingLocations({ enabled: gettingStarted })

	// No session means the protected layout / middleware is about to redirect.
	// Hold the loader rather than flashing an empty dashboard on the way out.
	const isBootstrapping = isAuthLoading || !session

	const isSettling =
		isBootstrapping ||
		isUserPending ||
		stats.isPending ||
		progress.isPending ||
		todaysWorkouts.isPending ||
		(gettingStarted && locations.isPending)

	// The gate is first-paint only. Once the dashboard has been revealed, a later
	// refetch (or a query-key change — the stats key carries the current week)
	// must not throw the whole screen back to the loader; the sections handle
	// their own transient states from then on.
	const [hasRevealed, setHasRevealed] = useState(false)
	useEffect(() => {
		if (!isSettling) setHasRevealed(true)
	}, [isSettling])

	const signals: DashboardGrowthSignals = {
		completedWorkouts,
		recentActivity: progress.data?.recentActivity.length ?? 0,
		personalRecords: progress.data?.personalRecords.length ?? 0,
		followingCount: user?.followingCount ?? 0,
	}

	return {
		isLoading: isSettling && !hasRevealed,
		user,
		stats,
		progress,
		todaysWorkouts,
		gettingStarted,
		layout: effectiveDashboardLayout(user?.dashboardLayout, signals),
		steps: gettingStarted
			? gettingStartedSteps({
					routines: routines.data?.length ?? 0,
					completedWorkouts,
					// A failed read leaves the step open rather than holding the page.
					trainingLocations: locations.data?.length ?? 0,
					setupPending: pendingSteps(user?.onboarding).length > 0,
				})
			: null,
	}
}
