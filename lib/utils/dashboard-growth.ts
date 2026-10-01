import {
	type DashboardLayout,
	type DashboardSectionId,
	DEFAULT_DASHBOARD_LAYOUT,
	isDefaultDashboardLayout,
	normalizeDashboardLayout,
} from '@sunsteel/contracts'

/**
 * UX-19: an account is getting started until it has finished this many
 * workouts. Under it, a never-customized dashboard shows Today's Workouts,
 * This Week and Getting started, and each other section joins once it has
 * something to show.
 */
export const GETTING_STARTED_WORKOUTS = 3

/** What the dashboard's readiness gate already holds; no request is added. */
export interface DashboardGrowthSignals {
	completedWorkouts: number
	recentActivity: number
	personalRecords: number
	followingCount: number
}

/**
 * The server stores a layout equal to the default as null (DASH-05), so a
 * default layout is exactly one the member never changed. A customized
 * layout is never trimmed.
 */
export function isGettingStarted(
	stored: DashboardLayout | undefined,
	completedWorkouts: number,
): boolean {
	return (
		isDefaultDashboardLayout(normalizeDashboardLayout(stored)) &&
		completedWorkouts < GETTING_STARTED_WORKOUTS
	)
}

/**
 * Whether a section has something to show a new account. Training Insights
 * waits for the account to leave getting started: a plateau needs at least
 * three sessions of one lift and the weekly comparison two complete weeks,
 * so under three workouts it could only show its empty state.
 */
const HAS_SOMETHING: Record<
	DashboardSectionId,
	(signals: DashboardGrowthSignals) => boolean
> = {
	'this-week': () => true,
	stats: signals => signals.completedWorkouts > 0,
	'recent-activity': signals => signals.recentActivity > 0,
	'personal-records': signals => signals.personalRecords > 0,
	'training-insights': () => false,
	'upcoming-milestones': signals => signals.completedWorkouts > 0,
	following: signals => signals.followingCount > 0,
}

/**
 * The layout the page lays out: the default order, with a getting-started
 * account's empty sections left out. Nothing here is stored, so the full
 * default returns by itself at the third finished workout.
 */
export function effectiveDashboardLayout(
	stored: DashboardLayout | undefined,
	signals: DashboardGrowthSignals,
): DashboardLayout {
	if (!isGettingStarted(stored, signals.completedWorkouts)) {
		return normalizeDashboardLayout(stored)
	}
	return DEFAULT_DASHBOARD_LAYOUT.map(entry => ({
		id: entry.id,
		hidden: !HAS_SOMETHING[entry.id](signals),
	}))
}

export type GettingStartedStepId = 'routine' | 'workout' | 'gym'

export interface GettingStartedStep {
	id: GettingStartedStepId
	done: boolean
}

/**
 * The Getting started list, in the order a new member meets it: a routine to
 * train, a first finished workout, then the gym its loads round to. Each step
 * is read from data the account already has, so nothing new is stored.
 */
export function gettingStartedSteps({
	routines,
	completedWorkouts,
	trainingLocations,
}: {
	routines: number
	completedWorkouts: number
	trainingLocations: number
}): GettingStartedStep[] {
	return [
		{ id: 'routine', done: routines > 0 },
		{ id: 'workout', done: completedWorkouts > 0 },
		{ id: 'gym', done: trainingLocations > 0 },
	]
}
