'use client'

import type {
	RoutineDiscoveryQuery,
	RoutineDiscoveryResponse,
} from '@sunsteel/contracts'
import { useInfiniteQuery } from '@tanstack/react-query'

import { routineDiscoveryService } from '@/lib/api/services/routineDiscoveryService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const routineDiscoveryKeys = {
	all: () => ['routines', 'discover'] as const,
	query: (query: RoutineDiscoveryQuery) =>
		['routines', 'discover', query] as const,
}

/**
 * ROUT-07. Paged with the server's opaque cursor rather than an offset the
 * client computes, so the page boundary stays the server's business.
 */
export function useRoutineDiscovery(query: RoutineDiscoveryQuery) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<RoutineDiscoveryResponse>({
		queryKey: routineDiscoveryKeys.query(query),
		queryFn: ({ pageParam }) =>
			routineDiscoveryService.discover({
				...query,
				cursor: pageParam as string | undefined,
			}),
		initialPageParam: undefined,
		getNextPageParam: last => last.nextCursor,
		enabled: !!session,
	})
}
