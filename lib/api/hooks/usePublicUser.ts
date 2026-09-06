import { PublicUserProfile } from '@sunsteel/contracts'
import { useQuery } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

export function usePublicUser(userId: string) {
	const { session } = useAuth()

	return useQuery<PublicUserProfile, Error>({
		queryKey: ['users', 'public', userId],
		queryFn: () => userService.getUserById(userId),
		// Gated on the session, not on the backend verification — see TD-18.
		enabled: !!session && !!userId,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	})
}
