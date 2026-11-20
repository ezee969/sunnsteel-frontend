import type { CreateTrainingReviewRequest } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { trainingReviewService } from '@/lib/api/services/trainingReviewService'

export const trainingReviewKeys = {
	usage: ['training-review', 'usage'] as const,
}

/** The month's reviews; asked only of an account the server said may review. */
export function useTrainingReviewUsage(enabled: boolean) {
	return useQuery({
		queryKey: trainingReviewKeys.usage,
		queryFn: trainingReviewService.usage,
		enabled,
		staleTime: 0,
	})
}

/**
 * INTEL-04: writes a review and stores nothing. A refusal may still have used
 * one of the month's reviews, so the count is read again after any error.
 */
export function useCreateTrainingReview() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: CreateTrainingReviewRequest) =>
			trainingReviewService.create(body),
		onSuccess: result => {
			queryClient.setQueryData(trainingReviewKeys.usage, result.usage)
		},
		onError: () => {
			void queryClient.invalidateQueries({
				queryKey: trainingReviewKeys.usage,
			})
		},
	})
}
