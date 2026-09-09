import { UpdateProfilePrivacyRequest, UserProfile } from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export function useUpdateProfilePrivacy() {
	const queryClient = useQueryClient()

	return useMutation<UserProfile, Error, UpdateProfilePrivacyRequest>({
		mutationFn: data => userService.updateProfilePrivacy(data),
		onSuccess: updatedUser => {
			queryClient.setQueryData(['user'], updatedUser)
		},
	})
}
