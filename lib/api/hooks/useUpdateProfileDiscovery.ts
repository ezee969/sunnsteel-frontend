import {
	type UpdateProfileDiscoveryRequest,
	type UserProfile,
} from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export function useUpdateProfileDiscovery() {
	const queryClient = useQueryClient()

	return useMutation<UserProfile, Error, UpdateProfileDiscoveryRequest>({
		mutationFn: data => userService.updateProfileDiscovery(data),
		onSuccess: updatedUser => {
			queryClient.setQueryData(['user'], updatedUser)
		},
	})
}
