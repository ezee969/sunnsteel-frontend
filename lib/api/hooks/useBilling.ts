import type { FeatureKey, PlanLimitKey } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

/** BILL-03: opens the member's one waiting attempt, or returns it. */
export function useStartCheckout() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => billingService.startCheckout(),
		onSuccess: data => queryClient.setQueryData(billingKeys.me, data.billing),
	})
}

/**
 * Asks the server to read the provider on coming back from it; `refetch` asks
 * again. A query rather than a mutation because it runs by itself on arrival:
 * a mutation fired from an effect loses its observer when React re-runs
 * effects, and the page stayed on "Checking" after Pro had started. Asking
 * twice is harmless, since the server grants once. The answer carries the
 * plan, and the profile carries it too, so that is read again; a billing read
 * already on its way would be older than the answer, so it is cancelled.
 */
export function useCheckoutConfirmation(id: string | null) {
	const queryClient = useQueryClient()
	const { session, isLoading } = useSupabaseAuth()
	return useQuery({
		queryKey: [...billingKeys.all, 'checkout', id],
		queryFn: async () => {
			const data = await billingService.confirmCheckout(id as string)
			await queryClient.cancelQueries({ queryKey: billingKeys.me })
			queryClient.setQueryData(billingKeys.me, data.billing)
			void queryClient.invalidateQueries({ queryKey: ['user'] })
			return data.attempt
		},
		enabled: id !== null && !isLoading && Boolean(session),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	})
}

/**
 * BILL-04: cancels the subscription. The answer is the billing state; the
 * profile carries the plan too, so it is read again.
 */
export function useCancelSubscription() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => billingService.cancelSubscription(),
		onSuccess: data => {
			queryClient.setQueryData(billingKeys.me, data)
			void queryClient.invalidateQueries({ queryKey: ['user'] })
		},
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
