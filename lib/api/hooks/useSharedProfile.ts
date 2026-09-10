import { PublicUserProfile } from '@sunsteel/contracts'
import { useQuery } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export function useSharedProfile(identifier: string) {
	const { isLoading: isAuthLoading } = useSupabaseAuth()
	const query = useQuery<PublicUserProfile, Error>({
		queryKey: ['profiles', 'shared', identifier],
		queryFn: () => userService.getSharedProfile(identifier),
		// INITIAL_SESSION may clear the query cache when it resolves to signed out.
		// Waiting for that one-time auth decision prevents a just-started anonymous
		// read from being removed while its component is still observing it.
		enabled: !isAuthLoading && !!identifier,
		staleTime: 0,
	})

	return {
		...query,
		isLoading: isAuthLoading || query.isLoading,
	}
}
