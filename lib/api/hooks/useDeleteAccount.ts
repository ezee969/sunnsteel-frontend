import type {
	DeleteAccountRequest,
	DeleteAccountResponse,
} from '@sunsteel/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService'
import { userService } from '@/lib/api/services/userService'
import { ACCOUNT_DELETED_LOGIN_URL } from '@/lib/utils/account-deletion'

/**
 * TRUST-01. On success the member is signed out and sent to Login with a
 * notice. The navigation is a full page load on purpose: the protected layout
 * also redirects the moment the session is gone, and a client-side race
 * between the two could drop the notice or leave a cached page mounted.
 */
export function useDeleteAccount() {
	const queryClient = useQueryClient()

	return useMutation<DeleteAccountResponse, Error, DeleteAccountRequest>({
		mutationFn: data => userService.deleteAccount(data),
		onSuccess: async () => {
			try {
				await supabaseAuthService.signOutDeletedAccount()
			} finally {
				queryClient.clear()
				window.location.replace(ACCOUNT_DELETED_LOGIN_URL)
			}
		},
	})
}
