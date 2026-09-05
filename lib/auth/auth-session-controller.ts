import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import type { AuthResponse } from '@/lib/api/services/supabaseAuthService'

import { AuthVerificationCancelledError } from './auth-verification-error'

interface AuthSessionDependencies {
	verifyToken: (token: string) => Promise<AuthResponse>
	invalidateVerification: () => void
	clearSessionMarker: () => Promise<void>
	setSession: (session: Session | null) => void
	setUser: (user: AuthResponse['user'] | null) => void
	setError: (error: Error | null) => void
	setIsLoading: (loading: boolean) => void
	clearQueries: () => void
	invalidateUser: () => void
}

/** Auth event orchestration, independent of React so races can be tested in Node. */
export function createAuthSessionController(deps: AuthSessionDependencies) {
	let accountId: string | null | undefined
	let generation = 0
	let disposed = false
	let verified = false
	let pendingToken: string | null = null
	const timers = new Set<ReturnType<typeof setTimeout>>()

	const isCurrent = (version: number) => !disposed && generation === version

	function schedule(version: number, work: () => Promise<void>) {
		// Never return an async callback to Supabase or run refresh-triggering
		// work under its auth lock. Pending work is cancelled on effect cleanup.
		const timer = setTimeout(() => {
			timers.delete(timer)
			if (isCurrent(version)) void work()
		}, 0)
		timers.add(timer)
	}

	function handleAuthStateChange(
		event: AuthChangeEvent,
		session: Session | null,
	) {
		if (disposed) return

		const nextAccountId = session?.user.id ?? null
		const accountChanged =
			accountId !== undefined && accountId !== nextAccountId
		accountId = nextAccountId

		if (!session) {
			const version = ++generation
			verified = false
			pendingToken = null
			// Invalidate synchronously: an older /verify must not restore the cookie.
			deps.invalidateVerification()
			schedule(version, async () => {
				await deps.clearSessionMarker()
				if (!isCurrent(version)) return
				// TD-21: clear the marker BEFORE exposing a null session to any render.
				deps.clearQueries()
				deps.setUser(null)
				deps.setError(null)
				deps.setSession(null)
				deps.setIsLoading(false)
			})
			return
		}

		if (accountChanged) {
			verified = false
			pendingToken = null
			deps.invalidateVerification()
			deps.clearQueries()
			deps.setUser(null)
		}

		deps.setSession(session)
		// TD-18: protected data queries start before backend verification finishes.
		deps.setIsLoading(false)

		if (
			(event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
			(verified || pendingToken === session.access_token)
		) {
			return
		}

		if (event === 'USER_UPDATED') {
			deps.invalidateVerification()
		}

		const version = ++generation
		pendingToken = session.access_token
		deps.setError(null)
		schedule(version, async () => {
			try {
				if (event === 'USER_UPDATED') deps.invalidateUser()
				const profile = await deps.verifyToken(session.access_token)
				if (!isCurrent(version)) return
				verified = true
				pendingToken = null
				deps.setUser(profile.user)
			} catch (error) {
				if (!isCurrent(version)) return
				verified = false
				pendingToken = null
				if (error instanceof AuthVerificationCancelledError) return
				await deps.clearSessionMarker()
				if (!isCurrent(version)) return
				deps.setUser(null)
				deps.setError(error instanceof Error ? error : new Error(String(error)))
			}
		})
	}

	return {
		handleAuthStateChange,
		dispose() {
			disposed = true
			generation++
			for (const timer of timers) clearTimeout(timer)
			timers.clear()
		},
	}
}
