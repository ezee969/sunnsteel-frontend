import { useCallback, useEffect, useRef, useState } from 'react'

import { createRestAlert, type RestAlert } from '@/lib/utils/rest-alert'
import {
	remainingSeconds,
	REST_TIMER_EXTEND_SECONDS,
} from '@/lib/utils/rest-timer.utils'

/** How often the display is recomputed from the deadline. */
const TICK_MS = 250

export interface RestTimerState {
	/** Seconds left, or null when no rest period is running. */
	remaining: number | null
	/** The full rest duration this period started with, including extensions. */
	total: number
	/** True once the deadline has passed and the alert has fired. */
	isOver: boolean
	start: (seconds: number) => void
	extend: () => void
	dismiss: () => void
}

/**
 * Rest countdown driven by an absolute deadline.
 *
 * Nothing accumulates: every reading is `deadline - Date.now()`, so a
 * backgrounded tab, a throttled interval or a sleeping phone cannot make the
 * timer drift. Returning to the app shows the correct remaining time rather
 * than however far the ticks happened to get.
 */
export function useRestTimer(): RestTimerState {
	const [deadline, setDeadline] = useState<number | null>(null)
	const [total, setTotal] = useState(0)
	const [remaining, setRemaining] = useState<number | null>(null)

	const alertRef = useRef<RestAlert | null>(null)
	// Guards against re-firing the alert on every tick once it reaches zero.
	const hasFiredRef = useRef(false)

	useEffect(() => {
		const alert = createRestAlert()
		alertRef.current = alert
		return () => {
			alertRef.current = null
			alert.dispose()
		}
	}, [])

	useEffect(() => {
		if (deadline === null) {
			setRemaining(null)
			return
		}

		const update = () => {
			const left = remainingSeconds(deadline, Date.now())
			setRemaining(left)
			if (left === 0 && !hasFiredRef.current) {
				hasFiredRef.current = true
				alertRef.current?.fire()
			}
		}

		update()
		const intervalId = setInterval(update, TICK_MS)
		// Coming back from the background must correct the display immediately
		// rather than waiting out a throttled tick.
		document.addEventListener('visibilitychange', update)

		return () => {
			clearInterval(intervalId)
			document.removeEventListener('visibilitychange', update)
		}
	}, [deadline])

	const start = useCallback((seconds: number) => {
		if (!Number.isFinite(seconds) || seconds <= 0) return
		// Called from the tap that completes a set, which is the only moment a
		// browser will let the audio context start.
		alertRef.current?.prime()
		hasFiredRef.current = false
		setTotal(seconds)
		setDeadline(Date.now() + seconds * 1000)
	}, [])

	const extend = useCallback(() => {
		setDeadline(current => {
			if (current === null) return current
			// Extend from now when rest has already elapsed, so "+15s" always
			// buys a further fifteen seconds instead of a fraction of them.
			const base = Math.max(current, Date.now())
			return base + REST_TIMER_EXTEND_SECONDS * 1000
		})
		setTotal(current => current + REST_TIMER_EXTEND_SECONDS)
		hasFiredRef.current = false
	}, [])

	const dismiss = useCallback(() => {
		setDeadline(null)
		setTotal(0)
		hasFiredRef.current = false
	}, [])

	return {
		remaining,
		total,
		isOver: remaining === 0,
		start,
		extend,
		dismiss,
	}
}
