import type {
	SessionShare,
	SessionShareField,
	SessionShareListResponse,
	SharedSessionRecap,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { workoutService } from '@/lib/api/services/workoutService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const sessionShareKeys = {
	list: (sessionId: string) =>
		['workout', 'session', sessionId, 'shares'] as const,
	shared: (token: string) => ['shared', 'session', token] as const,
}

/** The owner's active links for one completed session. */
export function useSessionShares(sessionId: string, enabled = true) {
	const { session } = useSupabaseAuth()
	return useQuery<SessionShareListResponse>({
		queryKey: sessionShareKeys.list(sessionId),
		queryFn: () => workoutService.listSessionShares(sessionId),
		enabled: enabled && !!session && !!sessionId,
	})
}

export function useCreateSessionShare(sessionId: string) {
	const queryClient = useQueryClient()
	return useMutation<SessionShare, Error, SessionShareField[]>({
		mutationFn: fields =>
			workoutService.createSessionShare(sessionId, { fields }),
		onSuccess: share => {
			queryClient.setQueryData<SessionShareListResponse>(
				sessionShareKeys.list(sessionId),
				data => ({ items: [share, ...(data?.items ?? [])] }),
			)
		},
	})
}

export function useRevokeSessionShare(sessionId: string) {
	const queryClient = useQueryClient()
	return useMutation<void, Error, string>({
		mutationFn: shareId =>
			workoutService.revokeSessionShare(sessionId, shareId),
		onSuccess: (_result, shareId) => {
			queryClient.setQueryData<SessionShareListResponse>(
				sessionShareKeys.list(sessionId),
				data =>
					data && { items: data.items.filter(share => share.id !== shareId) },
			)
		},
	})
}

/**
 * The unauthenticated read behind `/shared/sessions/<token>`. It waits for the
 * one-time auth decision for the same reason as `useSharedProfile`, and never
 * serves a cached copy: a revoked link must stop working immediately.
 */
export function useSharedSession(token: string) {
	const { isLoading: isAuthLoading } = useSupabaseAuth()
	const query = useQuery<SharedSessionRecap, Error>({
		queryKey: sessionShareKeys.shared(token),
		queryFn: () => workoutService.getSharedSession(token),
		enabled: !isAuthLoading && !!token,
		staleTime: 0,
	})
	return { ...query, isLoading: isAuthLoading || query.isLoading }
}
