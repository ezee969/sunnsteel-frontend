import type {
	SupabaseAuthResponse,
	SupabaseMigrationResponse,
} from '@sunsteel/contracts'
import type { Session } from '@supabase/supabase-js'

import { AuthVerificationCancelledError } from '@/lib/auth/auth-verification-error'
import { PUBLIC_ENV } from '@/lib/config/env'
import { supabase } from '@/lib/supabase/client'
import { getFullErrorMessage } from '@/lib/utils/error-messages'
import { sanitizeInternalRedirect } from '@/lib/utils/internal-redirect'
import { logger } from '@/lib/utils/logger'

import { httpClient } from './httpClient'

export type AuthResponse = SupabaseAuthResponse

export class SupabaseAuthService {
	private verificationVersion = 0
	private verification: {
		token: string
		promise: Promise<AuthResponse>
	} | null = null
	private markerQueue: Promise<void> = Promise.resolve()
	private markerCleanup: Promise<void> | null = null

	/** Forget both pending and successful verification when auth identity changes. */
	invalidateVerification(): void {
		this.verificationVersion++
		this.verification = null
	}

	private queueSessionMarker(
		method: 'POST' | 'DELETE',
		version?: number,
	): Promise<void> {
		const operation = this.markerQueue.then(async () => {
			if (version !== undefined && version !== this.verificationVersion) {
				throw new AuthVerificationCancelledError()
			}
			if (typeof window === 'undefined') return
			try {
				const response = await fetch('/api/session', { method })
				if (!response.ok)
					throw new Error(`Session marker returned ${response.status}`)
			} catch (error) {
				logger.warn('[auth-service] session marker update failed', {
					method,
					error,
				})
				throw error
			}
		})
		// A DELETE waits for an already-started POST, so logout wins that race.
		this.markerQueue = operation.catch(() => {})
		return operation
	}

