import {
	FollowSuggestionsResponse,
	PublicUserProfile,
	RELATIONSHIP_LIST_DEFAULT_LIMIT,
	RelationshipListKind,
	RelationshipListResponse,
} from '@sunsteel/contracts'
import {
	InfiniteData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import {
	setFollowStateInRelationshipPages,
	setFollowStateInSuggestions,
} from '@/lib/utils/relationships'
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

export const relationshipQueryKeys = {
	all: ['users', 'relationships'] as const,
	list: (identifier: string, kind: RelationshipListKind) =>
		['users', 'relationships', identifier, kind] as const,
	suggestions: ['users', 'suggestions'] as const,
}

export function useRelationshipList(
	identifier: string,
	kind: RelationshipListKind,
) {
	const { session } = useAuth()

	return useInfiniteQuery<RelationshipListResponse>({
		queryKey: relationshipQueryKeys.list(identifier, kind),
		queryFn: ({ pageParam }) =>
			userService.getRelationshipList(identifier, kind, {
				cursor: (pageParam as string | undefined) ?? undefined,
				limit: RELATIONSHIP_LIST_DEFAULT_LIMIT,
			}),
		initialPageParam: undefined,
		getNextPageParam: lastPage => lastPage.nextCursor,
		// Gated on the session, not on the backend verification — see TD-18.
		enabled: !!session && !!identifier,
	})
}

export function useFollowSuggestions(limit?: number) {
	const { session } = useAuth()

	return useQuery<FollowSuggestionsResponse>({
		queryKey: [...relationshipQueryKeys.suggestions, limit ?? null],
		queryFn: () => userService.getFollowSuggestions(limit),
		enabled: !!session,
	})
}

/**
 * Follow or unfollow a member shown in a list. Loaded rows are updated in
 * place; profile reads and the viewer's own counts refetch.
 */
export function useRelationshipFollowToggle() {
	const queryClient = useQueryClient()

	return useMutation<
		PublicUserProfile,
		Error,
		{ userId: string; follow: boolean }
	>({
		mutationFn: ({ userId, follow }) =>
			follow
				? userService.followUser(userId)
				: userService.unfollowUser(userId),
		onSuccess: (_profile, { userId, follow }) => {
			queryClient.setQueriesData<InfiniteData<RelationshipListResponse>>(
				{ queryKey: relationshipQueryKeys.all },
				data => setFollowStateInRelationshipPages(data, userId, follow),
			)
			queryClient.setQueriesData<FollowSuggestionsResponse>(
				{ queryKey: relationshipQueryKeys.suggestions },
				data => setFollowStateInSuggestions(data, userId, follow),
			)
			// Stale but not refetched: the visible rows stay put, and the next
			// visit to any list reads the server's order and membership again.
			queryClient.invalidateQueries({
				queryKey: relationshipQueryKeys.all,
				refetchType: 'none',
			})
			queryClient.invalidateQueries({
				queryKey: relationshipQueryKeys.suggestions,
				refetchType: 'none',
			})
			queryClient.invalidateQueries({ queryKey: ['users', 'public'] })
			queryClient.invalidateQueries({ queryKey: ['user'] })
		},
	})
}
