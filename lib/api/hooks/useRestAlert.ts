'use client'

import { useCallback, useRef } from 'react'

import { pushService } from '../services/pushService'

export interface RestAlertControls {
	/** Ask the server to notify when this rest period ends. */
	schedule: (endsAt: number, exerciseName: string) => void
	/** Rest was skipped, extended away or the set was finished early. */
	cancel: () => void
}

/**
 * NOTIF-03's client half.
 *
 * Scheduling is deliberately fire-and-forget. The alert is a second channel
 * behind LIVE-01's in-app tone, so a failed request must never interrupt
 * logging a set or raise a toast mid-workout — the session screen keeps
 * working exactly as it did before push existed.
 */
export function useRestAlert(
	sessionId: string | undefined,
	enabled: boolean,
): RestAlertControls {
	// Skips the DELETE when there is nothing scheduled, which is the common case
	// for every account that never enabled notifications.
	const hasPendingRef = useRef(false)

	const schedule = useCallback(
		(endsAt: number, exerciseName: string) => {
			if (!sessionId || !enabled) return
			hasPendingRef.current = true
			void pushService
				.scheduleRestAlert(sessionId, {
					endsAt: new Date(endsAt).toISOString(),
					exerciseName,
				})
				.then(response => {
					hasPendingRef.current = response.scheduledFor !== null
				})
				.catch(() => {
					hasPendingRef.current = false
				})
		},
		[enabled, sessionId],
	)

	const cancel = useCallback(() => {
		if (!sessionId || !hasPendingRef.current) return
		hasPendingRef.current = false
		void pushService.cancelRestAlert(sessionId).catch(() => undefined)
	}, [sessionId])

	return { schedule, cancel }
}
