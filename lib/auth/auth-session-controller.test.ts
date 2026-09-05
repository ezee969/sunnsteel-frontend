import type { SupabaseAuthResponse } from '@sunsteel/contracts'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAuthSessionController } from './auth-session-controller'
import { AuthVerificationCancelledError } from './auth-verification-error'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: Error) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

function session(id = 'account-a', token = 'token-a'): Session {
	return {
		access_token: token,
		refresh_token: 'refresh-token',
		expires_in: 3600,
		token_type: 'bearer',
		user: {
			id,
			app_metadata: {},
			user_metadata: {},
			aud: 'authenticated',
			created_at: '2026-09-04T00:00:00Z',
		},
	}
}

const profile: SupabaseAuthResponse = {
	user: {
		id: 'backend-a',
		email: 'athlete@example.test',
		name: 'Athlete',
		supabaseUserId: 'account-a',
		weightUnit: 'KG',
	},
}

function setup() {
	const deps = {
		verifyToken: vi.fn().mockResolvedValue(profile),
		invalidateVerification: vi.fn(),
		clearSessionMarker: vi.fn().mockResolvedValue(undefined),
		setSession: vi.fn(),
		setUser: vi.fn(),
		setError: vi.fn(),
		setIsLoading: vi.fn(),
		clearQueries: vi.fn(),
		invalidateUser: vi.fn(),
	}
	return { deps, ...createAuthSessionController(deps) }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
	vi.clearAllTimers()
	vi.useRealTimers()
})

