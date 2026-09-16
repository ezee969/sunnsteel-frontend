import type {
	FeaturedProfileSelectionsResponse,
	ReplaceFeaturedProfileItemsRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const featuredProfileKeys = {
	all: ['users', 'profile', 'featured'] as const,
}

export function useFeaturedProfileItems() {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery<FeaturedProfileSelectionsResponse, Error>({
		queryKey: featuredProfileKeys.all,
		queryFn: userService.getFeaturedProfileItems,
		enabled: !isLoading && !!session,
	})
}

export function useReplaceFeaturedProfileItems() {
	const queryClient = useQueryClient()
	return useMutation<
		FeaturedProfileSelectionsResponse,
		Error,
		ReplaceFeaturedProfileItemsRequest
	>({
		mutationFn: userService.replaceFeaturedProfileItems,
		onSuccess: response => {
			queryClient.setQueryData(featuredProfileKeys.all, response)
			void queryClient.invalidateQueries({
				queryKey: ['users', 'public'],
			})
		},
	})
}
