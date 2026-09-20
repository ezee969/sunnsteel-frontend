import { UpdateProfilePrivacyRequest, UserProfile } from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

export function useUpdateProfilePrivacy() {
	const queryClient = useQueryClient()

	return useMutation<UserProfile, Error, UpdateProfilePrivacyRequest>({
		mutationFn: data => userService.updateProfilePrivacy(data),
		onSuccess: updatedUser => {
			queryClient.setQueryData(['user'], updatedUser)
			// SOC-04: a section rule caps every activity entry drawn from it, so
			// the sharing card and every activity read are stale after a change.
			void queryClient.invalidateQueries({ queryKey: ['activity'] })
		},
	})
}