describe('auth session events', () => {
	it('allows a later auth event to retry a cancelled verification', async () => {
		const { deps, handleAuthStateChange } = setup()
		deps.verifyToken.mockRejectedValueOnce(new AuthVerificationCancelledError())
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		handleAuthStateChange('SIGNED_IN', session())
		await vi.runAllTimersAsync()
		expect(deps.verifyToken).toHaveBeenCalledTimes(2)
		expect(deps.setUser).toHaveBeenCalledWith(profile.user)
		expect(deps.setError).not.toHaveBeenCalledWith(expect.any(Error))
	})

	it('returns synchronously and enables data before deferred verification', async () => {
		const { deps, handleAuthStateChange } = setup()
		const current = session()
		expect(handleAuthStateChange('INITIAL_SESSION', current)).toBeUndefined()
		expect(deps.setSession).toHaveBeenCalledWith(current)
		expect(deps.setIsLoading).toHaveBeenCalledWith(false)
		expect(deps.verifyToken).not.toHaveBeenCalled()
		await vi.runAllTimersAsync()
		expect(deps.setUser).toHaveBeenCalledWith(profile.user)
		expect(deps.invalidateUser).not.toHaveBeenCalled()
	})

	it('waits for cookie cleanup before publishing an initial null session', async () => {
		const { deps, handleAuthStateChange } = setup()
		const cleanup = deferred<void>()
		deps.clearSessionMarker.mockReturnValue(cleanup.promise)
		handleAuthStateChange('INITIAL_SESSION', null)
		await vi.runAllTimersAsync()
		expect(deps.setSession).not.toHaveBeenCalled()
		expect(deps.setIsLoading).not.toHaveBeenCalled()
		cleanup.resolve()
		await vi.runAllTimersAsync()
		expect(deps.setSession).toHaveBeenCalledWith(null)
		expect(deps.setIsLoading).toHaveBeenCalledWith(false)
	})

	it('ignores repeated sign-in notifications while pending and after success', async () => {
		const { deps, handleAuthStateChange } = setup()
		const verification = deferred<SupabaseAuthResponse>()
		deps.verifyToken.mockReturnValue(verification.promise)
		handleAuthStateChange('INITIAL_SESSION', session())
		handleAuthStateChange('SIGNED_IN', session())
		await vi.runAllTimersAsync()
		handleAuthStateChange('SIGNED_IN', session())
		verification.resolve(profile)
		await vi.runAllTimersAsync()
		handleAuthStateChange('SIGNED_IN', session())
		await vi.runAllTimersAsync()
		expect(deps.verifyToken).toHaveBeenCalledTimes(1)
		expect(deps.invalidateUser).not.toHaveBeenCalled()
	})

	it('updates a refreshed token without re-verifying an established profile', async () => {
		const { deps, handleAuthStateChange } = setup()
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		const refreshed = session('account-a', 'new-token')
		handleAuthStateChange('TOKEN_REFRESHED', refreshed)
		await vi.runAllTimersAsync()
		expect(deps.setSession).toHaveBeenLastCalledWith(refreshed)
		expect(deps.verifyToken).toHaveBeenCalledTimes(1)
	})

	it('ignores an old token failure when a refreshed token is being verified', async () => {
		const { deps, handleAuthStateChange } = setup()
		const old = deferred<SupabaseAuthResponse>()
		deps.verifyToken.mockReturnValueOnce(old.promise)
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		handleAuthStateChange('TOKEN_REFRESHED', session('account-a', 'new-token'))
		await vi.runAllTimersAsync()
		old.reject(new Error('Expired token'))
		await vi.runAllTimersAsync()
		expect(deps.setUser).toHaveBeenLastCalledWith(profile.user)
		expect(deps.clearSessionMarker).not.toHaveBeenCalled()
		expect(deps.setError).not.toHaveBeenCalledWith(expect.any(Error))
	})

	it.each(['resolve', 'reject'] as const)(
		'ignores late verification %s after logout',
		async outcome => {
			const { deps, handleAuthStateChange } = setup()
			const old = deferred<SupabaseAuthResponse>()
			deps.verifyToken.mockReturnValue(old.promise)
			handleAuthStateChange('INITIAL_SESSION', session())
			await vi.runAllTimersAsync()
			handleAuthStateChange('SIGNED_OUT', null)
			expect(deps.invalidateVerification).toHaveBeenCalledTimes(1)
			await vi.runAllTimersAsync()
			if (outcome === 'resolve') old.resolve(profile)
			else old.reject(new Error('Old request failed'))
			await vi.runAllTimersAsync()
			expect(deps.setSession).toHaveBeenLastCalledWith(null)
			expect(deps.setUser).toHaveBeenLastCalledWith(null)
			expect(deps.setUser).not.toHaveBeenCalledWith(profile.user)
			expect(deps.clearSessionMarker).toHaveBeenCalledTimes(1)
			expect(deps.setError).not.toHaveBeenCalledWith(expect.any(Error))
		},
	)

	it('clears the old account cache and ignores its profile on account switching', async () => {
		const { deps, handleAuthStateChange } = setup()
		const old = deferred<SupabaseAuthResponse>()
		const newProfile = {
			user: { ...profile.user, id: 'backend-b', supabaseUserId: 'account-b' },
		}
		deps.verifyToken
			.mockReturnValueOnce(old.promise)
			.mockResolvedValueOnce(newProfile)
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		handleAuthStateChange('SIGNED_IN', session('account-b', 'token-b'))
		expect(deps.clearQueries).toHaveBeenCalledTimes(1)
		expect(deps.setUser).toHaveBeenCalledWith(null)
		await vi.runAllTimersAsync()
		old.resolve(profile)
		await vi.runAllTimersAsync()
		expect(deps.setUser).toHaveBeenLastCalledWith(newProfile.user)
		expect(deps.setUser).not.toHaveBeenCalledWith(profile.user)
	})

	it('waits for marker cleanup before publishing a verification error', async () => {
		const { deps, handleAuthStateChange } = setup()
		const cleanup = deferred<void>()
		const failure = new Error('Verification failed')
		deps.verifyToken.mockRejectedValue(failure)
		deps.clearSessionMarker.mockReturnValue(cleanup.promise)
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		expect(deps.setError).not.toHaveBeenCalledWith(failure)
		cleanup.resolve()
		await vi.runAllTimersAsync()
		expect(deps.setError).toHaveBeenLastCalledWith(failure)
	})

	it('does not let an older logout cleanup erase a new sign-in', async () => {
		const { deps, handleAuthStateChange } = setup()
		const cleanup = deferred<void>()
		deps.clearSessionMarker.mockReturnValue(cleanup.promise)
		handleAuthStateChange('SIGNED_OUT', null)
		await vi.runAllTimersAsync()
		const next = session('account-b', 'token-b')
		handleAuthStateChange('SIGNED_IN', next)
		await vi.runAllTimersAsync()
		cleanup.resolve()
		await vi.runAllTimersAsync()
		expect(deps.setSession).toHaveBeenLastCalledWith(next)
		expect(deps.setSession).not.toHaveBeenCalledWith(null)
	})

	it('refreshes verification and user data for an explicit user update', async () => {
		const { deps, handleAuthStateChange } = setup()
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		handleAuthStateChange('USER_UPDATED', session())
		await vi.runAllTimersAsync()
		expect(deps.invalidateVerification).toHaveBeenCalledTimes(1)
		expect(deps.invalidateUser).toHaveBeenCalledTimes(1)
		expect(deps.verifyToken).toHaveBeenCalledTimes(2)
	})

	it('cancels scheduled verification on cleanup', async () => {
		const { deps, handleAuthStateChange, dispose } = setup()
		handleAuthStateChange('INITIAL_SESSION', session())
		dispose()
		await vi.runAllTimersAsync()
		expect(deps.verifyToken).not.toHaveBeenCalled()
	})

	it('does not publish an in-flight response after cleanup', async () => {
		const { deps, handleAuthStateChange, dispose } = setup()
		const pending = deferred<SupabaseAuthResponse>()
		deps.verifyToken.mockReturnValue(pending.promise)
		handleAuthStateChange('INITIAL_SESSION', session())
		await vi.runAllTimersAsync()
		dispose()
		pending.resolve(profile)
		await vi.runAllTimersAsync()
		expect(deps.setUser).not.toHaveBeenCalled()
	})
})
