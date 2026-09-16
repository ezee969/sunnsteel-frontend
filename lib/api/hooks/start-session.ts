import type { StartWorkoutRequest, WorkoutSession } from '@sunsteel/contracts'

import { logger } from '@/lib/utils/logger'

export type StartedSession = WorkoutSession & { _reused?: boolean }

/** The two calls the orchestration needs, injected so it can be tested. */
export interface StartSessionDeps {
	getActiveSession: () => Promise<WorkoutSession | null | undefined>
	startSession: (
		data: StartWorkoutRequest,
	) => Promise<WorkoutSession | undefined>
	/** Delay between the polls in step 3. Zero in tests. */
	wait?: (ms: number) => Promise<void>
}

const POLL_ATTEMPTS = 3
const POLL_INTERVAL_MS = 250

const sleep = (ms: number) =>
	new Promise<void>(resolve => setTimeout(resolve, ms))

/**
 * The start that is currently running in this tab.
 *
 * Shared as a promise so a parallel caller resolves to the same session rather
 * than racing it. It used to be a boolean, and the guarded branch answered with
 * a single `getActiveSession()` read — which can land before the session the
 * other call is creating becomes visible. The mutation then resolved to
 * `undefined`, which reaches neither the navigation in `onSuccess` nor the
 * toast in `onError`, so the click looked like it did nothing while the start
 * that did run had already created the session.
 */
let inFlight: Promise<StartedSession> | null = null

/** Test seam: forget any in-flight start. */
export function resetInFlightStart(): void {
	inFlight = null
}

/**
 * Starts a workout session, or returns the one already running.
 *
 * Resolves to a session with an id, or throws. It never resolves empty: a
 * resolved-but-empty mutation is invisible to both of react-query's callbacks,
 * which is precisely the failure this orchestration exists to avoid.
 */
export function startSessionOnce(
	deps: StartSessionDeps,
	data: StartWorkoutRequest,
): Promise<StartedSession> {
	if (inFlight) {
		logger.debug('[start-session] joining the start already in flight')
		return inFlight
	}
	const run = attempt(deps, data)
	inFlight = run
	// Detach the reset from the caller: whoever joined still gets `run`.
	void run
		.catch(() => undefined)
		.finally(() => {
			if (inFlight === run) inFlight = null
		})
	return run
}

async function attempt(
	deps: StartSessionDeps,
	data: StartWorkoutRequest,
): Promise<StartedSession> {
	const wait = deps.wait ?? sleep

	// 1) Reuse only an actually active session.
	const existing = await deps.getActiveSession()
	if (existing?.status === 'IN_PROGRESS' && existing.id) {
		logger.debug('[start-session] reusing active session', existing.id)
		// Re-enter through the idempotent start endpoint so the backend records
		// that the owner explicitly resumed a recoverable stale session.
		await deps.startSession(data)
		return {
			...existing,
			lastActivityAt: new Date().toISOString(),
			_reused: true,
		}
	}

	// 2) Start a new one. The backend enforces uniqueness, and some deployments
	// answer 201 with an empty body, so a throw here is not yet a failure.
	let started: WorkoutSession | undefined
	try {
		started = await deps.startSession(data)
	} catch (error) {
		logger.debug('[start-session] start threw, will poll active', error)
	}
	if (started?.id) return started

	// 3) Poll for the session the start may have created anyway.
	for (let i = 0; i < POLL_ATTEMPTS; i++) {
		const created = await deps.getActiveSession()
		if (created?.id) return created
		await wait(POLL_INTERVAL_MS)
	}
	const fallback = await deps.getActiveSession()
	if (fallback?.id) return fallback

	throw new Error(
		'The session could not be started, and no active session could be found ' +
			'afterwards.',
	)
}