	/**
	 * Sign up with email and password.
	 */
	async signUp(
		email: string,
		password: string,
		name: string,
	): Promise<AuthResponse> {
		logger.debug('[auth-service] signUp start', { email })

		const configuredBaseUrl = PUBLIC_ENV.SITE_URL || PUBLIC_ENV.FRONTEND_URL
		const siteUrl =
			configuredBaseUrl ||
			(typeof window !== 'undefined' ? window.location.origin : '')

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					name,
				},
				emailRedirectTo: `${siteUrl}/auth/callback`,
			},
		})

		if (error) {
			logger.warn('[auth-service] signUp rejected', error)
			const friendlyMessage = getFullErrorMessage(error.message)
			throw new Error(friendlyMessage)
		}

		if (!data.user) {
			throw new Error(
				'Unable to create account. Please try again or contact support if the problem persists.',
			)
		}

		const session = await supabase.auth.getSession()

		// No session immediately available means verification is required.
		if (!session.data.session) {
			logger.debug('[auth-service] signUp pending email verification')
			return {
				user: {
					id: '',
					email: data.user.email || email,
					name,
					supabaseUserId: data.user.id,
					weightUnit: 'KG',
				},
				message:
					'Please check your email to verify your account before logging in.',
				requiresEmailVerification: true,
			}
		}

		logger.debug('[auth-service] signUp got session; verifying backend token')
		return this.verifyToken(session.data.session.access_token)
	}

	/**
	 * Sign in with email and password.
	 */
	async signIn(email: string, password: string): Promise<AuthResponse> {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})

		if (error) {
			logger.warn('[auth-service] signIn rejected', error)
			const friendlyMessage = getFullErrorMessage(error.message)
			throw new Error(friendlyMessage)
		}

		if (!data.session) {
			throw new Error(
				'Unable to sign in. Please check your credentials and try again.',
			)
		}

		return this.verifyToken(data.session.access_token)
	}

	/**
	 * Sign in with Google.
	 */
	async signInWithGoogle(callbackUrl?: string): Promise<{ url: string }> {
		const configuredBaseUrl = PUBLIC_ENV.SITE_URL || PUBLIC_ENV.FRONTEND_URL
		const siteUrl =
			configuredBaseUrl ||
			(typeof window !== 'undefined' ? window.location.origin : '')

		const callbackPath = '/auth/callback'
		const redirectBase = `${siteUrl}${callbackPath}`
		const safeCallbackUrl = sanitizeInternalRedirect(callbackUrl)
		const redirectTo = `${redirectBase}?callbackUrl=${encodeURIComponent(
			safeCallbackUrl,
		)}`

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo,
			},
		})

		if (error) {
			throw new Error(error.message)
		}

		return { url: data.url }
	}

	/**
	 * Sign out.
	 */
	async signOut(): Promise<void> {
		const { error } = await supabase.auth.signOut()
		if (error) {
			throw new Error(error.message)
		}

		let markerError: unknown
		try {
			await this.clearSessionMarker()
		} catch (error) {
			markerError = error
		}

		try {
			await httpClient.post('/auth/supabase/logout')
		} catch (err) {
			logger.warn('[auth-service] backend logout cookie clear failed', err)
		}

		if (markerError) throw markerError
	}

	/**
	 * Set the same-origin `ss_session` marker cookie the middleware reads for
	 * route protection. Must be set by the frontend (not the backend): a cookie
	 * from the cross-site backend response is scoped to the backend domain and is
	 * never sent to this app's domain, so middleware could never see it.
	 */
	private setSessionMarker(version: number): Promise<void> {
		return this.queueSessionMarker('POST', version)
	}

	/**
	 * Clear the marker cookie. Public because it must run on EVERY path that
	 * leaves the client unauthenticated, not just an explicit `signOut()`: the
	 * cookie lives 7 days independently of the Supabase session, so if it
	 * outlives it the middleware keeps waving `/dashboard` through while the app
	 * bounces to `/login` and back. See TD-21.
	 */
	clearSessionMarker(): Promise<void> {
		this.invalidateVerification()
		if (this.markerCleanup) return this.markerCleanup

		const operation = this.queueSessionMarker('DELETE')
		const cleanup = operation.finally(() => {
			if (this.markerCleanup === cleanup) this.markerCleanup = null
		})
		this.markerCleanup = cleanup
		return cleanup
	}

	/**
	 * Get current session.
	 */
	async getSession() {
		const { data, error } = await supabase.auth.getSession()
		if (error) {
			throw new Error(error.message)
		}
		return data.session
	}

	/**
	 * Verify Supabase token with backend.
	 */
	verifyToken(token: string): Promise<AuthResponse> {
		// Login and the provider share this promise, including a completed result
		// for the current token. Nothing is persisted or used for API authorization.
		if (this.verification?.token === token) return this.verification.promise

		const version = this.verificationVersion
		const promise = this.performVerification(token, version).catch(error => {
			if (this.verification?.promise === promise) this.verification = null
			throw error
		})
		this.verification = { token, promise }
		return promise
	}

	private async performVerification(
		token: string,
		version: number,
	): Promise<AuthResponse> {
		try {
			const response = await httpClient.post<AuthResponse>(
				'/auth/supabase/verify',
				{
					token,
				},
			)
			await this.setSessionMarker(version)
			if (version !== this.verificationVersion) {
				throw new AuthVerificationCancelledError()
			}
			logger.debug('[auth-service] backend verify succeeded', {
				userId: response.user?.id,
			})
			return response
		} catch (error) {
			if (!(error instanceof AuthVerificationCancelledError)) {
				logger.error('[auth-service] backend verify failed', error)
			}
			throw error
		}
	}

	/**
	 * Get user profile using Supabase token.
	 */
	async getProfile(): Promise<AuthResponse> {
		const session = await this.getSession()
		if (!session) {
			throw new Error('No session available')
		}

		const response = await httpClient.request<AuthResponse>(
			'/auth/supabase/profile',
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
				},
			},
		)

		return response
	}

	/**
	 * Check if user is authenticated.
	 */
	async isAuthenticated(): Promise<boolean> {
		try {
			const session = await this.getSession()
			return !!session
		} catch {
			return false
		}
	}

	/**
	 * Get current access token.
	 */
	async getAccessToken(): Promise<string | null> {
		try {
			const session = await this.getSession()
			return session?.access_token || null
		} catch {
			return null
		}
	}

	/**
	 * Listen to auth changes.
	 */
	onAuthStateChange(
		callback: (event: string, session: Session | null) => void,
	) {
		return supabase.auth.onAuthStateChange(callback)
	}

	/**
	 * Migrate existing user (migration phase only).
	 */
	async migrateUser(email: string, password: string) {
		return httpClient.post<SupabaseMigrationResponse>(
			'/auth/supabase/migrate',
			{
				email,
				password,
			},
		)
	}
}

export const supabaseAuthService = new SupabaseAuthService()
