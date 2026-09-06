import { UserProfile } from '@sunsteel/contracts'
import { useQuery } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export function useUser() {
	const { session, isLoading: isLoadingSupabase } = useSupabaseAuth()

	const {
		data: user,
		isLoading,
		isPending,
		error,
		refetch,
	} = useQuery<UserProfile, Error>({
		queryKey: ['user'],
		queryFn: () => userService.getProfile(),
		enabled: !isLoadingSupabase && !!session,
		staleTime: 5 * 60 * 1000,
		retry: 2,
	})
	// During SSR, always return false for isLoading to prevent hydration mismatch
	const safeIsLoading = typeof window === 'undefined' ? false : isLoading

	return {
		user,
		isLoading: safeIsLoading,
		// Unlike `isLoading`, this stays true while the query is still disabled
		// (auth not resolved yet), so callers can use it as a "profile has not
		// settled" gate. It is identical on server and client, so it is safe to
		// branch rendering on it.
		isPending,
		error,
		refetch,
	}
}
