import type { FeatureKey, PlanLimitKey } from '@sunsteel/contracts'
import { useQuery } from '@tanstack/react-query'

import { billingService } from '@/lib/api/services/billingService'
import {
	entitlementLimit,
	type EntitlementState,
	entitlementState,
} from '@/lib/utils/entitlements'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

/** BILL-01: everything billing reads lives under `['billing']`. */
export const billingKeys = {
	all: ['billing'] as const,
	me: ['billing', 'me'] as const,
}

/**
 * The caller's plan, what it unlocks and the grants behind it. A grant can
 * begin, expire or be revoked with no page open, so it is read again on
 * every mount rather than served from a five-minute cache.
 */
export function useBilling() {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery({
		queryKey: billingKeys.me,
		queryFn: billingService.status,
		enabled: !isLoading && Boolean(session),
		staleTime: 0,
	})
}

/** Whether the server says this account may use a capability now. */
export function useEntitlement(feature: FeatureKey): EntitlementState & {
	isLoading: boolean
} {
	const query = useBilling()
	return {
		...entitlementState(query.data, feature),
		isLoading: query.isLoading,
	}
}

/** A counted capability's limit, as the server answered it. */
export function usePlanLimit(key: PlanLimitKey): number | null | undefined {
	return entitlementLimit(useBilling().data, key)
}
