import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import {
	type AuthResponse,
	supabaseAuthService,
} from '@/lib/api/services/supabaseAuthService'
import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'
import { logger } from '@/lib/utils/logger'

/** Email a password-reset link (FIX-11). */
export const useRequestPasswordReset = () =>
	useMutation({
		mutationFn: ({ email }: { email: string }) =>
			supabaseAuthService.requestPasswordReset(email),
	})

/** Set a new password for the current (recovery) session. */
export const useUpdatePassword = () =>
	useMutation({
		mutationFn: ({ password }: { password: string }) =>
			supabaseAuthService.updatePassword(password),
	})

/**
 * Hook for signing up with email and password
 * Redirects based on verification requirements.
 */
export const useSupabaseSignUp = () => {
	const router = useRouter()

	return useMutation({
		mutationFn: async ({
			email,
			password,
			name,
		}: {
			email: string
			password: string
			name: string
		}) => {
			return await supabaseAuthService.signUp(email, password, name)
		},
		onSuccess: data => {
			if (data.requiresEmailVerification) {
				logger.debug('[auth] signup requires verification')
				router.push('/login?message=verify-email')
				return
			}

			logger.debug('[auth] signup succeeded; redirecting to dashboard')
			setTimeout(() => {
				router.push('/dashboard')
			}, 100)
		},
	})
}

/**
 * Hook for signing in with email and password
 */
export const useSupabaseSignIn = () => {
	const router = useRouter()

	return useMutation({
		mutationFn: async ({
			email,
			password,
		}: {
			email: string
			password: string
			redirectTo?: string
		}) => {
			logger.debug('[auth] login mutation start')
			const result = await supabaseAuthService.signIn(email, password)
			logger.debug('[auth] login mutation success', { userId: result.user?.id })
			return result
		},
		onSuccess: (data, variables) => {
			logger.debug('[auth] login onSuccess', { userId: data.user?.id })
			setTimeout(() => {
				const target = sanitizeInternalRedirect(variables?.redirectTo)
				router.push(target)
			}, 300)
		},
		onError: error => {
			logger.error('[auth] login onError', error)
		},
	})
}

/**
 * Hook for signing in with Google
 */
export const useSupabaseGoogleSignIn = () => {
	return useMutation({
		mutationFn: async (callbackUrl?: string) => {
			const result = await supabaseAuthService.signInWithGoogle(callbackUrl)
			window.location.href = result.url
			return result
		},
	})
}

/**
 * Hook for signing out
 */
export const useSupabaseSignOut = () => {
	const router = useRouter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			await supabaseAuthService.signOut()
		},
		onSuccess: () => {
			queryClient.clear()
			router.replace('/login')
		},
	})
}
