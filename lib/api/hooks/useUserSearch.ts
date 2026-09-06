import { useQuery } from '@tanstack/react-query'

import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

import { userService } from '../services/userService'

export const useUserSearch = (query: string, limit: number = 5) => {
	const { session } = useAuth()

	return useQuery({
		queryKey: ['users', 'search', query, limit],
		queryFn: async () => {
			if (!query || query.trim().length < 2) return []
			return userService.searchUsers(query, limit)
		},
		// Gated on the session, not on the backend verification — see TD-18.
		enabled: !!session && !!query && query.trim().length >= 2,
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes
		retry: 1,
	})
}
