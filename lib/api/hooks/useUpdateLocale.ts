import type { AppLocale, UserProfile } from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { writeLocaleCookie } from '@/i18n/locale-cookie'
import { userService } from '@/lib/api/services/userService'

/**
 * I18N-02: store the account's language, mirror it into the locale cookie and
 * reload. Each language is its own static build (I18N-01), so a new language
 * is a new document rather than a re-render.
 */
export function useUpdateLocale() {
	const queryClient = useQueryClient()
	return useMutation<UserProfile, Error, AppLocale | null>({
		mutationFn: locale => userService.updateLocale({ locale }),
		onSuccess: profile => {
			queryClient.setQueryData(['user'], profile)
			writeLocaleCookie(profile.locale ?? null)
			window.location.reload()
		},
	})
}
