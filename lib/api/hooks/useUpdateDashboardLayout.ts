import type {
	UpdateDashboardLayoutRequest,
	UserProfile,
} from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

/** DASH-05 / PREF-03: the layout arrives on the profile, so the answer replaces it. */
export function useUpdateDashboardLayout() {
	const queryClient = useQueryClient()
	return useMutation<UserProfile, Error, UpdateDashboardLayoutRequest>({
		mutationFn: data => userService.updateDashboardLayout(data),
		onSuccess: profile => {
			queryClient.setQueryData(['user'], profile)
		},
	})
}
