'use client'

import type {
	BlockedMembersResponse,
	CreateReportRequest,
	CreateReportResponse,
	ModerationHistoryResponse,
	ModerationQueueResponse,
	ReportStatus,
	ReviewReportRequest,
	ReviewReportResponse,
} from '@sunsteel/contracts'
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import {
	moderationReviewService,
	moderationService,
} from '@/lib/api/services/moderationService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const moderationKeys = {
	blocks: () => ['users', 'me', 'blocks'] as const,
}

export function useBlockedMembers(enabled = true) {
	const { session } = useSupabaseAuth()
	return useQuery<BlockedMembersResponse>({
		queryKey: moderationKeys.blocks(),
		queryFn: moderationService.listBlocks,
		enabled: enabled && !!session,
	})
}

/**
 * A block changes what almost every read may return — search, suggestions,
 * relationship lists, profiles, that member's routines and activity — so it invalidates
 * broadly rather than patching one cache. A stale list that still shows a
 * blocked member reads as the control not working.
 */
function useBlockMutation(
	run: (identifier: string) => Promise<BlockedMembersResponse>,
) {
	const queryClient = useQueryClient()
	return useMutation<BlockedMembersResponse, Error, string>({
		mutationFn: run,
		onSuccess: response => {
			queryClient.setQueryData(moderationKeys.blocks(), response)
			for (const key of [
				['users'],
				['routines'],
				['notifications'],
				['activity'],
			] as const) {
				void queryClient.invalidateQueries({ queryKey: key })
			}
		},
	})
}

export function useBlockMember() {
	return useBlockMutation(moderationService.block)
}

export function useUnblockMember() {
	return useBlockMutation(moderationService.unblock)
}

export function useReportMember() {
	return useMutation<CreateReportResponse, Error, CreateReportRequest>({
		mutationFn: moderationService.report,
	})
}

// Moderation review (TRUST-04) ------------------------------------------------

export const moderationReviewKeys = {
	all: ['moderation'] as const,
	queue: (status: ReportStatus) => ['moderation', 'queue', status] as const,
	actions: () => ['moderation', 'actions'] as const,
}

/**
 * The queue. `staleTime: 0` because a report reviewed in another tab must not
 * still be offered here — acting on an already-reviewed report is refused by
 * the server, and a stale row would make that refusal look like a bug.
 */
export function useModerationQueue(status: ReportStatus, enabled = true) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<ModerationQueueResponse>({
		queryKey: moderationReviewKeys.queue(status),
		queryFn: ({ pageParam }) =>
			moderationReviewService.queue({
				status,
				cursor: (pageParam as string | undefined) ?? undefined,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: last => last.nextCursor ?? undefined,
		enabled: enabled && !!session,
		staleTime: 0,
	})
}

export function useModerationHistory(enabled = true) {
	const { session } = useSupabaseAuth()
	return useInfiniteQuery<ModerationHistoryResponse>({
		queryKey: moderationReviewKeys.actions(),
		queryFn: ({ pageParam }) =>
			moderationReviewService.history({
				cursor: (pageParam as string | undefined) ?? undefined,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: last => last.nextCursor ?? undefined,
		enabled: enabled && !!session,
		staleTime: 0,
	})
}

/**
 * A review action invalidates the whole `['moderation']` prefix rather than
 * patching one row: a dismiss moves a report between two queues, a hide
 * changes the subject of every other report about it, and both add a record
 * to the log. It also invalidates the reads a hide changes — `['users']`,
 * `['routines']` and `['activity']` — for the reason `PROF-10`'s block does:
 * a list still showing hidden content reads as the control failing.
 */
function useReviewMutation(
	run: (
		reportId: string,
		request: ReviewReportRequest,
	) => Promise<ReviewReportResponse>,
) {
	const queryClient = useQueryClient()
	return useMutation<
		ReviewReportResponse,
		Error,
		{ reportId: string; note?: string | null }
	>({
		mutationFn: ({ reportId, note }) => run(reportId, { note: note ?? null }),
		onSuccess: () => {
			for (const key of [
				moderationReviewKeys.all,
				['users'],
				['routines'],
				['activity'],
			] as const) {
				void queryClient.invalidateQueries({ queryKey: key })
			}
		},
	})
}

/**
 * Recording that a moderator opened a reported subject. The caller **awaits
 * this before navigating**: the record is the point, and a navigation that
 * raced it would leave a read nobody could audit.
 */
export function useRecordSubjectView() {
	return useReviewMutation(reportId =>
		moderationReviewService.recordView(reportId),
	)
}

export function useDismissReport() {
	return useReviewMutation(moderationReviewService.dismiss)
}

export function useHideReportedContent() {
	return useReviewMutation(moderationReviewService.hide)
}

export function useRestoreReportedContent() {
	return useReviewMutation(moderationReviewService.restore)
}
