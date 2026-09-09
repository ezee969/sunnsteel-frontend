import { PublicUserProfile } from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export function useUnfollowUser(userId: string, profileIdentifier = userId) {
	const queryClient = useQueryClient()

	return useMutation<PublicUserProfile, Error>({
		mutationFn: () => userService.unfollowUser(userId),
		onSuccess: updatedProfile => {
			queryClient.setQueryData(
				['users', 'public', profileIdentifier],
				updatedProfile,
			)
			queryClient.invalidateQueries({ queryKey: ['user'] })
		},
	})
}
