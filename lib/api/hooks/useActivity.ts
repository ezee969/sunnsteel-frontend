'use client'

import type {
	ActivityCommentsResponse,
	ActivityCommentSummary,
	ActivityFeedResponse,
	ActivityPage,
	ActivityPreviewAudience,
	ActivitySharingSettings,
	CreateActivityCommentRequest,
	MemberActivityResponse,
	OwnActivityResponse,
	SetActivityEntryAudienceRequest,
	SetActivityEntryAudienceResponse,
	SetActivityReactionRequest,
	SetActivityReactionResponse,
	UpdateActivitySharingRequest,
} from '@sunsteel/contracts'
import {
	type InfiniteData,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import { activityService } from '@/lib/api/services/activityService'
import {
	applyEntryComments,
	applyEntryReactions,
	applyEntrySharing,
} from '@/lib/utils/activity'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

/**
 * Everything activity lives under `['activity']`, so one invalidation reaches
 * the feed, a profile's activity, the owner's list and every preview after
 * any change that could alter who sees what.
 */
export const activityKeys = {
	all: () => ['activity'] as const,
	feed: () => ['activity', 'feed'] as const,
	member: (identifier: string) => ['activity', 'member', identifier] as const,
	mine: () => ['activity', 'mine'] as const,
	preview: (audience: ActivityPreviewAudience) =>
		['activity', 'preview', audience] as const,
	sharing: () => ['activity', 'sharing'] as const,
	// SOC-06: under the same prefix, so one invalidation still reaches
	// everything an entry is on screen in.
	comments: (entryId: string) => ['activity', 'comments', entryId] as const,
}

/** SOC-03: the members the viewer follows, as their audiences allow. */
export function useActivityFeed() {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<ActivityFeedResponse>({
		queryKey: activityKeys.feed(),
		queryFn: ({ pageParam }) =>
			activityService.feed({ cursor: pageParam as string | undefined }),
		initialPageParam: undefined,
		getNextPageParam: last => last.nextCursor,
		enabled: !!session,
	})
}

/**
 * One member's activity as this viewer may see it. `staleTime: 0`, as for a
 * member's routine: an audience narrowed since the profile loaded must stop
 * showing at once.
 */
export function useMemberActivity(identifier: string, enabled = true) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<MemberActivityResponse>({
		queryKey: activityKeys.member(identifier),
		queryFn: ({ pageParam }) =>
			activityService.member(identifier, {
				cursor: pageParam as string | undefined,
			}),
		initialPageParam: undefined,
		getNextPageParam: last => last.nextCursor,
		enabled: enabled && !!session && !!identifier,
		staleTime: 0,
	})
}

/** SOC-04: every entry of the owner's, with how each is shared. */
export function useOwnActivity(enabled = true) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<OwnActivityResponse>({
		queryKey: activityKeys.mine(),
		queryFn: ({ pageParam }) =>
			activityService.mine({ cursor: pageParam as string | undefined }),
		initialPageParam: undefined,
		getNextPageParam: last => last.nextCursor,
		enabled: enabled && !!session,
	})
}

/** What one audience would receive, from the same read the audience gets. */
export function useActivityPreview(
	audience: ActivityPreviewAudience,
	enabled = true,
) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<ActivityPage>({
		queryKey: activityKeys.preview(audience),
		queryFn: ({ pageParam }) =>
			activityService.preview(audience, {
				cursor: pageParam as string | undefined,
			}),
		initialPageParam: undefined,
		getNextPageParam: last => last.nextCursor,
		enabled: enabled && !!session,
		staleTime: 0,
	})
}

export function useActivitySharing() {
	const { session } = useSupabaseAuth()
	return useQuery<ActivitySharingSettings>({
		queryKey: activityKeys.sharing(),
		queryFn: activityService.sharing,
		enabled: !!session,
	})
}

/** A default applies to past entries too, so every activity read is stale after one. */
export function useUpdateActivitySharing() {
	const queryClient = useQueryClient()
	return useMutation<
		ActivitySharingSettings,
		Error,
		UpdateActivitySharingRequest
	>({
		mutationFn: activityService.updateSharing,
		onSuccess: settings => {
			queryClient.setQueryData(activityKeys.sharing(), settings)
			void queryClient.invalidateQueries({ queryKey: activityKeys.all() })
		},
	})
}

