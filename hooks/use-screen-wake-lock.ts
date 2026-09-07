import { useEffect, useRef, useState } from 'react'

/**
 * `unsupported` - the browser has no Wake Lock API (iOS Safari before 16.4,
 * Firefox). `blocked` - the API exists but refused, which the platform does on
 * battery saver and for non-user-visible documents. Neither is an error worth
 * showing: training continues either way.
 */
export type WakeLockStatus = 'idle' | 'active' | 'unsupported' | 'blocked'

// `navigator.wakeLock` is typed as always present, so the runtime check has to
// be a property probe rather than a truthiness test on the property itself.
const isSupported = () =>
	typeof navigator !== 'undefined' && 'wakeLock' in navigator

/**
 * Hold a screen wake lock while `enabled` is true, so the display does not
 * sleep between sets.
 *
 * The browser releases the lock by itself whenever the document is hidden and
 * does not restore it on return, so this re-acquires on `visibilitychange`
 * rather than assuming one request lasts the whole session.
 */
export function useScreenWakeLock(enabled: boolean): WakeLockStatus {
	const [status, setStatus] = useState<WakeLockStatus>('idle')
	const sentinelRef = useRef<WakeLockSentinel | null>(null)

	useEffect(() => {
		if (!enabled) return

		if (!isSupported()) {
			setStatus('unsupported')
			return
		}

		// Guards a request that resolves after this effect was torn down; the
		// sentinel would otherwise leak and keep the screen awake for good.
		let cancelled = false

		const releaseSentinel = (sentinel: WakeLockSentinel | null) => {
			// Already released by the platform is the normal case, not a failure.
			sentinel?.release().catch(() => {})
		}

		const acquire = async () => {
			if (cancelled) return
			// A request against a hidden document rejects, so do not spend one.
			if (document.visibilityState !== 'visible') return
			if (sentinelRef.current) return

			try {
				const sentinel = await navigator.wakeLock.request('screen')

				if (cancelled) {
					releaseSentinel(sentinel)
					return
				}

				sentinelRef.current = sentinel
				setStatus('active')

				sentinel.addEventListener('release', () => {
					// Only clear if this is still the lock we are holding: a later
					// re-acquisition must not be reset by an older sentinel.
					if (sentinelRef.current === sentinel) {
						sentinelRef.current = null
						setStatus('idle')
					}
				})
			} catch {
				if (!cancelled) setStatus('blocked')
			}
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') void acquire()
		}

		void acquire()
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			cancelled = true
			document.removeEventListener('visibilitychange', handleVisibilityChange)
			const held = sentinelRef.current
			sentinelRef.current = null
			releaseSentinel(held)
		}
	}, [enabled])

	return status
}
