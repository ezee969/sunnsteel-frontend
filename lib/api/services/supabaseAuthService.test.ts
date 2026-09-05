import type { SupabaseAuthResponse } from '@sunsteel/contracts'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAuthSessionController } from '@/lib/auth/auth-session-controller'
import { AuthVerificationCancelledError } from '@/lib/auth/auth-verification-error'
import { supabase } from '@/lib/supabase/client'

import { httpClient } from './httpClient'
import { SupabaseAuthService } from './supabaseAuthService'

vi.mock('@/lib/config/env', () => ({ PUBLIC_ENV: {} }))
vi.mock('@/lib/supabase/client', () => ({
	supabase: { auth: { signInWithPassword: vi.fn() } },
}))
vi.mock('@/lib/utils/logger', () => ({
	logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('./httpClient', () => ({ httpClient: { post: vi.fn() } }))

const profile: SupabaseAuthResponse = {
	user: {
		id: 'backend-a',
		email: 'athlete@example.test',
		name: 'Athlete',
		supabaseUserId: 'account-a',
		weightUnit: 'KG',
	},
}

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: Error) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => {
	vi.resetAllMocks()
	vi.stubGlobal('window', {})
	vi.stubGlobal('fetch', fetchMock)
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
	vi.mocked(httpClient.post).mockResolvedValue(profile)
})
afterEach(() => vi.unstubAllGlobals())

describe('auth verification and marker ordering', () => {
	it('shares email login verification with the deferred provider event', async () => {
		const service = new SupabaseAuthService()
		const published = deferred<void>()
		const controller = createAuthSessionController({
			verifyToken: token => service.verifyToken(token),
			invalidateVerification: () => service.invalidateVerification(),
			clearSessionMarker: () => service.clearSessionMarker(),
			setSession: vi.fn(),
			setUser: user => {
				if (user) published.resolve()
			},
			setError: vi.fn(),
			setIsLoading: vi.fn(),
			clearQueries: vi.fn(),
			invalidateUser: vi.fn(),
		})
		const current: Session = {
			access_token: 'token-a',
			refresh_token: 'refresh',
			expires_in: 3600,
			token_type: 'bearer',
			user: {
				id: 'account-a',
				aud: 'authenticated',
				app_metadata: {},
				user_metadata: {},
				created_at: '2026-09-04T00:00:00Z',
			},
		}
		vi.mocked(supabase.auth.signInWithPassword).mockImplementation(async () => {
			controller.handleAuthStateChange('SIGNED_IN', current)
			return { data: { user: current.user, session: current }, error: null }
		})
		try {
			await expect(
				service.signIn('athlete@example.test', 'not-a-real-password'),
			).resolves.toEqual(profile)
			await published.promise
			expect(httpClient.post).toHaveBeenCalledTimes(1)
			expect(fetchMock).toHaveBeenCalledTimes(1)
		} finally {
			controller.dispose()
		}
	})

	it('shares both pending and completed verification for the current token', async () => {
		const service = new SupabaseAuthService()
		const first = service.verifyToken('token-a')
		expect(service.verifyToken('token-a')).toBe(first)
		await expect(first).resolves.toEqual(profile)
		expect(service.verifyToken('token-a')).toBe(first)
		expect(httpClient.post).toHaveBeenCalledTimes(1)
		expect(httpClient.post).toHaveBeenCalledWith('/auth/supabase/verify', {
			token: 'token-a',
		})
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(fetchMock).toHaveBeenCalledWith('/api/session', { method: 'POST' })
	})

	it('does not cache a failed backend request', async () => {
		const service = new SupabaseAuthService()
		vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('Unavailable'))
		await expect(service.verifyToken('token-a')).rejects.toThrow('Unavailable')
		await expect(service.verifyToken('token-a')).resolves.toEqual(profile)
		expect(httpClient.post).toHaveBeenCalledTimes(2)
	})

	it('forgets completed verification after an identity or profile change', async () => {
		const service = new SupabaseAuthService()
		await service.verifyToken('token-a')
		service.invalidateVerification()
		await service.verifyToken('token-a')
		expect(httpClient.post).toHaveBeenCalledTimes(2)
	})

	it('does not restore the marker when the backend responds after logout', async () => {
		const service = new SupabaseAuthService()
		const backend = deferred<SupabaseAuthResponse>()
		vi.mocked(httpClient.post).mockReturnValueOnce(backend.promise)
		const verification = service.verifyToken('token-a')
		const rejected = expect(verification).rejects.toBeInstanceOf(
			AuthVerificationCancelledError,
		)
		await service.clearSessionMarker()
		backend.resolve(profile)
		await rejected
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(fetchMock).toHaveBeenCalledWith('/api/session', { method: 'DELETE' })
	})

	it('finishes an already-started marker POST before the logout DELETE', async () => {
		const service = new SupabaseAuthService()
		const marker = deferred<Response>()
		const started = deferred<void>()
		fetchMock.mockImplementationOnce(() => {
			started.resolve()
			return marker.promise
		})
		const verification = service.verifyToken('token-a')
		const rejected = expect(verification).rejects.toBeInstanceOf(
			AuthVerificationCancelledError,
		)
		await started.promise
		const logout = service.clearSessionMarker()
		expect(fetchMock).toHaveBeenCalledTimes(1)
		marker.resolve(new Response(null, { status: 204 }))
		await logout
		await rejected
		expect(fetchMock.mock.calls.map(([, options]) => options?.method)).toEqual([
			'POST',
			'DELETE',
		])
	})

	it('does not let an older failure evict a newer cached request', async () => {
		const service = new SupabaseAuthService()
		const old = deferred<SupabaseAuthResponse>()
		vi.mocked(httpClient.post).mockReturnValueOnce(old.promise)
		const first = service.verifyToken('token-a')
		const rejected = expect(first).rejects.toThrow('Old failure')
		service.invalidateVerification()
		const next = service.verifyToken('token-b')
		await next
		old.reject(new Error('Old failure'))
		await rejected
		expect(service.verifyToken('token-b')).toBe(next)
		expect(httpClient.post).toHaveBeenCalledTimes(2)
	})

	it('does not cache success if setting the routing cookie fails', async () => {
		const service = new SupabaseAuthService()
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
		await expect(service.verifyToken('token-a')).rejects.toThrow(
			'Session marker returned 500',
		)
		await expect(service.verifyToken('token-a')).resolves.toEqual(profile)
		expect(httpClient.post).toHaveBeenCalledTimes(2)
	})
})
