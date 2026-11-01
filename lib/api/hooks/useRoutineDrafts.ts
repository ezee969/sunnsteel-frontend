import type { CreateRoutineDraftRequest } from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routineDraftService } from '@/lib/api/services/routineDraftService'

export const routineDraftKeys = {
	usage: ['routine-drafts', 'usage'] as const,
}

/** The month's drafts; asked only of an account the server said may draft. */
export function useRoutineDraftUsage(enabled: boolean) {
	return useQuery({
		queryKey: routineDraftKeys.usage,
		queryFn: routineDraftService.usage,
		enabled,
		staleTime: 0,
	})
}

/** INTEL-03: writes a draft and nothing else; Create stores the routine. */
export function useCreateRoutineDraft() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: CreateRoutineDraftRequest) =>
			routineDraftService.create(body),
		onSuccess: result => {
			queryClient.setQueryData(routineDraftKeys.usage, result.usage)
		},
		onError: () => {
			void queryClient.invalidateQueries({ queryKey: routineDraftKeys.usage })
		},
	})
}
