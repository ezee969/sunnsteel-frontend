import type { UserProfile } from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { avatarService } from '@/lib/api/services/avatarService'
import { userService } from '@/lib/api/services/userService'

/**
 * PROF-01: store the cropped photo, point the profile at it, then tidy up.
 *
 * The order keeps the member's folder consistent whatever fails: a failed
 * upload changes nothing; a failed profile update removes the file it just
 * stored, so the profile never names a file it does not have and no stray
 * file is left; only once the profile points at the new file are the older
 * ones removed.
 */
export function useUploadAvatar() {
	const queryClient = useQueryClient()

	return useMutation<UserProfile, Error, File>({
		mutationFn: async file => {
			const { path, publicUrl } = await avatarService.upload(file)
			let profile: UserProfile
			try {
				profile = await userService.updateProfile({ avatarUrl: publicUrl })
			} catch (error) {
				await avatarService.remove(path).catch(() => undefined)
				throw error
			}
			await avatarService.removeOthers(path).catch(() => undefined)
			return profile
		},
		onSuccess: profile => {
			queryClient.setQueryData(['user'], profile)
		},
	})
}
