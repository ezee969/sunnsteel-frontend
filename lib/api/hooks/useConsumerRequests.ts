import type { CreateConsumerRequest } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { consumerRequestService } from '@/lib/api/services/consumerRequestService'

export const consumerRequestKeys = {
	list: ['moderation', 'consumer-requests'] as const,
}

/** BILL-07: makes a revocation or cancellation request; no account needed. */
export function useCreateConsumerRequest() {
	return useMutation({
		mutationFn: (request: CreateConsumerRequest) =>
			consumerRequestService.create(request),
	})
}

/** BILL-07: every request, open ones first; a moderator's read. */
export function useConsumerRequests() {
	return useQuery({
		queryKey: consumerRequestKeys.list,
		queryFn: () => consumerRequestService.list(),
		staleTime: 0,
	})
}

export function useMarkConsumerRequestDone() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => consumerRequestService.markDone(id),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: consumerRequestKeys.list }),
	})
}
