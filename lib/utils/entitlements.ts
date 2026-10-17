import type {
	BillingStatus,
	FeatureKey,
	PlanId,
	PlanLimitKey,
} from '@sunsteel/contracts'

/**
 * BILL-01: what the client knows about one capability. **The server decides**:
 * `allowed` is read off the features `GET /billing/me` answered, never worked
 * out from a plan here, and it is null until that answer arrives, so a surface
 * can wait instead of guessing either way.
 */
export interface EntitlementState {
	allowed: boolean | null
	plan: PlanId | null
}

export function entitlementState(
	status: BillingStatus | undefined,
	feature: FeatureKey,
): EntitlementState {
	if (!status) return { allowed: null, plan: null }
	return { allowed: status.features.includes(feature), plan: status.plan }
}

/**
 * A counted capability's limit as the server answered it: a number, null for
 * none of the plan's own, or undefined until the answer arrives.
 */
export function entitlementLimit(
	status: BillingStatus | undefined,
	key: PlanLimitKey,
): number | null | undefined {
	return status ? status.limits[key] : undefined
}