/**
 * SOC-05. One entry's reactions, patched wherever that entry is loaded — the
 * feed, a member's profile, the owner's list, a preview — because the same
 * entry can be on screen in more than one of them and they must not disagree.
 * The server returns the summary it resolved, so nothing is guessed here.
 */
export function useSetActivityReaction() {
	const queryClient = useQueryClient()
	return useMutation<
		SetActivityReactionResponse,
		Error,
		SetActivityReactionRequest
	>({
		mutationFn: activityService.setReaction,
		onSuccess: response => {
			queryClient.setQueriesData(
				{ queryKey: activityKeys.all() },
				(current: unknown) =>
					current &&
					typeof current === 'object' &&
					'pages' in current &&
					Array.isArray((current as { pages: unknown }).pages)
						? applyEntryReactions(
								current as InfiniteData<{
									entries: {
										id: string
										reactions: SetActivityReactionResponse['reactions']
									}[]
								}>,
								response,
							)
						: current,
			)
		},
	})
}

/**
 * One entry's audience. The owner's list is patched in place with the
 * sharing the server resolved, so the row states the audience that took
 * effect without refetching every page; the previews are refetched because
 * the entry may have entered or left them.
 */
export function useSetActivityEntryAudience() {
	const queryClient = useQueryClient()
	return useMutation<
		SetActivityEntryAudienceResponse,
		Error,
		SetActivityEntryAudienceRequest
	>({
		mutationFn: activityService.setEntryAudience,
		onSuccess: response => {
			queryClient.setQueryData<InfiniteData<OwnActivityResponse>>(
				activityKeys.mine(),
				current => (current ? applyEntrySharing(current, response) : current),
			)
			for (const audience of ['FOLLOWERS', 'PUBLIC'] as const) {
				void queryClient.invalidateQueries({
					queryKey: activityKeys.preview(audience),
				})
			}
		},
	})
}

/**
 * SOC-06. One entry's comments, paged. `staleTime: 0` because a comment
 * deleted by its author or hidden by a moderator must stop showing at once —
 * a stale list of somebody else's words is the wrong thing to keep.
 */
export function useActivityComments(entryId: string, enabled = true) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<ActivityCommentsResponse>({
		queryKey: activityKeys.comments(entryId),
		queryFn: ({ pageParam }) =>
			activityService.comments({
				entryId,
				cursor: (pageParam as string | undefined) ?? undefined,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: last => last.nextCursor ?? undefined,
		enabled: enabled && !!session,
		staleTime: 0,
	})
}

/**
 * Writing and removing both patch the count into every loaded activity query,
 * because one entry can be on screen in the feed, on a profile and in the
 * owner's list at once; the list itself is invalidated so the new or removed
 * comment appears where it lives.
 */
function useCommentMutation<TVariables>(
	run: (variables: TVariables) => Promise<{
		entryId: string
		summary: ActivityCommentSummary
	}>,
) {
	const queryClient = useQueryClient()
	return useMutation<
		{ entryId: string; summary: ActivityCommentSummary },
		Error,
		TVariables
	>({
		mutationFn: run,
		onSuccess: response => {
			queryClient.setQueriesData(
				{ queryKey: activityKeys.all() },
				(current: unknown) =>
					current &&
					typeof current === 'object' &&
					'pages' in current &&
					Array.isArray((current as { pages: unknown }).pages)
						? applyEntryComments(
								current as InfiniteData<{
									entries: { id: string; comments: ActivityCommentSummary }[]
								}>,
								response,
							)
						: current,
			)
			void queryClient.invalidateQueries({
				queryKey: activityKeys.comments(response.entryId),
			})
		},
	})
}

export function useCreateActivityComment() {
	// The create response carries the comment as well, which the summary patch
	// does not need; the list read is invalidated for it.
	return useCommentMutation<CreateActivityCommentRequest>(async request => {
		const response = await activityService.createComment(request)
		return { entryId: request.entryId, summary: response.summary }
	})
}

export function useDeleteActivityComment() {
	return useCommentMutation<string>(activityService.deleteComment)
}
