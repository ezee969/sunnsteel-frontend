import type {
	BillingStatus,
	FeatureKey,
	PlanLimitKey,
} from '@sunsteel/contracts'

/**
 * BILL-02: the rows of `/plans`, in the order of the owner's Pro split. Each
 * names the capability the server decides it by, so a row can never claim
 * something the server does not gate. A row with its own words for each
 * column states them; the others are included or not.
 */
export const PLAN_ROWS = [
	{ key: 'strength', feature: 'STRENGTH_TRENDS_LONG_RANGES', worded: true },
	{ key: 'comparison', feature: 'TRAINING_COMPARISON', worded: false },
	{ key: 'signals', feature: 'TRAINING_SIGNALS', worded: false },
	{ key: 'muscles', feature: 'MUSCLE_HISTORY_LONG', worded: true },
	{ key: 'blocks', feature: 'TRAINING_BLOCKS', worded: false },
	{ key: 'deloads', feature: 'PLANNED_DELOADS', worded: false },
	{ key: 'eightWeek', feature: 'EIGHT_WEEK_BLOCKS', worded: false },
	{ key: 'versions', limit: 'ROUTINE_VERSIONS', worded: true },
	{ key: 'goals', feature: 'GOAL_SUGGESTIONS', limit: 'GOALS', worded: true },
	{ key: 'locations', limit: 'TRAINING_LOCATIONS', worded: true },
	{ key: 'body', feature: 'BODY_MEASUREMENTS', worded: true },
	{ key: 'dashboard', feature: 'DASHBOARD_CUSTOMIZATION', worded: false },
] as const satisfies ReadonlyArray<{
	key: string
	feature?: FeatureKey
	limit?: PlanLimitKey
	worded: boolean
}>

export type PlanRowKey = (typeof PLAN_ROWS)[number]['key']

/** How the account's plan reads at the top of `/plans` and in Settings. */
export type CurrentPlan =
	{ kind: 'FREE' } | { kind: 'PRO'; until: string | null }

/**
 * The plan as the server answered it, with the end of the Pro grant that
 * lasts longest -- `grants` arrive longest first -- or none when one never
 * ends.
 */
export function currentPlan(status: BillingStatus): CurrentPlan {
	if (status.plan !== 'PRO') return { kind: 'FREE' }
	const pro = status.grants.find(grant => grant.planId === 'PRO')
	return { kind: 'PRO', until: pro?.expiresAt ?? null }
}
