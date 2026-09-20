'use client'

import type {
	BlockedMembersResponse,
	CreateReportRequest,
	CreateReportResponse,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { moderationService } from '@/lib/api/services/moderationService'
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
