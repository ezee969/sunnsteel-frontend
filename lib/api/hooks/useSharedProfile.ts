import { PublicUserProfile } from '@sunsteel/contracts'
import { useQuery } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export function useSharedProfile(identifier: string) {
	return useQuery<PublicUserProfile, Error>({
		queryKey: ['profiles', 'shared', identifier],
		queryFn: () => userService.getSharedProfile(identifier),
		enabled: !!identifier,
		staleTime: 0,
	})
}
