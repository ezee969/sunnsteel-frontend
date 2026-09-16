import type { StartWorkoutRequest, WorkoutSession } from '@sunsteel/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	resetInFlightStart,
	type StartSessionDeps,
	startSessionOnce,
} from './start-session'

const REQUEST = {
	routineId: 'routine-1',
	routineDayId: 'day-1',
} as StartWorkoutRequest

const session = (id: string, status = 'IN_PROGRESS') =>
	({ id, status }) as WorkoutSession

/** A deferred promise, so a test can decide when a call resolves. */
function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>(r => {
		resolve = r
	})
	return { promise, resolve }
}

const deps = (over: Partial<StartSessionDeps> = {}): StartSessionDeps => ({
	getActiveSession: vi.fn().mockResolvedValue(null),
	startSession: vi.fn().mockResolvedValue(session('new-1')),
	wait: () => Promise.resolve(),
	...over,
})

beforeEach(() => {
	resetInFlightStart()
})

describe('startSessionOnce', () => {
	it('returns the started session', async () => {
		await expect(startSessionOnce(deps(), REQUEST)).resolves.toMatchObject({
			id: 'new-1',
		})
	})

	it('reuses an active session instead of starting a second one', async () => {
		const d = deps({
			getActiveSession: vi.fn().mockResolvedValue(session('live-1')),
		})
		const result = await startSessionOnce(d, REQUEST)
		expect(result).toMatchObject({ id: 'live-1', _reused: true })
		// Still re-entered, so the backend records the explicit resume.
		expect(d.startSession).toHaveBeenCalledTimes(1)
	})

	it('gives a parallel caller the same session, without a second read', async () => {
		// The regression this file exists for. The guard used to answer a parallel
		// caller with its own getActiveSession() read; when that read landed before
		// the new session was visible it returned nothing, so the caller had no id
		// to navigate to while the start that did run created the session anyway.
		const gate = deferred<WorkoutSession>()
		const startSession = vi.fn().mockReturnValue(gate.promise)
		const getActiveSession = vi.fn().mockResolvedValue(null)
		const d = deps({ startSession, getActiveSession })

		const first = startSessionOnce(d, REQUEST)
		const second = startSessionOnce(d, REQUEST)
		expect(second).toBe(first)

		gate.resolve(session('new-2'))
		await expect(first).resolves.toMatchObject({ id: 'new-2' })
		await expect(second).resolves.toMatchObject({ id: 'new-2' })

		expect(startSession).toHaveBeenCalledTimes(1)
		// Once for the reuse check, and never again on behalf of the joiner.
		expect(getActiveSession).toHaveBeenCalledTimes(1)
	})

	it('polls for the session when the start throws but created one anyway', async () => {
		// The observed server behaviour: POST /sessions/start succeeds and the
		// client never sees the reply.
		const getActiveSession = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValue(session('recovered-1'))
		const d = deps({
			getActiveSession,
			startSession: vi.fn().mockRejectedValue(new Error('network')),
		})
		await expect(startSessionOnce(d, REQUEST)).resolves.toMatchObject({
			id: 'recovered-1',
		})
	})

	it('throws rather than resolving empty when no session can be found', async () => {
		// A resolved-but-empty mutation reaches neither onSuccess nor onError, so
		// the click would look like it did nothing at all.
		const d = deps({
			getActiveSession: vi.fn().mockResolvedValue(null),
			startSession: vi.fn().mockResolvedValue(undefined),
		})
		await expect(startSessionOnce(d, REQUEST)).rejects.toThrow(
			/could not be started/,
		)
	})

	it('lets a later start run after one fails', async () => {
		const failing = deps({
			getActiveSession: vi.fn().mockResolvedValue(null),
			startSession: vi.fn().mockResolvedValue(undefined),
		})
		await expect(startSessionOnce(failing, REQUEST)).rejects.toThrow()

		// The in-flight slot must be clear, or the button stays dead until reload.
		await expect(startSessionOnce(deps(), REQUEST)).resolves.toMatchObject({
			id: 'new-1',
		})
	})
})
